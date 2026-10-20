# X1 Visual Sandbox — Integration Workbook and Resumable Handoff
Mission: X1-VISUAL-SANDBOX-20261020-01
Recorded: 2026-10-20 (America/New_York)
Owner scope: Strategic-Minds-AI; staging/branch only. No production release authority inferred.

## Goal and acceptance
Safely integrate generated Visual X1 and Launch Engine preview artifacts with existing local Docker/Ollama and canonical X1 queue. No new dispatcher, lease table, worker, scheduler or secrets surface.
1. Repositories, branches and exact source SHAs verified — PASS (provider readback).
2. Existing staging queue/lease/receipt and worker heartbeat inspected — PASS (read-only SQL).
3. Generated markup stays in opaque-origin iframe, including expanded view — IMPLEMENTED, deterministic test and browser QA pending.
4. Local Docker and Ollama tags/bind addresses and private inference tested — BLOCKED (Remote Desktop Commander calls timed out; no live model response).
5. One synthetic staging packet, lease, receipt and Guardian exact-SHA validation — NOT RUN (authorization/worker dispatch and independent QA pending).
6. Preview browser desktop/mobile tests, accessibility, performance, rollback — NOT RUN.
7. Production release — NOT AUTHORIZED.

## Rehydrated sources
- Visual X1: https://github.com/Strategic-Minds-AI/visual-x1-platform , main 5efeeedf471389f504b7fde9b4abc458188f8e93 at baseline.
- Launch Engine: https://github.com/Strategic-Minds-AI/x1-launch-engine , main d128f889e0a5fe0fb62cce112a963a40f3f2b80b at baseline.
- Visual X1 bridge: base44/functions/x1Bridge/entry.ts, read-only via allowlisted X1 API routes; protected routes require server-side token and tenant scope.
- Launch Engine: api/admin.js verifies Supabase bearer/user + operator allowlist; api/config.js publishes only anonymous client key, not service role.
- Canonical local source: C:\\_Strategic_Minds_AI_OS\\70_X1_GPT_INFINITY_SYSTEM\\00_CONTROL on JARVIS-COMMAND. CURRENT_STATUS.md read, 2026-10-19 historical state. Full master workbook/P0 reads remained pending with Remote Desktop Commander.
- Supabase staging project uvdkzsbjackpjvpoxtyk contains x1_work_queue, x1_task_leases, x1_execution_ledger, x1_audit_receipts, x1_worker_heartbeats (RLS enabled).
- Current query snapshot: queue 95 total (58 COMPLETED, 20 DEAD_LETTER, 17 BLOCKED); leases 147 total (87 FAILED, 54 COMPLETED, 6 RELEASED). Counts are historical cumulative, not proof of health.
- Latest observed worker: jarvis-local-power-grid-1 in preview ONLINE/SENSOR_ONLY, lease_requested=false on 2026-10-20. A heartbeat is not model inference or task execution.
- Historical Guardian receipt type X1_GUARDIAN_EVIDENCE_VERIFICATION last observed 2026-10-11; independent_validation last observed 2026-10-17; neither validates the new branch SHA.

## Decision record
ADR-X1VS-01: Generated HTML is UNTRUSTED even if created by a local open-source model. The inline preview already sandboxed scripts, but its OPEN action used window.open(blob:...), inheriting potentially privileged app origin. Replaced that with a native modal dialog containing a second sandbox='allow-scripts' srcDoc iframe with no same-origin permission and no-referrer policy. This prevents generated scripts from reading the editor origin; it does not by itself prevent outgoing network requests from generated HTML.
ADR-X1VS-02: Build on isolated GitHub branch fix/visual-preview-sandbox-20261020 from pinned main. Maintain Visual X1 editor and Launch Engine as distinct sources. No new app/queue.
ADR-X1VS-03: Preserve existing Base44 bridge as currently found; independent native X1 migration requires separate planned contract and auth tests. Do not expose Docker, Ollama 11434, or control plane 4311 to browser/public internet.

## Changed files on feature branch
- src/components/visualeditor/EditorCanvas.jsx — isolation fix, expandable native dialog.
- tests/visual-sandbox.test.mjs — deterministic source regression assertions; not a browser security proof.
- .github/workflows/visual-sandbox-safety.yml — PR-only CI npm ci, node test, lint, typecheck, build; no deploy step.
- This workbook/handoff.
Source SHA of final candidate must be read back after last commit and used for QA.

## Risk register
- HIGH — Local Docker/Ollama execution, tags, private interfaces and bridge request authorization not freshly verified because remote process calls timed out. Do not route a browser directly to local ports.
- HIGH — Independent Guardian exact-commit review missing. Do not mark release PASS or merge solely on author checks.
- HIGH — User-generated HTML can make outgoing network requests despite iframe sandbox; content/network policy requires targeted future review.
- MEDIUM — Base44 dependency remains in existing editor backend, not removed by this change.
- MEDIUM — Native dialog keyboard/focus/browser behavior not yet exercised with a real preview on mobile and desktop.
- MEDIUM — Existing launch-engine Academy iframe contains external origin and tenant draft API; cross-repo proof of same user/tenant session not yet run.

## Test and operations ledger
- GitHub repository identity / push permission: PASS; authenticated GitHub read and branch commit success.
- Staging queue read-only aggregation: PASS; SQL read result.
- JARVIS current status read: PASS; local file read from reachable device.
- Docker ps / Ollama / local bridge live calls: BLOCKED; remote tool timed out, no returned health or model tokens. A separate PowerShell command parsing error produced no runtime evidence.
- Node test / lint / typecheck / build: PENDING GitHub Actions exact-head receipt.
- Browser desktop/mobile, network/CSP leakage, auth negative tests: NOT RUN.
- Independent Guardian: BLOCKED exact candidate receipt.
- Local/Drive copy/readback: PENDING SYNC. This branch file is durable only after GitHub read-back.
- Deployment/release: NOT RUN / NOT AUTHORIZED.

## Checklist and immediate continuation
- [x] Resolve source repositories and pin baseline SHA.
- [x] Inspect visual editor, bridge, launch admin and existing queue metadata.
- [x] Identify and fix a concrete preview trust-boundary bypass on isolated branch.
- [x] Add deterministic regression tests and a bounded non-production CI workflow.
- [ ] Read back branch files and hosted CI result for exact final SHA.
- [ ] Have a distinct Guardian identity run desktop/mobile browser and security validation on the actual PR preview; include SHA, test artifacts and receipt.
- [ ] Recover Remote Desktop Commander calls; check docker ps, 127.0.0.1:11434/api/tags, 127.0.0.1:4311/health, binds and model inference with safe no-op text only. Do not print .env values.
- [ ] Resolve authenticated staging worker lease capability and run a tenant-scoped synthetic canary, existing queue and immutable receipt.
- [ ] Wire Launch Engine generated artifacts into the editor only through a server-authorized tenant-scoped preview contract after positive/negative auth checks.
- [ ] Verify canonical C: and Drive mirror readback; never claim cloud sync from a branch commit alone.
- [ ] Obtain scope-specific production approval after Guardian hard gates and rollback proof.

## Prompt to resume another X1 operator (P09 v1)
Inspect this workbook, current branch PR and GitHub Actions status; pin latest exact SHA. Do not rerun completed discovery unless sources changed. First resolve test/Guardian evidence and remote Docker/Ollama health, preserving all no-prod/security gates. Reuse x1_work_queue, leases, execution ledger, receipt table and existing reconcilers. For each test report PASS/FAIL/BLOCKED/UNKNOWN with exact evidence. Update this workbook and local canonical control status only with verified write/readback.
