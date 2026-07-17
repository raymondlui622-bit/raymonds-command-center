# Milestone 13 QA Report - Version 1 Stabilization and QA

Status: Paused for Raymond review
Date: 2026-07-17

## Scope
Milestone 13 verifies Version 1 release readiness. It does not add features, record types, integrations, scheduling, notifications, or UI redesign.

Application defects discovered during QA must be reproduced, classified, documented, and reported before any fix is attempted.

## Release Decision
Pending. M13-002 is resolved and the bundled live smoke test has run. QA is paused for Raymond review of new Critical defect M13-003 before any code change or final PASS/FAIL decision.

The final decision must be exactly one of:

### PASS
Version 1 is approved for release.

Requirements:
- All release blockers have been resolved.
- Remaining issues are documented.
- Remaining issues are explicitly accepted as deferred.

### FAIL
Version 1 is not approved for release.

Requirements:
- Every remaining release blocker is listed.
- The report specifies exactly what must be completed before Version 1 can be released.

## Findings by Severity

### Critical
#### M13-001 - Version 1 export omitted four approved Version 1 record types

Severity: Critical

Blocks Version 1: No. Fixed with Raymond approval in commit `09a398c0e58d7685bb2a3ad5568c97d2d9eed99f`.

Steps to reproduce:
1. Review the frozen Phase 2.5 data model export requirement.
2. Initialize the current schema in memory.
3. Compare approved Version 1 tables with the keys returned by `buildExportPayload()`.

Expected behavior:
Version 1 export coverage should include all nine approved Version 1 record types: Raw Captures, Tasks, Review Later Resources, Projects, Project Updates, My Arsenal Items, Prompt Library Items, Morning Brief Items, and Classification Corrections.

Original behavior:
`buildExportPayload()` returns only five groups: `raw_captures`, `tasks`, `review_later_resources`, `projects`, and `project_updates`.

Evidence:
- Approved tables initialized: `arsenal_items`, `classification_corrections`, `morning_brief_items`, `project_updates`, `projects`, `prompt_library_items`, `raw_captures`, `review_later_resources`, `tasks`.
- Export payload groups returned: `raw_captures`, `tasks`, `review_later_resources`, `projects`, `project_updates`.

Likely root cause:
Milestone 8 correctly implemented exports for the records available at that time, but later Version 1 record types from Milestones 9, 10, and 12 were intentionally not added to exports during those milestones. The frozen Phase 2.5 model says Markdown/JSON exports should include all Version 1 records.

Affected files:
- `backend/exports.js`
- `backend/exports.test.js`
- `backend/exportHandlers.test.js`
- `README.md`

Resolution:
Raymond approved this as a legitimate Critical release blocker and approved a narrow fix. JSON and Markdown exports now include all nine Version 1 record groups, with tests covering JSON, Markdown, archived lifecycle records, stored-field representation, and read-only export behavior.

#### M13-002 - Required bundled live OpenAI smoke test cannot run because `OPENAI_API_KEY` is unavailable in the QA shell

Severity: Critical

Blocks Version 1: No. Resolved 2026-07-17.

Steps to reproduce:
1. Check whether `OPENAI_API_KEY` is present in the current server-start shell environment without printing the key.
2. Run `if [ -n "$OPENAI_API_KEY" ]; then printf 'OPENAI_API_KEY_PRESENT\n'; else printf 'OPENAI_API_KEY_MISSING\n'; fi`.

Expected behavior:
The required Milestone 13 bundled live OpenAI smoke test can start the backend with a server-side `OPENAI_API_KEY` and verify live OpenAI behavior for Milestone 10.1 classification, Milestone 11 Get Back on Track narrative, and Milestone 12 Morning Brief narrative.

Actual behavior:
The shell reports `OPENAI_API_KEY_MISSING`, so the live OpenAI smoke test cannot be run in this QA pass.

Likely root cause:
The API key is not available to the current Codex shell/server environment. This may be environment setup rather than an application defect, but the approved Version 1 release criteria require the live smoke test to pass before release.

Affected files:
- None confirmed. This is currently an environment/verification blocker, not an application-code defect.

Resolution:
Raymond started the backend at `127.0.0.1:3001` from a Terminal session holding a server-side `OPENAI_API_KEY`. QA ran the bundled live smoke test over HTTP only. The key was never printed, inspected, stored, or logged, and it never appeared in any HTTP response, database content, or QA document.

#### M13-003 - Milestone 11 Get Back on Track live AI narrative always fails with `narrative_status: "error"`

Severity: Critical

Blocks Version 1: No, once the approved fix is committed. Fix applied and live-verified 2026-07-17; awaiting Raymond's diff review and commit approval.

Steps to reproduce:
1. Start the backend with a valid server-side `OPENAI_API_KEY`.
2. Create an active project with a last completed step, next action, and one project update.
3. `POST /projects/<id>/resume-summary`.

Expected behavior:
Response includes a live AI narrative with `narrative_status: "available"`.

Actual behavior:
`"narrative": null, "narrative_status": "error"` on all 3 attempts (response times 4.8-6.0s), while Milestone 10.1 classification and Milestone 12 Morning Brief succeeded with the same live key and shared `callOpenAIResponsesApi()` path in the same session. The deterministic bundle (project, tasks, updates) remained correct, so graceful degradation works, but the required live narrative does not.

Likely root cause:
`backend/projectResumeSummary.js` sets `max_output_tokens: 300` for the narrative request. Default model `gpt-5-mini` is a reasoning model whose reasoning tokens count against `max_output_tokens`, so the budget is likely exhausted before any output text is produced; parsing then fails and the catch block returns `"error"`. Classification uses 500 and Morning Brief uses 800 on the same path and both succeed. The catch block also swallows the underlying error detail.

Affected files:
- `backend/projectResumeSummary.js`

Resolution:
Raymond approved the narrow fix. `max_output_tokens` for the resume narrative request was raised from 300 to 500 (matching the classification path); a regression test now locks the budget. Live re-test after backend restart: `narrative_status: "available"` with grounded non-empty narratives on 2/2 attempts (6.5-6.8s, model `gpt-5-mini`, token usage not surfaced by the app, estimated cost under one cent), deterministic fields unchanged, no records created or mutated, no key or test content in logs, database restored from the verified pre-QA backup (checksum match, integrity `ok`), `npm test` 100/100, `git diff --check` clean, package files unchanged. Awaiting Raymond's diff review before commit.

### Major
None recorded yet.

### Minor
None recorded yet.

### Cosmetic
None recorded yet.

## Automated Test Results
- Targeted export tests: passed 5/5 after M13-001 fix.
- Full `npm test`: passed 100/100 after M13-001 fix.
- `git diff --check`: passed after M13-001 fix.

## Browser UI Click-Through Results
- Milestone 11 Get Back on Track UI: passed for deterministic/no-key summary.
- Milestone 12 Morning Brief UI: passed for no-key generation, persisted rendering, accept, dismiss, and correct review actions.
- Raw Capture classification no-key UI: passed, showed `Classification provider is not configured.`

## Bundled Live OpenAI Smoke Test Results
Ran 2026-07-17 over HTTP against the backend at `127.0.0.1:3001`, started by Raymond with a server-side `OPENAI_API_KEY`. All test data was non-sensitive.

Provider verification:
- The runtime path is the real OpenAI Responses API (`https://api.openai.com/v1/responses` in `backend/classificationService.js`); mock providers are injectable only in automated tests.
- Earlier no-key runs returned provider-unavailable states; with the key, the same endpoints returned model-generated content with 4.7-6.3s latencies.
- Model: `gpt-5-mini` (default; no override env var set in QA). Token usage is not surfaced in application responses, so exact usage was not recordable. Approximate cost: each request was well under 1,000 input tokens and under 800 output tokens, so the full smoke test cost is estimated below one cent.

Milestone 10.1 Raw Capture classification: PASSED.
- Live suggestion for a task-like capture: `task`, confidence 0.94, plausible reasoning, 5.8s.
- Live suggestion for a resource-like capture: `review_later_resource`, confidence 0.9, 6.3s.
- Edit-then-accept: edited title and priority persisted exactly as edited.
- Duplicate acceptance: second accept returned `created: false`, task count remained 1.
- Reject: no task or resource records created.
- Original Raw Captures remained byte-identical after suggestion, accept, and reject.

Milestone 11 Get Back on Track: initially FAILED (Critical defect M13-003, live narrative `narrative_status: "error"` on all 3 attempts; deterministic bundle correct, no records created). After the approved fix and backend restart, re-test PASSED: `narrative_status: "available"` with grounded non-empty narratives on 2/2 attempts (6.5-6.8s), deterministic fields unchanged, no records created or mutated.

Milestone 12 Morning Brief: PASSED.
- `ai_status: "available"`, one grounded narrative per item, in order, 4.7s.
- Persisted brief items included live narratives.
- Source records (tasks, projects, raw captures, resources, updates) hashed identically before and after generation.

Secret-exposure checks during live testing:
- API key never printed, inspected, stored, or logged by QA.
- Frontend `src/` contains zero references to OpenAI or the key; the browser only ever receives suggestion/narrative JSON.
- Backend logs only its startup line; no request or key logging exists.
- Database scan found zero key-like strings.
- Only approved minimal fields were sent externally: capture `raw_text` for classification; project name/steps/blocker/next-action/waiting-on plus linked task titles and recent update text for resume narrative; item section/title/summary/reason for Morning Brief.

QA cleanup:
- All QA rows were removed by restoring `data/command-center.sqlite` from the verified pre-QA backup; post-restore checksum matched the backup exactly, `PRAGMA integrity_check` returned `ok`, and the running server confirmed an empty dataset.
- Post-smoke `npm test`: 100/100 passed. `git diff --check`: clean. `package.json` and `package-lock.json` unchanged.

## No-Key Fallback Results
Passed for browser/UI checks completed so far:
- Classification shows provider-not-configured state.
- Get Back on Track shows deterministic summary and unavailable narrative.
- Morning Brief generates deterministic persisted items and shows AI status unavailable.

## Database Backup and Restore Results
Passed:
- Pre-QA database checksum recorded.
- Backup copied to `/private/tmp/rcc-m13-backup/command-center.sqlite`.
- Backup checksum matched original.
- SQLite integrity check returned `ok`.
- QA data was restored from backup after M13-002 stopped QA.

## Fresh Database and Upgrade Results
Passed:
- Fresh in-memory initialization created the nine approved Version 1 tables.
- Existing database initialization was idempotent; table list before and after matched.

## Export Integrity Results
Passed after M13-001 fix:
- JSON export includes all nine Version 1 record groups.
- Markdown export includes all nine Version 1 sections.
- Archived lifecycle records are covered in export tests.
- Stored-field representation is covered in export tests.
- Export read-only behavior is covered across all nine tables.

## Source-Record No-Mutation Results
Passed:
- Automated regression tests continue to cover classification, Get Back on Track, Morning Brief, and export no-mutation behavior.
- Browser no-key checks did not reveal source-record mutation.
- Live OpenAI checks: original Raw Captures byte-identical after classification suggest/accept/reject; resume-summary calls created zero records; Morning Brief source records hashed identically before and after generation.

## Security and Secret-Exposure Results
Passed for the live smoke test scope: key confined to Raymond's server-start Terminal environment; never printed, stored, or logged by QA; absent from frontend code, HTTP responses, backend logs, and database content.

## Performance and Responsiveness Results
Pending.

## Deferred Backlog Confirmed
Pending.

## Version 1 Release Recommendation
Pending. Current QA state cannot recommend PASS while Critical defect M13-003 (Milestone 11 live narrative failure) is unresolved. Awaiting Raymond's decision on the proposed narrow fix.
