# Mission 004 — GitHub sign-in (preview only)

This replaces the research passphrase field with GitHub OAuth sign-in. The OpenAI key remains server-side. No code is merged into main.

## Required Vercel Preview variables
- `OPENAI_API_KEY` — existing server-side OpenAI secret
- `MAKTO_GITHUB_CLIENT_ID` — GitHub OAuth App client ID
- `MAKTO_GITHUB_CLIENT_SECRET` — GitHub OAuth App client secret, Sensitive
- `MAKTO_GITHUB_USER_ID` — numeric GitHub user ID of the one authorized account (not username)
- `MAKTO_SESSION_SECRET` — new cryptographically random secret of 32+ bytes, Sensitive
- `MAKTO_BASE_URL` — exact stable Preview deployment origin, e.g. https://example.vercel.app (no path)

## GitHub OAuth App
GitHub Settings → Developer settings → OAuth Apps → New OAuth App. Set Homepage URL to MAKTO_BASE_URL and Authorization callback URL to `MAKTO_BASE_URL/api/auth/callback`. Register app, then configure Vercel variables. GitHub OAuth callback URLs must match the deployment used. Use a stable preview alias or update the OAuth App and MAKTO_BASE_URL if preview hostname changes.

## Safety / limitations
- Preview only. Do not merge until verified end-to-end.
- This is single-owner GitHub OAuth; only the numeric allowlisted GitHub account can sign in.
- Signed HttpOnly Secure SameSite=Lax cookie expires after 7 days; OAuth state is checked.
- No public signup or multi-user permissions. No cloud memory, rate limiting, usage quotas or production identity platform yet.
- Browser-side UI check is cosmetic; the research endpoint validates the signed session independently.
- Before production: add rate limits, usage budgets, CSRF defenses for future state-changing actions, audit logs, session revocation/rotation and automated integration tests.
- Old MAKTO_ACCESS_KEY may remain in Vercel but is no longer read by this branch's research endpoint. Remove only after successful migration.

## Test
1. Confirm /api/auth/me returns 401 signed out.
2. Confirm POST /api/research returns 401 signed out.
3. Sign in through /api/auth/start using allowlisted GitHub account, verify /api/auth/me returns authenticated.
4. Test research; verify citations and costs.
5. Test non-allowlisted GitHub account is rejected.
6. Test logout POST /api/auth/logout clears session.
