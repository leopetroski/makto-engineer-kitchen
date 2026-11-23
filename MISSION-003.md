# MAKTO Missions 002–003: Integrated Engineering Workspace (development)

## Entry points
- `engine.html`: project pipeline, requirements, engineering notebook, weighted decision matrix, source register, audit timeline, JSON memory import/export.
- `research.html`: AI-assisted web research through `/api/research`.
- `viewer.html`: interactive 3D STL inspector (Three.js via esm.sh CDN).

## Vercel environment configuration
Set **server-side** environment variables in the Vercel project:
- `OPENAI_API_KEY`: OpenAI API key, kept server-side. Never commit it or paste it into chat.
- `MAKTO_ACCESS_KEY`: a long random private access passphrase, entered by the operator in the research form. Never commit it.
- Optional `MAKTO_MODEL`: model supporting Responses API and web_search_preview (default `gpt-4.1-mini`). Verify model/tool availability and billing before enabling.

Redeploy after setting variables. The research endpoint is blocked until an access key is configured. A shared passphrase is only a temporary access gate, **not production-grade authentication**. Add identity-based auth, per-user quotas, persistent rate limits, observability, budget caps and automated tests before public rollout. API calls can incur costs.

## Honest boundaries
- Research is a single request, not autonomous multi-agent orchestration.
- The source register is manually curated; AI citations appear only in the research page and are not yet synced to projects.
- 3D viewer supports local STL inspection, not STEP, CAD editing, simulation or structural verification.
- Memory is browser-local and may disappear when site data is cleared. Export regularly.
- Decision matrix scores are subjective and must not be presented as measured engineering performance.
- No production code has been modified by this branch; do not merge without review and testing.

## Test checklist
1. Create a project, edit requirements, add options, vary weights, export/import JSON.
2. Verify no unsafe HTML is rendered from user-entered text.
3. Load ASCII and binary STL files, rotate/zoom and reset.
4. Verify /api/research returns 401 with wrong access key, 503 with missing configuration and 200 with valid credentials.
5. Verify AI citations and timeouts, check mobile viewport and Vercel deployment logs.
6. Verify access controls, billing limits, and authentication before exposing the endpoint publicly.
