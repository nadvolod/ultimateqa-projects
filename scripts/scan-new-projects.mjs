#!/usr/bin/env node
// Scans nadvolod's public GitHub repos for ones that ship a public Vercel
// deployment and are not yet listed on the UltimateQA portfolio homepage.
// When one is found, it:
//   - generates title/summary/tags/metric via an LLM (AI Gateway)
//   - generates a cover image via AI Gateway image generation
//   - inserts a project entry into app/page.tsx
//   - writes LinkedIn and X post drafts into social-posts/
//   - opens a PR in nadvolod/nadvolod updating the "Latest Project" block
//   - writes outputs for the GitHub Actions workflow to open a PR in this repo

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';

const ROOT = process.cwd();
const PAGE_PATH = path.join(ROOT, 'app/page.tsx');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SOCIAL_DIR = path.join(ROOT, 'social-posts');
const USER = 'nadvolod';

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';
const TEXT_MODEL = process.env.TEXT_MODEL || 'anthropic/claude-sonnet-4-6';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'openai/gpt-image-1';

const {
  GITHUB_TOKEN,
  VERCEL_TOKEN,
  VERCEL_TEAM_ID,
  VERCEL_TEAM_SLUG,
  AI_GATEWAY_API_KEY,
  NADVOLOD_PAT,
  GITHUB_OUTPUT,
  GITHUB_STEP_SUMMARY,
} = process.env;

for (const [k, v] of Object.entries({ GITHUB_TOKEN, VERCEL_TOKEN, AI_GATEWAY_API_KEY, NADVOLOD_PAT })) {
  if (!v) die(`Missing required env var: ${k}`);
}

const log = (...args) => console.log('[scan]', ...args);

run().catch((err) => {
  console.error('[scan] fatal:', err);
  writeSummary(`## ❌ Daily project scan failed\n\n\`\`\`\n${err?.stack || err}\n\`\`\`\n`);
  process.exit(1);
});

async function run() {
  log('Reading existing project URLs from app/page.tsx');
  const pageContent = await readFile(PAGE_PATH, 'utf8');
  const existingUrls = extractExistingUrls(pageContent);
  log(`  ${existingUrls.size} URLs already listed`);

  log(`Listing public repos for @${USER}`);
  const repos = await listUserRepos(USER);
  log(`  ${repos.length} public repos`);

  log('Probing each repo for a public Vercel production URL');
  let chosen = null;
  for (const repo of repos) {
    const url = await findVercelProdUrl(repo);
    if (!url) continue;
    if (existingUrls.has(normalizeUrl(url))) {
      log(`  ✗ ${repo.name} → ${url} (already on homepage)`);
      continue;
    }
    const reachable = await isPubliclyReachable(url);
    if (!reachable) {
      log(`  ✗ ${repo.name} → ${url} (not reachable)`);
      continue;
    }
    log(`  ✓ ${repo.name} → ${url}`);
    chosen = { repo, url };
    break;
  }

  if (!chosen) {
    log('No new qualifying project found. Nothing to do.');
    writeOutput('new_project', 'false');
    writeSummary(`## 🟡 Daily project scan — no new project found\n\nScanned ${repos.length} repos. None had a new public Vercel URL.\n`);
    return;
  }

  const { repo, url } = chosen;
  const slug = slugify(repo.name);
  log(`Fetching README for ${repo.full_name}`);
  const readme = await fetchReadme(repo.full_name);

  log('Generating project metadata via AI Gateway');
  const meta = await generateMetadata({ repo, url, readme });
  log(`  title: ${meta.title}`);
  log(`  tags:  ${meta.tags.join(', ')}`);

  log('Generating cover image via AI Gateway');
  const imageBuffer = await generateImage(meta.imagePrompt);
  const imageRelPath = `/${slug}.jpg`;
  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(path.join(PUBLIC_DIR, `${slug}.jpg`), imageBuffer);
  log(`  wrote public${imageRelPath}`);

  const project = {
    title: meta.title,
    summary: meta.summary,
    tags: meta.tags,
    metric: meta.metric,
    image: imageRelPath,
    demoUrl: url,
  };

  log('Inserting project into app/page.tsx');
  const updated = insertProject(pageContent, project);
  await writeFile(PAGE_PATH, updated);

  log('Writing social media drafts');
  await mkdir(SOCIAL_DIR, { recursive: true });
  const datePrefix = new Date().toISOString().slice(0, 10);
  const { linkedin, x } = await generateSocialPosts({ project, repo, url });
  await writeFile(path.join(SOCIAL_DIR, `${datePrefix}-${slug}-linkedin.md`), linkedin);
  await writeFile(path.join(SOCIAL_DIR, `${datePrefix}-${slug}-x.md`), x);

  log('Opening PR on nadvolod/nadvolod with updated README');
  const nadvolodPrUrl = await updateNadvolodReadme({ project, repo, url });
  log(`  nadvolod PR: ${nadvolodPrUrl}`);

  writeOutput('new_project', 'true');
  writeOutput('project_slug', slug);
  writeOutput('project_title', project.title);
  writeOutput('project_url', url);
  writeOutput('nadvolod_pr_url', nadvolodPrUrl);

  writeSummary([
    `## ✅ Daily project scan — added ${project.title}`,
    '',
    `- **Repo:** ${repo.full_name}`,
    `- **Live URL:** ${url}`,
    `- **Tags:** ${project.tags.join(', ')}`,
    `- **Metric:** ${project.metric}`,
    `- **nadvolod README PR:** ${nadvolodPrUrl}`,
    '',
    '### Generated assets',
    `- \`public${imageRelPath}\``,
    `- \`social-posts/${datePrefix}-${slug}-linkedin.md\``,
    `- \`social-posts/${datePrefix}-${slug}-x.md\``,
    '',
  ].join('\n'));
}

function die(msg) { console.error(`[scan] ${msg}`); process.exit(1); }

function writeOutput(key, value) {
  if (!GITHUB_OUTPUT) return;
  const safe = String(value).replace(/\r?\n/g, ' ');
  return appendFile(GITHUB_OUTPUT, `${key}=${safe}\n`);
}

function writeSummary(markdown) {
  if (!GITHUB_STEP_SUMMARY) { console.log(markdown); return; }
  return appendFile(GITHUB_STEP_SUMMARY, markdown + '\n');
}

// --------- page.tsx parsing ---------

function extractExistingUrls(content) {
  const urls = new Set();
  const re = /(?:demoUrl|githubUrl|caseStudyUrl)\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(content))) urls.add(normalizeUrl(m[1]));
  return urls;
}

function normalizeUrl(u) {
  try {
    const p = new URL(u);
    return (p.origin + p.pathname).replace(/\/$/, '').toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

function insertProject(content, project) {
  const endMarker = ']\n\nconst allTags';
  const endIdx = content.indexOf(endMarker);
  if (endIdx === -1) die('Could not locate projects array terminator in app/page.tsx');

  const idRe = /id:\s*(\d+)/g;
  let maxId = 0, m;
  while ((m = idRe.exec(content.slice(0, endIdx)))) maxId = Math.max(maxId, parseInt(m[1], 10));

  const entry = [
    '  {',
    `    id: ${maxId + 1},`,
    `    title: ${JSON.stringify(project.title)},`,
    `    summary: ${JSON.stringify(project.summary)},`,
    `    tags: [${project.tags.map((t) => JSON.stringify(t)).join(', ')}],`,
    `    metric: ${JSON.stringify(project.metric)},`,
    `    image: ${JSON.stringify(project.image)},`,
    `    demoUrl: ${JSON.stringify(project.demoUrl)},`,
    '  },',
    '',
  ].join('\n');

  return content.slice(0, endIdx) + entry + content.slice(endIdx);
}

// --------- GitHub ---------

async function ghFetch(url, init = {}, token = GITHUB_TOKEN) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ultimateqa-project-scanner',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub ${init.method || 'GET'} ${url} → ${res.status}: ${body.slice(0, 300)}`);
  }
  return res;
}

async function listUserRepos(user) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const res = await ghFetch(
      `https://api.github.com/users/${user}/repos?per_page=100&sort=pushed&direction=desc&type=owner&page=${page}`
    );
    const batch = await res.json();
    if (!batch.length) break;
    for (const r of batch) if (!r.fork && !r.archived && !r.private) out.push(r);
    if (batch.length < 100) break;
  }
  return out;
}

async function fetchReadme(fullName) {
  try {
    const res = await ghFetch(`https://api.github.com/repos/${fullName}/readme`);
    const json = await res.json();
    return Buffer.from(json.content || '', json.encoding || 'base64').toString('utf8').slice(0, 8000);
  } catch (err) {
    log(`  (no README: ${err.message})`);
    return '';
  }
}

// --------- Vercel ---------

let _vercelTeamId = VERCEL_TEAM_ID || null;
let _vercelProjectsByRepo = null; // Map<"org/repo", project>

async function vercelFetch(pathAndQuery) {
  const url = `https://api.vercel.com${pathAndQuery}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Vercel GET ${pathAndQuery} → ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function resolveVercelTeamId() {
  if (_vercelTeamId) return _vercelTeamId;
  if (!VERCEL_TEAM_SLUG) return null;
  const team = await vercelFetch(`/v2/teams?slug=${encodeURIComponent(VERCEL_TEAM_SLUG)}`);
  _vercelTeamId = team?.id || team?.teams?.[0]?.id || null;
  if (!_vercelTeamId) throw new Error(`Could not resolve team slug "${VERCEL_TEAM_SLUG}" to an ID`);
  log(`  resolved team slug "${VERCEL_TEAM_SLUG}" → ${_vercelTeamId}`);
  return _vercelTeamId;
}

async function loadVercelProjectsByRepo() {
  if (_vercelProjectsByRepo) return _vercelProjectsByRepo;
  const teamId = await resolveVercelTeamId();
  const map = new Map();
  let from = null, pages = 0;
  while (pages++ < 20) {
    const qs = new URLSearchParams({ limit: '100' });
    if (teamId) qs.set('teamId', teamId);
    if (from) qs.set('from', String(from));
    const data = await vercelFetch(`/v9/projects?${qs}`);
    for (const p of data.projects || []) {
      const link = p.link;
      if (link?.type === 'github' && link.org && link.repo) {
        map.set(`${link.org.toLowerCase()}/${link.repo.toLowerCase()}`, p);
      }
    }
    if (!data.pagination?.next) break;
    from = data.pagination.next;
  }
  log(`  loaded ${map.size} Vercel projects linked to GitHub repos`);
  _vercelProjectsByRepo = map;
  return map;
}

async function findVercelProdUrl(repo) {
  const projects = await loadVercelProjectsByRepo();
  const project = projects.get(repo.full_name.toLowerCase());
  if (!project) return null;

  const prodAlias = project.targets?.production?.alias || [];
  const domain = prodAlias.find((a) => !a.includes('-git-')) || prodAlias[0];
  if (domain) return `https://${domain}`;

  const deploymentUrl = project.targets?.production?.url;
  return deploymentUrl ? `https://${deploymentUrl}` : null;
}

async function isPubliclyReachable(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!res.ok) return false;
    const body = await res.text();
    if (/vercel.*authentication/i.test(body) || /log in to vercel/i.test(body)) return false;
    return true;
  } catch {
    return false;
  }
}

// --------- AI Gateway ---------

async function aiChatJson(systemPrompt, userPrompt) {
  const res = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`AI Gateway chat ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  try { return JSON.parse(text); }
  catch { throw new Error(`AI Gateway did not return valid JSON: ${text.slice(0, 400)}`); }
}

const ALLOWED_TAGS = [
  'Web App', 'Mobile', 'SaaS', 'E-Commerce', 'Client Work', 'Healthcare',
  'FinTech', 'AI', 'AI Automation', 'Enterprise', 'Marketplace', 'Education',
  'Accessibility', 'DevOps', 'Innovation', 'Framework', 'Private', 'Real Estate',
  'Investment', 'Biotech', 'Productivity', 'Lead Generation', 'Personal Development',
  'Testing', 'Portfolio', 'Personal Brand', 'Platform', 'Services',
];

async function generateMetadata({ repo, url, readme }) {
  const system = [
    'You write concise, marketing-grade portfolio copy for software projects.',
    'Respond with STRICT JSON matching this schema:',
    '{',
    '  "title": "Product Name - Short Positioning Tagline",',
    '  "summary": "one or two sentences describing what it does and for whom",',
    '  "tags": ["Tag1","Tag2","Tag3"],',
    '  "metric": "short comma-separated list of features/outcomes, 3-6 words each",',
    '  "imagePrompt": "a visual prompt for an AI image model to generate a cover image (16:9, modern product hero shot, no text)"',
    '}',
    `"tags" MUST be 2-4 values chosen ONLY from this list: ${ALLOWED_TAGS.join(', ')}.`,
    'Do not include markdown fences. Return JSON only.',
  ].join('\n');

  const user = [
    `GitHub repo: ${repo.full_name}`,
    `Description: ${repo.description || '(none)'}`,
    `Live URL: ${url}`,
    `README (truncated):\n${readme || '(none)'}`,
  ].join('\n\n');

  const meta = await aiChatJson(system, user);
  meta.tags = Array.isArray(meta.tags) ? meta.tags.filter((t) => ALLOWED_TAGS.includes(t)) : [];
  if (!meta.tags.length) meta.tags = ['Web App'];
  for (const k of ['title', 'summary', 'metric', 'imagePrompt']) {
    if (typeof meta[k] !== 'string' || !meta[k].trim()) throw new Error(`AI metadata missing field: ${k}`);
  }
  return meta;
}

async function generateImage(prompt) {
  const res = await fetch(`${AI_GATEWAY_URL}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt: `${prompt}. Cinematic, modern, high detail, 16:9 composition, no text or letters.`,
      size: '1536x1024',
      n: 1,
    }),
  });
  if (!res.ok) throw new Error(`AI Gateway image ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  const item = data.data?.[0];
  if (!item) throw new Error('AI Gateway image response had no data');
  if (item.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item.url) {
    const img = await fetch(item.url);
    if (!img.ok) throw new Error(`Failed to download generated image: ${img.status}`);
    return Buffer.from(await img.arrayBuffer());
  }
  throw new Error('AI Gateway image response missing b64_json and url');
}

async function generateSocialPosts({ project, repo, url }) {
  const system = [
    'You write social media launch posts for a developer/entrepreneur audience.',
    'Return STRICT JSON: {"linkedin":"...","x":"..."}.',
    'LinkedIn: 3-6 short paragraphs, authentic founder voice, includes the live URL.',
    'X (Twitter): single post, ≤280 characters, 1-2 emojis max, includes the URL.',
    'No hashtag spam. No marketing clichés.',
  ].join('\n');

  const user = [
    `Project title: ${project.title}`,
    `Summary: ${project.summary}`,
    `Key features: ${project.metric}`,
    `Tags: ${project.tags.join(', ')}`,
    `Live URL: ${url}`,
    `Source repo: https://github.com/${repo.full_name}`,
  ].join('\n');

  const posts = await aiChatJson(system, user);
  const linkedin = `# LinkedIn — ${project.title}\n\n${(posts.linkedin || '').trim()}\n`;
  const x = `# X / Twitter — ${project.title}\n\n${(posts.x || '').trim()}\n`;
  return { linkedin, x };
}

// --------- nadvolod/nadvolod README update ---------

const README_START = '<!-- LATEST_PROJECT:START -->';
const README_END = '<!-- LATEST_PROJECT:END -->';

async function updateNadvolodReadme({ project, repo, url }) {
  const owner = USER, name = USER;
  const defaultBranchRes = await ghFetch(`https://api.github.com/repos/${owner}/${name}`, {}, NADVOLOD_PAT);
  const { default_branch } = await defaultBranchRes.json();

  const readmeRes = await ghFetch(
    `https://api.github.com/repos/${owner}/${name}/contents/README.md?ref=${default_branch}`,
    {}, NADVOLOD_PAT
  );
  const readmeJson = await readmeRes.json();
  const currentContent = Buffer.from(readmeJson.content, readmeJson.encoding || 'base64').toString('utf8');

  const block = [
    README_START,
    '',
    '## 🚀 Latest Project',
    '',
    `**[${project.title}](${url})**`,
    '',
    project.summary,
    '',
    `_Highlights:_ ${project.metric}`,
    '',
    `Source: [${repo.full_name}](https://github.com/${repo.full_name})`,
    '',
    README_END,
  ].join('\n');

  let newContent;
  if (currentContent.includes(README_START) && currentContent.includes(README_END)) {
    newContent = currentContent.replace(
      new RegExp(`${escapeRe(README_START)}[\\s\\S]*?${escapeRe(README_END)}`),
      block
    );
  } else {
    newContent = `${block}\n\n${currentContent}`;
  }

  if (newContent === currentContent) {
    log('  nadvolod README already up to date');
    return '(no changes needed)';
  }

  const branch = `auto/latest-project-${slugify(repo.name)}-${Date.now()}`;

  const refRes = await ghFetch(
    `https://api.github.com/repos/${owner}/${name}/git/ref/heads/${default_branch}`,
    {}, NADVOLOD_PAT
  );
  const { object: baseObj } = await refRes.json();

  await ghFetch(`https://api.github.com/repos/${owner}/${name}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseObj.sha }),
    headers: { 'Content-Type': 'application/json' },
  }, NADVOLOD_PAT);

  await ghFetch(`https://api.github.com/repos/${owner}/${name}/contents/README.md`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `chore: update Latest Project to ${project.title}`,
      content: Buffer.from(newContent, 'utf8').toString('base64'),
      sha: readmeJson.sha,
      branch,
    }),
    headers: { 'Content-Type': 'application/json' },
  }, NADVOLOD_PAT);

  const prRes = await ghFetch(`https://api.github.com/repos/${owner}/${name}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Update Latest Project: ${project.title}`,
      head: branch,
      base: default_branch,
      body: [
        `Auto-generated by the UltimateQA project scanner.`,
        ``,
        `**Project:** ${project.title}`,
        `**Live:** ${url}`,
        `**Source:** https://github.com/${repo.full_name}`,
      ].join('\n'),
    }),
    headers: { 'Content-Type': 'application/json' },
  }, NADVOLOD_PAT);
  const pr = await prRes.json();
  return pr.html_url;
}

// --------- utils ---------

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
