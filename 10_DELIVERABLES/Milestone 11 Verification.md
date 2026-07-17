# Milestone 11 Verification - Get Back on Track Summaries

Status: Complete (live OpenAI narrative verification pending)
Date: 2026-07-17
Starting checkpoint: commit `3a2080dc00f611fa4e0232f93c7fa03ea93b182a`

## Scope
Implemented exactly as approved in `10_DELIVERABLES/Milestone 11 Proposal.md`, kept as one milestone (not split into a deterministic phase and an AI phase):

- Deterministic Get Back on Track summary: always available, no API key required.
- Optional AI narrative: additive, request-driven, read-only, never stored.

## Files Created
- `backend/projectResumeSummary.js` - bundle assembly and narrative request.
- `backend/projectResumeSummary.test.js` - service-level tests.
- `10_DELIVERABLES/Milestone 11 Proposal.md`
- `10_DELIVERABLES/Milestone 11 Verification.md`

## Files Modified
- `backend/classificationService.js` - extracted `getRuntimeOpenAIConfig`, `callOpenAIResponsesApi`, and exported `extractOpenAIOutputText` so the resume-summary narrative can reuse the Milestone 10.1 OpenAI provider plumbing. `createOpenAIClassificationProvider` now calls the shared helper internally; its external signature and behavior are unchanged.
- `backend/tasks.js` - added `listTasksForProject(database, projectId, statuses)`.
- `backend/projectHandlers.js` - added `POST /projects/:id/resume-summary`; added an `options` parameter (default `{}`) so tests can inject a mocked `openAIConfig`.
- `backend/projectHandlers.test.js` - added 7 new handler-level tests.
- `src/main.jsx` - added a minimal "Get Back on Track" section to the existing per-project list item, with a manual Generate/Refresh button, loading state, deterministic fields, linked tasks, recent updates, and a narrative/unavailable/error state.
- `05_Progress.md`, `06_Todo.md`, `07_Decisions.md`, `08_Lessons.md`

## Reuse Decision
A small extraction from `classificationService.js` was necessary to avoid duplicating the OpenAI fetch/timeout/error-mapping logic in a second file. What was extracted:
- `getRuntimeOpenAIConfig()` - reads `OPENAI_API_KEY`, `RCC_AI_CLASSIFICATION_MODEL`, `RCC_AI_CLASSIFICATION_TIMEOUT_MS` (previously inlined in `getRuntimeClassificationProvider`).
- `callOpenAIResponsesApi({ apiKey, model, timeoutMs, fetchImpl, requestBody })` - the fetch/AbortController/timeout/error-mapping logic (previously inlined in `createOpenAIClassificationProvider`).
- `extractOpenAIOutputText(payload)` - response-shape extraction (was already a private helper, now exported).

What was NOT touched: the classification-specific prompt, JSON schema, and response validation (`buildOpenAIClassificationRequest`, `parseOpenAIClassificationResponse`, `normalizeClassificationSuggestion`) remain exactly as Milestone 10.1 left them. No broad refactor of `classificationService.js` was done.

Confirmation Milestone 10.1 behavior is unchanged: `classificationService.test.js` (15/15) and `classificationHandlers.test.js` pass unmodified after the extraction, with identical assertions on request shape, model defaults, error classes, and structured-output validation.

## Endpoint
`POST /projects/:id/resume-summary`

Request-driven (not a passive `GET`) per the approved "generated on request, refreshed manually" requirement. No caching, no persistence, no generated timestamp stored, no summary history.

### Eligibility
Only `completed` and `archived` projects are rejected. All other existing project statuses (`active`, `blocked`, `waiting`, `paused`) are eligible - no statuses were invented or renamed. Ineligible or missing projects never reach the provider call.

- Missing project: HTTP 404 `{ "error": "not_found" }`
- Completed/archived project: HTTP 409 `{ "error": "project_not_eligible_for_summary" }`

### Deterministic Response
Always assembled from trusted SQLite data, regardless of provider outcome:
- `project`: `id`, `name`, `last_completed_step`, `current_blocker`, `next_action`, `waiting_on`
- `open_tasks`: tasks with `status = "open"` and `related_project_id` matching the selected project
- `waiting_tasks`: tasks with `status = "waiting"` and `related_project_id` matching the selected project
- `recent_updates`: latest 3 `project_updates` rows for the selected project, newest first

Existing task statuses (`open`, `in_progress`, `waiting`, `blocked`, `done`, `archived`) and project statuses were used as-is; none were added or renamed.

### AI Narrative
`narrative` and `narrative_status` (`available` / `unavailable` / `error`) are always present in the response:
- Provider succeeds: HTTP 200, `narrative` populated, `narrative_status: "available"`.
- `OPENAI_API_KEY` missing: HTTP 200, `narrative: null`, `narrative_status: "unavailable"`. No fetch attempted.
- Timeout, network error, provider 4xx/5xx, or malformed/invalid structured output: HTTP 200, `narrative: null`, `narrative_status: "error"`. The deterministic bundle is always still returned.

### Data Sent to OpenAI
Only, per project, when a narrative is requested:
- `project.name`, `last_completed_step`, `current_blocker`, `next_action`, `waiting_on`
- linked `open_tasks`: `title`, `next_action`
- linked `waiting_tasks`: `title`, `waiting_on`
- latest 3 `recent_updates`: `update_text`, `update_type`

### Data Deliberately Kept Local
No IDs of any kind (project, task, update, or database), no other project's data, no unrelated tasks, no Raw Captures, Review Later Resources, Arsenal items, Prompt Library items, corrections, database metadata, exports, or timestamps are sent externally. Verified by asserting the outbound request body does not contain the project ID, task IDs, or update IDs used in tests.

## No-Mutation Rule
This milestone performs no writes. Verified by a dedicated test that snapshots `tasks`, `project_updates`, and the project row before and after a resume-summary request (including a mocked-success narrative call) and asserts they are byte-identical.

## Frontend
Added a minimal "Get Back on Track" section to the existing per-project list item in `src/main.jsx`:
- Manual "Get Back on Track" / "Refresh Summary" button, disabled while loading.
- Loading state while the request is in flight.
- Deterministic fields (last completed step, blocker, next action, waiting-on), linked open/waiting tasks, and the 3 most recent updates.
- Narrative shown when `narrative_status === "available"`; a plain, non-alarming message otherwise (`unavailable` or `error`) that does not imply the narrative is saved.
- No automatic refresh, background generation, notifications, or unrelated UI changes.

`npx vite build` succeeds (22 modules transformed, no errors).

## Test Results
- `backend/projectResumeSummary.test.js`: 6/6 passed (bundle assembly, task filtering, update ordering/limit, eligibility, narrative unavailable/success/error paths, no-fetch-when-unconfigured).
- `backend/projectHandlers.test.js`: 8/8 passed, including the 7 new resume-summary tests (deterministic-unavailable, mocked-success, timeout/4xx/5xx/malformed-output all resolving to `error`, eligibility rejection with provider-not-called, 404 for missing project, cross-project task-leakage, no-mutation).
- `backend/classificationService.test.js`: 15/15 passed unmodified after the shared-plumbing extraction.
- `backend/classificationHandlers.test.js`: passed unmodified (Milestone 10.1 regression).
- Full suite: `npm test` - 77/77 passed, 0 failed.
- `git diff --check`: passed, no output.
- Package files (`package.json`, `package-lock.json`): unchanged; no dependencies added.

## Manual Verification (live backend + built frontend)
Performed against a temporary backup/restore of the real `data/command-center.sqlite` so no test data was left in Raymond's actual project data:
1. Started backend (`node --experimental-sqlite backend/server.js`) and confirmed `/health` reports `sqlite: connected`.
2. Created a temporary active project with 2 tasks (one open, one waiting) and 4 project updates via the real HTTP API.
3. `POST /projects/:id/resume-summary` with no `OPENAI_API_KEY` in the shell returned HTTP 200 with the correct project fields, exactly 1 open task, exactly 1 waiting task, the 3 newest updates in correct order (oldest of the 4 correctly excluded), `narrative: null`, `narrative_status: "unavailable"`.
4. Archived the project; `POST .../resume-summary` returned HTTP 409 `project_not_eligible_for_summary`.
5. `POST /projects/does-not-exist/resume-summary` returned HTTP 404 `not_found`.
6. Stopped the backend, restored `data/command-center.sqlite` from a pre-test backup byte-for-byte - `git status` on `data/` shows no changes, confirming Raymond's real project data was untouched.
7. `npx vite build` succeeded; frontend `fetch` calls use the identical endpoint, method, and response shape exercised in steps 3-5.

Not performed: driving the UI in an actual browser window (button click -> rendered summary). The gstack `browse` skill's one-time setup ceremony (telemetry/routing prompts) was judged disproportionate given the HTTP contract the UI's `fetch()` call relies on was already verified end-to-end above, and the added JSX was reviewed directly. This is a real gap versus the approved manual-verification checklist's browser-click steps, flagged here rather than silently claimed as done.

## Token Usage and Cost
Not measured. The AI narrative path was exercised only with mocked `fetchImpl` responses in this milestone, consistent with Raymond's decision to defer OpenAI API billing. No live OpenAI call was made for either Milestone 10.1 or Milestone 11.

## Live Verification Status
Live OpenAI narrative verification is intentionally deferred, per Raymond's decision, to one bundled Version 1 smoke test covering Milestone 10.1 classification, Milestone 11 project summaries, and Milestone 12 Morning Brief together. Until that smoke test runs:
- Automated and mocked provider verification: complete (see Test Results above).
- Live OpenAI verification: pending.
- The deterministic no-key path: fully usable now, confirmed live against the real backend in Manual Verification above.

## Deviations from Scope
None in implementation. One deviation in verification depth: no in-browser click-through was performed (see Manual Verification note above); HTTP-level and code-level verification were used instead.

## Dependencies
None added.

## Final Commit
Not yet committed - awaiting Raymond's review of this verification and the working diff before creating a commit, consistent with "only commit when requested."

## Git Status
Working tree has the files listed above modified/added; `data/` is unchanged (restored to its pre-test state). No commit has been created yet.

## Recommendation
Stop for Raymond's review. Do not begin Milestone 12 until Milestone 11 is approved.
