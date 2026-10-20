# X1 Visual Sandbox — Living Execution Workbook
Mission: X1-VISUAL-SANDBOX-20261020 · Owner: Strategic Minds AI · State: IN PROGRESS
Updated: 2026-10-20 · Scope: isolated feature branches, read-only operator monitoring.

## Goal
Give Visual X1 a production-grade **visual coding operations workspace** fed by the existing X1 controller, workers, Cloud Browser and independent Guardian. X1 Launch Engine consumes the same restricted telemetry and retains its own customer permissions. Local Docker/Ollama remain private on JARVIS-COMMAND. ChatGPT is the planning/orchestration surface through authenticated account connectors; it is not a transferable model endpoint or a persistent worker.

## Canonical sources pinned for this change
| Source | Pinned baseline | Authority |
|---|---|---|
| Strategic-Minds-AI/visual-x1-platform | main bb68356c9a20802a0fe3b5c92df05bb1cac3e201 | UI / editor |
| Strategic-Minds-AI/x1-launch-engine | main d128f889e0a5fe0fb62cce112a963a40f3f2b80b | website generator / admin |
| Local JARVIS | C:\\_Strategic_Minds_AI_OS\\70_X1_GPT_INFINITY_SYSTEM\\00_CONTROL | operational workbook |
| Supabase staging | X1 AI Hub Staging uvdkzsbjackpjvpoxtyk | durable queue / leases |
| Supabase production | X1 AI Hub vgsmyhqqtkkluhypxyua | protected data |
No production mutation is authorized by this workbook.

## Architecture / contracts
1. Visual X1 -> authenticated Base44 x1Bridge -> fixed-path X1 status endpoints. All read-only; no user-provided target URLs.
2. Launch Engine -> GET /api/runtime-status -> verified Supabase user identity + explicit X1_ADMIN_USER_IDS allowlist -> fixed HTTPS X1 endpoints. Return status codes only.
3. Local JARVIS -> existing loopback /health and Ollama /api/version,/api/tags via existing machine bridge; future sanitized agent snapshots must be published only by an authorized existing worker/receipt bus.
4. Keep one existing queue / lease owner / scheduled reconciler. No second queue, worker dispatcher, reconciler, Docker control socket, or public Ollama listener.
5. Run isolated build job -> store source SHA + task ID -> deterministic tests -> independent Guardian read of exact SHA -> preview -> separately authorized production gate.

## Live checklist (not self-certified)
| ID | Deliverable | Status | Acceptance / evidence |
|---|---|---|---|
| VS-01 | Verify two repo identities/write access | PASS | GitHub get_repo permissions; exact branches |
| VS-02 | Visual X1 side drawer with existing X1 bridge | IMPLEMENTED / UNTESTED | Component and style in feature branch; visual/browser verification pending |
| VS-03 | Launch Engine admin runtime summary | IMPLEMENTED / UNTESTED | Admin API + protected UI + test suite in feature branch |
| VS-04 | Launch auth negative/unit test | NOT RUN | CI output pending |
| VS-05 | Docker, Ollama, control-plane local inspection | BLOCKED | Desktop Commander online but command transport timed out; do not infer health |
| VS-06 | Existing queue and Guardian independent E2E | BLOCKED | P0-01 signed auth, P0-02 no fresh integrated cycle, P0-03 private SHA validator access |
| VS-07 | Authenticated Cloud Browser E2E | BLOCKED | P0-04 Cloud Browser 401 in canonical P0 matrix |
| VS-08 | Local Ollama inference and performance baseline | NOT RUN | Probe actual model tag, small inference, latency and resource use |
| VS-09 | Production deploy/merge | NOT AUTHORIZED | Exact SHA, independent release receipt, target-specific approval |
| VS-10 | Plugin + skill factory | IN PROGRESS | Validated skills-only plugin; no false account-to-Docker bridge claims |
| VS-11 | Native GPT Project synchronization | BLOCKED | No supported verified native Project write/read-back |

## UX benchmark decisions (public documented patterns, not copied assets)
- OpenHands Agent Canvas (https://github.com/OpenHands/OpenHands): model multi-backend coding agent visibility and isolated Docker workspaces; adopt separation of worker and sandbox.
- LangSmith Studio (https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/studio.mdx): graph/run inspection, prompt and tool traces; adopt inspectable per-step evidence.
- n8n (https://docs.n8n.io/workflows/executions/all-executions/): execution list, failure filters and retries; adopt per-task audit and explicit retry boundaries.
Reject a second agent control plane / scheduler simply to obtain these UX features.

## Runtime hardening controls
- Ollama binds to 127.0.0.1:11434; do not public-forward or store model prompts/keys in client JS.
- Docker socket never mounted into the public web process. Coding agents execute isolated, resource-limited work with network restrictions, dependency pinning, artifacts quarantined until checked.
- Never stream raw Docker environment, hidden volume data, or arbitrary console output to public UI. Use redacted names/counts and signed receipts only.
- Server-side tenant/admin guard; session expiration, deny-by-default action allowlists; strictly separate read/execute authority.
- Max 3 reversible repair attempts, cooldown, no self-approval, idempotent existing X1 job ID, dry-run and rollback reference.
- Model routing: detect installed Ollama tags and hardware before choosing a local code model; use schema-bound inference and independent validators; choose low-cost routing by task.

## Current risks
R1: Existing Base44 dependency remains in Visual X1; removing it is a separate bounded migration with parity tests.
R2: An X1 HTTP 200 is transport only, not authenticated task execution, actual inference, or Guardian approval.
R3: Connected ChatGPT plugins grant only their own scoped access; do not export ChatGPT account state or credentials.
R4: User-facing launch engine is public; operational data must remain admin-only.
R5: No fresh proof of Docker/Ollama, Cloud Browser, queue or Guardian functioning together; launch readiness BLOCKED.

## Test matrix and acceptance gate
- [ ] Visual: drawer open/close, keyboard focus, mobile view, no broken editor canvas.
- [ ] Auth: no token -> 401; invalid user -> 403; admin -> redacted health; unsupported method -> 405.
- [ ] Integrity: payload cannot inject URLs, commands or HTML; private access token never appears in output.
- [ ] Queue: exactly one synthetic job through existing lease runner, replays deduplicated, receipt task+SHA match.
- [ ] Runtime: Docker health, Ollama tags+inference, resource budget, no unauthenticated LAN exposure.
- [ ] Browser: actual authenticated Cloud Browser session and screenshot/console evidence.
- [ ] Guardian: separate principal verifies source SHA and test artifacts, attests receipt.
- [ ] Preview: deploy source SHA mapping, cross-repository smoke flow and rollback.
- [ ] Release: >=95/100 benchmark target only if defined rubric + independent evidence; all critical security controls pass regardless of numeric score.

## Handoff / next action
Branch VS: feat/x1-visual-sandbox-integrated-20261020
Branch WLE: feat/x1-visual-sandbox-runtime-20261020
First run CI and independent review on these exact branches; repair any failures. Then restore stable Remote Desktop tool transport and read-only Docker/Ollama health; do NOT dispatch duplicates. After P0-01 and P0-03 are solved, execute exactly one staging synthetic task through the existing queue and attest with Guardian. Do not promote to main/production until receipt-backed acceptance is complete.

### Branch reconciliation — 2026-10-20
Original PR #1 became conflicted because upstream main changed VisualEditorWorkspace to use EditorTabStrip and EditorPane. New branch feat/x1-visual-sandbox-integrated-20261020 is based on main b382c2e212948de56b5712fcf4329534ace6c100. Migrate the sandbox drawer and mount on the tabbed shell, not the former monolithic editor. Previous PR remains historical and must not be merged.
