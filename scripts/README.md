# scripts

## `scan-new-projects.mjs`

Daily job triggered by `.github/workflows/daily-project-scan.yml`. Finds new
Vercel-deployed projects under `github.com/nadvolod` and opens PRs that:

1. Add a project card to `app/page.tsx` (with an AI-generated cover image in
   `public/<slug>.jpg`).
2. Drop LinkedIn and X launch-post drafts into `social-posts/`.
3. Update the "Latest Project" block in `nadvolod/nadvolod` README (separate
   PR in that repo).

### Required repository secrets

| Secret               | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `VERCEL_TOKEN`       | Read-only token for `api.vercel.com` — resolves a repo to its prod URL. |
| `VERCEL_TEAM_ID`     | Optional. Team ID (`team_…`) if projects live under a team.             |
| `VERCEL_TEAM_SLUG`   | Optional alternative to `VERCEL_TEAM_ID` — the team slug (e.g. `ultimateqa`). |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key. Used for text + image generation.                |
| `NADVOLOD_PAT`       | Fine-grained PAT with `contents:write` + `pull-requests:write` on `nadvolod/nadvolod`. |

`GITHUB_TOKEN` is auto-provided by Actions and is used to list public repos
and open the PR in this repo.

### Model selection

Defaults (override via workflow `env:` if desired):

- `TEXT_MODEL=anthropic/claude-sonnet-4-6`
- `IMAGE_MODEL=openai/gpt-image-1`

### Running locally

```
GITHUB_TOKEN=...  VERCEL_TOKEN=...  AI_GATEWAY_API_KEY=...  NADVOLOD_PAT=... \
  node scripts/scan-new-projects.mjs
```

The script is idempotent: if every reachable Vercel URL under `nadvolod` is
already listed on `app/page.tsx`, it exits cleanly and the workflow logs a
no-op.

### README marker block in `nadvolod/nadvolod`

The script looks for these markers in the profile README and replaces the
block between them (or prepends a new block if missing):

```
<!-- LATEST_PROJECT:START -->
<!-- LATEST_PROJECT:END -->
```
