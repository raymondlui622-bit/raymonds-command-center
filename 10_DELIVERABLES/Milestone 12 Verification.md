# Milestone 12 Verification - Read-Only AI-Assisted Morning Brief

Status: Complete (live OpenAI narrative verification pending)
Date: 2026-07-17
Starting checkpoint: commit `a60307aed9a57fb2c39dfe717d9ac82f8a481806`

## Scope
Implemented exactly as approved in `10_DELIVERABLES/Milestone 12 Proposal.md` after two rounds of revision: a persisted, request-driven Morning Brief per the frozen `Phase 2.5 Data Model` and `Phase 3 Implementation Plan`, with source records remaining strictly read-only.

## Files Created
- `backend/migrations/morningBriefItems.js`
- `backend/morningBriefItems.js` - data access
- `backend/morningBriefService.js` - deterministic assembly + optional AI narrative
- `backend/morningBriefHandlers.js` - HTTP routes
- `backend/morningBriefItems.test.js`
- `backend/morningBriefService.test.js`
- `backend/morningBriefHandlers.test.js`
- `10_DELIVERABLES/Milestone 12 Proposal.md`
- `10_DELIVERABLES/Milestone 12 Verification.md`

## Files Modified
- `backend/db.js` - wired the new migration.
- `backend/server.js` - wired `handleMorningBriefRequest` into the request chain.
- `backend/projects.test.js`, `backend/rawCaptures.test.js`, `backend/reviewLaterResources.test.js` - updated the pre-existing "approved tables only" regression tests to include `morning_brief_items` as approved through Milestone 12 (previously listed as a not-yet-approved future table).
- `src/main.jsx` - added the Morning Brief view.
- `05_Progress.md`, `06_Todo.md`, `07_Decisions.md`, `08_Lessons.md`.

## Schema
`morning_brief_items`, 16 columns: 12 from the frozen Phase 2.5 field list (`id`, `brief_date`, `section`, `title`, `summary`, `reason`, `confidence`, `importance`, `source_refs`, `suggested_action`, `review_status`, `created_at`) plus 4 new (`brief_batch_id`, `generated_at`, `ai_narrative`, `corrected_note`), exactly as specified in the approved proposal. `corrected_section` and `reviewed_at` from earlier drafts were not implemented, per Raymond's explicit decision that they weren't required for any stated behavior.

## Batch Identity
`brief_batch_id` is a `randomUUID()` generated once per `POST /morning-brief` request and assigned to every item in that generation. `generated_at` is computed once per request alongside it and used only for display/ordering. All grouping (`GET /morning-brief/latest`, `GET /morning-brief/history`) filters/groups by `brief_batch_id`, never by `generated_at` equality.

**Bug found and fixed during testing:** the initial `getLatestMorningBriefBatch` query tiebreaker was `ORDER BY generated_at DESC, id DESC`. Since `id` is a random UUID, two batches generated in the same millisecond (a real scenario when a test - or a fast double-click - fires two `POST` requests back to back) would tie on `generated_at` and then resolve to a *random* winner on `id`, not the actually-latest batch. Caught by `backend/morningBriefHandlers.test.js`'s "two generations" test failing nondeterministically-in-principle (it failed on the first real run). Fixed by ordering on SQLite's monotonic `rowid` instead of `id` for the tiebreaker, in both `getLatestMorningBriefBatch` and `listMorningBriefHistory`. A dedicated regression test (`getLatestMorningBriefBatch breaks generated_at ties by insertion order, not random id`) now locks this in.

## Confidence
Fixed at `1.0` on every deterministic item. Not read by any ranking, filtering, section-placement, or display-priority logic anywhere in the implementation - confirmed by grep and by tests asserting `confidence === 1.0` regardless of section size or item count.

## Importance
Assigned once per item from a fixed per-section mapping (`requires_raymond` → `high`, `needs_verification` / `waiting_on_others` → `medium`, `fyi` → `low`), independent of item count or position. A dedicated test creates 9 Requires Raymond items and confirms all 9 are returned with `importance = "high"` - no downgrade, no truncation, no exclusion.

## Seven-Item Display Rule
Entirely client-side in `src/main.jsx`: `morningBrief.items.requires_raymond` is always the full, untruncated list from the API; the component slices to the first 7 unless `showAllRequiresRaymond` is toggled, with an "Show N more" button. The backend and database have no awareness of any cap.

## No-Mutation Guarantee
`generation, reads, and review actions never mutate any of the seven source tables` snapshots `tasks`, `projects`, `raw_captures`, `project_updates`, `review_later_resources`, `arsenal_items`, and `prompt_library_items` before and after a full sequence (generate with a mocked AI success, both GET endpoints, and a PATCH correction) and asserts byte-identical results. Passed.

## AI's Limited Role
`requestMorningBriefNarrative` receives the deterministic item list only after `assembleMorningBrief` has fully finished section selection; it can only attach an `ai_narrative` string per item (matched back by array position after confirming the AI's response array length equals the input length - a mismatch is treated as an error, not silently ignored). No internal database IDs are sent to the provider - a dedicated test asserts the outbound request body does not contain the item's id. No code path exists from the AI response back into `section`, `review_status`, `importance`, or `confidence`.

## No-Key Behavior
Confirmed live (see Manual Verification) and by test: with no `OPENAI_API_KEY`, `assembleMorningBrief` + `insertMorningBriefBatch` alone produce a fully persisted, fully usable brief - every required field (`reason`, `confidence`, `importance`, `suggested_action`) is deterministic and never depends on a provider call. `ai_status: "unavailable"`.

## Test Results
- `backend/morningBriefItems.test.js`: 6/6 passed (batch persistence, source_refs round-trip, latest-batch retrieval including the same-millisecond tie fix, history grouping/counts, accept/dismiss/correct, missing-item handling).
- `backend/morningBriefService.test.js`: 9/9 passed (all four section rules with exclusions, no-downgrade-past-7, shared batch id + fixed confidence/importance, narrative unavailable/success/error paths, no internal IDs sent).
- `backend/morningBriefHandlers.test.js`: 8/8 passed (generate with no key, generate with mocked AI success, generate through timeout/4xx/5xx/malformed-output all resolving to `ai_status: "error"` with the deterministic brief intact, two distinct batch ids across two generations, latest-batch retrieval, history metadata without item bodies, full accept/dismiss/correct + invalid-status/missing-section/missing-item validation, and the seven-source-table no-mutation test).
- Three pre-existing "approved tables only" tests updated and passing (`projects.test.js`, `rawCaptures.test.js`, `reviewLaterResources.test.js`).
- Full suite: `npm test` - 100/100 passed, 0 failed.
- `git diff --check`: passed, no output.
- Package files (`package.json`, `package-lock.json`): unchanged; no dependencies added.

## Manual Verification (live backend + built frontend)
Performed against a temporary backup/restore of `data/command-center.sqlite`, same discipline as Milestone 11:
1. Started the backend, confirmed `/health`.
2. Created one real `requires_raymond = 1` open Task via the HTTP API.
3. `POST /morning-brief` with no `OPENAI_API_KEY` in the shell: HTTP 200, `ai_status: "unavailable"`, one Requires Raymond item with `confidence: 1`, `importance: "high"`, `ai_narrative: null`.
4. Second `POST /morning-brief` immediately after: distinct `brief_batch_id`, confirmed via string comparison.
5. `GET /morning-brief/latest`: returned the second batch's `brief_batch_id`, matching.
6. `GET /morning-brief/history`: both batches listed, correct per-section counts.
7. `PATCH /morning-brief-items/:id` with `{"review_status":"accepted"}`: HTTP 200, item updated.
8. `PATCH ... {"review_status":"proposed"}`: HTTP 422 `invalid_review_status`.
9. `PATCH ... {"review_status":"corrected"}` with no `section`: HTTP 422 `invalid_section`.
10. `PATCH ... {"review_status":"corrected","section":"waiting_on_others","corrected_note":"..."}`: HTTP 200, section and note updated.
11. `PATCH` on a nonexistent item id: HTTP 404 `not_found`.
12. Re-fetched the source Task via `GET /tasks`: `status: "open"`, `requires_raymond: 1` - unchanged despite two generations, one accept, and one correction against its Morning Brief item.
13. Stopped the backend, restored `data/command-center.sqlite` from the pre-test backup byte-for-byte - `git status` on `data/` shows no changes.
14. `npx vite build` succeeded (22 modules transformed); the Morning Brief view's `fetch()` calls use the identical endpoints/methods/response shapes exercised in steps 3-11.

Not performed: clicking through the UI in an actual browser window (Generate button, expand control, accept/dismiss/correct buttons). Same reasoning and same gap as Milestone 11 - the HTTP contract the UI relies on was verified end-to-end above, and the added JSX was reviewed directly rather than driven in a browser.

## Token Usage and Cost
Not measured. All AI narrative paths were exercised only with mocked `fetchImpl` responses, consistent with Raymond's decision to defer OpenAI API billing. No live OpenAI call was made.

## Live Verification Status
Live OpenAI narrative verification is deferred, per Raymond's decision, to one bundled Version 1 smoke test covering Milestone 10.1 classification, Milestone 11 project summaries, and Milestone 12 Morning Brief together. Until that runs:
- Automated and mocked provider verification: complete (see Test Results).
- Live OpenAI verification: pending.
- The deterministic, no-key path: fully usable now, confirmed live against the real backend above.

## Deviations from Scope
None in implementation against the approved proposal. One deviation in verification depth: no in-browser click-through was performed (see Manual Verification note above).

## Dependencies
None added.

## Rollback Strategy
Remove the Morning Brief endpoints and frontend view; drop `morning_brief_items` via a follow-up migration only if no real review history exists in it yet. Per the approved proposal, once real data exists, rollback means "stop generating new briefs," not "delete the table."

## Final Commit
Not yet committed - awaiting Raymond's review of the diff summary before creating a commit, consistent with "only commit when requested," and per Raymond's explicit instruction to provide the diff for review before committing this milestone.

## Recommendation
Stop for Raymond's review. Do not begin Milestone 13 until Milestone 12 is approved.
