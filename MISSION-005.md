# Mission 005 — Public Launch (preview, fail-closed)

Public browsing requires no login. Research API has no user passphrase; OpenAI secret stays server-side. This branch is **not ready for public production** until shared rate limiting, budget controls, and validation are completed.

## Required Preview environment variables
- OPENAI_API_KEY: existing secret
- UPSTASH_REDIS_REST_URL: Upstash Redis REST endpoint (from Upstash console)
- UPSTASH_REDIS_REST_TOKEN: Upstash REST token, Sensitive
- MAKTO_RATE_SALT: random private 32+ character string, Sensitive
- Optional MAKTO_PER_IP_MINUTE_LIMIT: 2 (clamped to 1–5)
- Optional MAKTO_GLOBAL_DAILY_LIMIT: 20 (clamped to 1–100)

No login or MAKTO_ACCESS_KEY is required on this branch. Missing Redis settings return HTTP 503; rate limit reached returns 429. Redis increments are shared across deployments and requests. Daily cap is UTC calendar day, and counts requests before the OpenAI call, including failed provider requests. Rate limits are **not** a billing hard stop. Set project budgets and alerts in the OpenAI dashboard and verify financial exposure independently.

## Launch checklist
1. Configure Redis REST credentials for Preview. Never paste tokens into GitHub or chat.
2. Redeploy Preview branch, confirm /research.html has no access key field.
3. Verify POST /api/research returns 503 with Redis disabled, 429 after limit, and responds with verified citations when configured.
4. Verify STL viewer and engineering cockpit on mobile.
5. Add anti-bot challenges, abuse detection, observability, integration tests and a hard cost-enforcement strategy before opening public production.
6. Review branch and merge only after explicit production release approval.

## Boundaries
Projects remain in local browser storage; no cloud sync. 3D viewer is STL inspection, not parametric CAD or simulation. No autonomous agents or multi-user accounts. GitHub OAuth work in Mission 004 is intentionally not merged here.
