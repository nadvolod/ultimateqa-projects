// Integration-style tests for the scanner duplicate-detection logic.
// Covers the pure utility functions in scanner-utils.mjs and simulates the
// candidate-filtering flow used by scan-new-projects.mjs.
//
// Run with: npm test

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUrl,
  extractExistingUrls,
  slugify,
  buildPendingSlugs,
} from './scanner-utils.mjs';

// ---------------------------------------------------------------------------
// Helpers used to simulate the candidate-selection loop from the scanner.
// This keeps the tests independent from I/O so they run without real tokens.
// ---------------------------------------------------------------------------

const EXCLUDED_REPOS = new Set(['ultimateqa-projects', 'ultimateqawebsite', 'magic-social']);

/**
 * Pure version of the candidate-selection logic from run() in
 * scan-new-projects.mjs. Returns the chosen candidate or null.
 *
 * @param {Array<{repo: string, url: string|null}>} candidates
 * @param {Set<string>} existingUrls   - from extractExistingUrls()
 * @param {Set<string>} pendingSlugs   - from buildPendingSlugs()
 * @returns {{repo: string, url: string}|null}
 */
function selectCandidate(candidates, existingUrls, pendingSlugs) {
  for (const c of candidates) {
    if (EXCLUDED_REPOS.has(c.repo)) continue;
    if (!c.url) continue;
    if (existingUrls.has(normalizeUrl(c.url))) continue;
    if (pendingSlugs.has(slugify(c.repo))) continue;
    return c;
  }
  return null;
}

// ---------------------------------------------------------------------------
// normalizeUrl
// ---------------------------------------------------------------------------

describe('normalizeUrl', () => {
  it('strips www. prefix', () => {
    assert.equal(normalizeUrl('https://www.example.com'), 'https://example.com');
  });

  it('strips trailing slash', () => {
    assert.equal(normalizeUrl('https://example.com/'), 'https://example.com');
  });

  it('lowercases host and path', () => {
    assert.equal(normalizeUrl('HTTPS://EXAMPLE.COM/Path'), 'https://example.com/path');
  });

  it('preserves a path without trailing slash', () => {
    assert.equal(normalizeUrl('https://example.com/foo/bar'), 'https://example.com/foo/bar');
  });

  it('returns the lowercased raw string when the input is not a valid URL', () => {
    assert.equal(normalizeUrl('not-a-url'), 'not-a-url');
    assert.equal(normalizeUrl('ALSO-NOT-A-URL'), 'also-not-a-url');
  });

  it('treats https://example.com and https://www.example.com/ as equal', () => {
    assert.equal(normalizeUrl('https://example.com'), normalizeUrl('https://www.example.com/'));
  });
});

// ---------------------------------------------------------------------------
// extractExistingUrls
// ---------------------------------------------------------------------------

describe('extractExistingUrls', () => {
  it('extracts demoUrl values', () => {
    const content = `demoUrl: "https://foo.com",`;
    const urls = extractExistingUrls(content);
    assert.ok(urls.has('https://foo.com'));
  });

  it('extracts githubUrl and caseStudyUrl values', () => {
    const content = `
      githubUrl: "https://github.com/user/repo",
      caseStudyUrl: "https://study.example.com/case",
    `;
    const urls = extractExistingUrls(content);
    assert.ok(urls.has('https://github.com/user/repo'));
    assert.ok(urls.has('https://study.example.com/case'));
  });

  it('normalises URLs when extracting (deduplicates www vs non-www)', () => {
    const content = `
      demoUrl: "https://www.example.com/",
      demoUrl: "https://example.com",
    `;
    const urls = extractExistingUrls(content);
    // Both should normalise to the same value → single entry
    assert.equal(urls.size, 1);
    assert.ok(urls.has('https://example.com'));
  });

  it('returns an empty set when there are no URL fields', () => {
    assert.equal(extractExistingUrls('const x = 1;').size, 0);
  });

  it('returns an empty set for an empty string', () => {
    assert.equal(extractExistingUrls('').size, 0);
  });
});

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('lowercases the input', () => {
    assert.equal(slugify('MyRepo'), 'myrepo');
  });

  it('replaces non-alphanumeric runs with a single hyphen', () => {
    assert.equal(slugify('my--repo name'), 'my-repo-name');
  });

  it('strips leading and trailing hyphens', () => {
    assert.equal(slugify('-repo-'), 'repo');
  });

  it('truncates at 60 characters', () => {
    const long = 'a'.repeat(70);
    assert.equal(slugify(long).length, 60);
  });

  it('passes through an already-valid slug unchanged', () => {
    assert.equal(slugify('kratos-rx'), 'kratos-rx');
  });
});

// ---------------------------------------------------------------------------
// buildPendingSlugs
// ---------------------------------------------------------------------------

describe('buildPendingSlugs', () => {
  // --- Positive (slugs ARE detected) ---

  it('extracts the slug from a correctly formatted branch name', () => {
    const slugs = buildPendingSlugs(['auto/new-project-kratos-rx-20260430-141500']);
    assert.ok(slugs.has('kratos-rx'));
  });

  it('extracts a single-word slug', () => {
    const slugs = buildPendingSlugs(['auto/new-project-myapp-20260101-090000']);
    assert.ok(slugs.has('myapp'));
  });

  it('handles multiple branches and builds a set of all slugs', () => {
    const branches = [
      'auto/new-project-foo-20260101-000000',
      'auto/new-project-bar-baz-20260201-120000',
    ];
    const slugs = buildPendingSlugs(branches);
    assert.ok(slugs.has('foo'));
    assert.ok(slugs.has('bar-baz'));
    assert.equal(slugs.size, 2);
  });

  // --- Negative (branches that should NOT produce slugs) ---

  it('returns an empty set for an empty iterable', () => {
    assert.equal(buildPendingSlugs([]).size, 0);
  });

  it('ignores branches that do not start with auto/new-project-', () => {
    const branches = ['main', 'feature/some-work', 'auto/other-thing-20260101-000000'];
    assert.equal(buildPendingSlugs(branches).size, 0);
  });

  it('ignores unrelated branches even when auto/new-project branches are also present', () => {
    const branches = [
      'main',
      'auto/new-project-kratosrx-20260430-141500',
    ];
    const slugs = buildPendingSlugs(branches);
    assert.equal(slugs.size, 1);
    assert.ok(slugs.has('kratosrx'));
  });

  // --- Boundary ---

  it('handles a branch name that lacks the timestamp suffix gracefully', () => {
    // Without the trailing -YYYYMMDD-HHMMSS the replace() is a no-op,
    // so the whole string after "auto/new-project-" becomes the slug.
    const slugs = buildPendingSlugs(['auto/new-project-no-timestamp']);
    assert.ok(slugs.has('no-timestamp'));
  });

  it('deduplicates slugs when the same repo appears in multiple branches', () => {
    const branches = [
      'auto/new-project-myapp-20260101-000000',
      'auto/new-project-myapp-20260102-120000',
    ];
    const slugs = buildPendingSlugs(branches);
    assert.equal(slugs.size, 1);
    assert.ok(slugs.has('myapp'));
  });

  it('accepts a Set as input (not just an Array)', () => {
    const set = new Set(['auto/new-project-fromset-20260101-000000']);
    const slugs = buildPendingSlugs(set);
    assert.ok(slugs.has('fromset'));
  });
});

// ---------------------------------------------------------------------------
// Integration: candidate selection with existingUrls + pendingSlugs
// ---------------------------------------------------------------------------

describe('candidate selection (integration)', () => {
  const EXISTING_PAGE_CONTENT = `
    demoUrl: "https://gifterxtalks.com/",
    demoUrl: "https://notemylife.com",
  `;

  // --- Positive ---

  it('selects a candidate that is neither on the homepage nor has an open PR', () => {
    const candidates = [{ repo: 'kratos-rx', url: 'https://kratosrx.vercel.app' }];
    const existingUrls = extractExistingUrls(EXISTING_PAGE_CONTENT);
    const pendingSlugs = buildPendingSlugs([]);

    const chosen = selectCandidate(candidates, existingUrls, pendingSlugs);

    assert.ok(chosen !== null);
    assert.equal(chosen.repo, 'kratos-rx');
  });

  it('selects the first candidate that passes all filters when several are provided', () => {
    const candidates = [
      { repo: 'gifterxtalks', url: 'https://gifterxtalks.com' },    // existing URL
      { repo: 'kratos-rx', url: 'https://kratosrx.vercel.app' },    // new → should win
      { repo: 'another', url: 'https://another.vercel.app' },
    ];
    const existingUrls = extractExistingUrls(EXISTING_PAGE_CONTENT);
    const pendingSlugs = buildPendingSlugs([]);

    const chosen = selectCandidate(candidates, existingUrls, pendingSlugs);

    assert.equal(chosen?.repo, 'kratos-rx');
  });

  it('skips first candidate (pending PR) and selects the second', () => {
    const candidates = [
      { repo: 'kratos-rx', url: 'https://kratosrx.vercel.app' },
      { repo: 'new-saas', url: 'https://newsaas.vercel.app' },
    ];
    const existingUrls = extractExistingUrls(EXISTING_PAGE_CONTENT);
    const pendingSlugs = buildPendingSlugs(['auto/new-project-kratos-rx-20260430-141500']);

    const chosen = selectCandidate(candidates, existingUrls, pendingSlugs);

    assert.equal(chosen?.repo, 'new-saas');
  });

  // --- Negative ---

  it('returns null when the candidate URL is already on the homepage', () => {
    const candidates = [{ repo: 'gifterxtalks', url: 'https://www.gifterxtalks.com/' }];
    const existingUrls = extractExistingUrls(EXISTING_PAGE_CONTENT);
    const pendingSlugs = buildPendingSlugs([]);

    assert.equal(selectCandidate(candidates, existingUrls, pendingSlugs), null);
  });

  it('returns null when the candidate has an open PR (pending slug)', () => {
    const candidates = [{ repo: 'kratos-rx', url: 'https://kratosrx.vercel.app' }];
    const existingUrls = extractExistingUrls(EXISTING_PAGE_CONTENT);
    const pendingSlugs = buildPendingSlugs(['auto/new-project-kratos-rx-20260430-141500']);

    assert.equal(selectCandidate(candidates, existingUrls, pendingSlugs), null);
  });

  it('returns null for an excluded repo', () => {
    const candidates = [{ repo: 'ultimateqa-projects', url: 'https://projects.ultimateqa.com' }];
    const existingUrls = extractExistingUrls(EXISTING_PAGE_CONTENT);
    const pendingSlugs = buildPendingSlugs([]);

    assert.equal(selectCandidate(candidates, existingUrls, pendingSlugs), null);
  });

  it('returns null when the candidate has no production URL', () => {
    const candidates = [{ repo: 'new-project', url: null }];
    const existingUrls = extractExistingUrls(EXISTING_PAGE_CONTENT);
    const pendingSlugs = buildPendingSlugs([]);

    assert.equal(selectCandidate(candidates, existingUrls, pendingSlugs), null);
  });

  it('returns null when all candidates are already on the homepage or have pending PRs', () => {
    const candidates = [
      { repo: 'gifterxtalks', url: 'https://gifterxtalks.com' },
      { repo: 'notemylife', url: 'https://notemylife.com' },
      { repo: 'kratos-rx', url: 'https://kratosrx.vercel.app' },
    ];
    const existingUrls = extractExistingUrls(EXISTING_PAGE_CONTENT);
    // kratos-rx is the only "new" URL but it has a pending PR
    const pendingSlugs = buildPendingSlugs(['auto/new-project-kratos-rx-20260430-141500']);

    assert.equal(selectCandidate(candidates, existingUrls, pendingSlugs), null);
  });

  // --- Boundary ---

  it('treats https://www.gifterxtalks.com/ as already listed (URL normalisation)', () => {
    const candidates = [{ repo: 'gifterxtalks', url: 'https://WWW.GIFTERXTALKS.COM/' }];
    const existingUrls = extractExistingUrls(EXISTING_PAGE_CONTENT);
    const pendingSlugs = buildPendingSlugs([]);

    assert.equal(selectCandidate(candidates, existingUrls, pendingSlugs), null);
  });

  it('returns null when there are no candidates at all', () => {
    assert.equal(selectCandidate([], new Set(), new Set()), null);
  });

  it('picks the sole valid candidate even when the pending-slugs set is large', () => {
    const manyCandidates = Array.from({ length: 50 }, (_, i) => ({
      repo: `project-${i}`,
      url: `https://project-${i}.vercel.app`,
    }));
    // Mark all but the last as pending
    const pendingBranches = manyCandidates.slice(0, 49).map(
      (c) => `auto/new-project-${slugify(c.repo)}-20260430-141500`
    );
    const pendingSlugs = buildPendingSlugs(pendingBranches);
    const existingUrls = new Set();

    const chosen = selectCandidate(manyCandidates, existingUrls, pendingSlugs);

    assert.equal(chosen?.repo, 'project-49');
  });
});
