// Pure utility functions shared between scan-new-projects.mjs and tests.

/**
 * Strips www., trailing slash, and lowercases a URL for stable comparison.
 * Returns the lowercased raw string if the input is not a valid URL.
 */
export function normalizeUrl(u) {
  try {
    const p = new URL(u);
    const host = p.hostname.replace(/^www\./i, '');
    return `${p.protocol}//${host}${p.pathname}`.replace(/\/$/, '').toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

/**
 * Returns a Set of normalised URLs already referenced in app/page.tsx content
 * (demoUrl, githubUrl, caseStudyUrl fields).
 */
export function extractExistingUrls(content) {
  const urls = new Set();
  const re = /(?:demoUrl|githubUrl|caseStudyUrl)\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(content))) urls.add(normalizeUrl(m[1]));
  return urls;
}

/**
 * Converts a string to a URL-safe, lowercase slug (max 60 chars).
 */
export function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

/**
 * Escapes a string for safe use inside a RegExp.
 */
export function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/**
 * Given an iterable of open PR branch names, returns a Set of project slugs
 * that already have a pending "add new project" PR.
 *
 * Expected branch format: auto/new-project-{slug}-YYYYMMDD-HHMMSS
 * Branches that do not start with "auto/new-project-" are ignored.
 */
export function buildPendingSlugs(branches) {
  return new Set(
    [...branches]
      .filter((b) => b.startsWith('auto/new-project-'))
      .map((b) => b.slice('auto/new-project-'.length).replace(/-\d{8}-\d{6}$/, ''))
  );
}
