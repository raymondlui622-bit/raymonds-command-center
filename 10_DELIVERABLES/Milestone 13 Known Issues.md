# Milestone 13 Known Issues

Status: In progress
Date: 2026-07-17

## Severity Definitions

### Critical
- Data loss
- Source-record mutation
- Security issue
- Failed migration
- Failed live OpenAI smoke test
- Application crash
- Release blocker

### Major
- Important functionality broken
- Inconsistent behavior
- Incorrect output
- Raymond decides whether to fix before Version 1 release

### Minor
- Small functional issue with an acceptable workaround

### Cosmetic
- Visual, wording, or presentation issue only

## Findings

### M13-001 - Version 1 export omitted four approved Version 1 record types

Severity: Critical

Blocks Version 1: No. Fixed with Raymond approval in commit `09a398c0e58d7685bb2a3ad5568c97d2d9eed99f`.

Steps to reproduce:
1. Review the frozen Phase 2.5 export requirement.
2. Initialize the current schema.
3. Compare approved Version 1 tables with the keys returned by `buildExportPayload()`.

Expected behavior:
Version 1 exports should include all nine approved Version 1 record types.

Actual behavior:
Exports include only Raw Captures, Tasks, Review Later Resources, Projects, and Project Updates. They omit My Arsenal Items, Prompt Library Items, Morning Brief Items, and Classification Corrections.

Likely root cause:
Milestone 8 export scope was correct when implemented, but later Version 1 record types were not added to exports after they landed.

Affected files:
- `backend/exports.js`
- `backend/exports.test.js`
- `backend/exportHandlers.test.js`
- `README.md`

Fix status:
Fixed. JSON and Markdown exports now include all nine Version 1 record types.

### M13-002 - Required bundled live OpenAI smoke test cannot run because `OPENAI_API_KEY` is unavailable in the QA shell

Severity: Critical

Blocks Version 1: No. Resolved 2026-07-17.

Steps to reproduce:
1. Check whether `OPENAI_API_KEY` is present without printing the key.
2. The QA shell reports `OPENAI_API_KEY_MISSING`.

Expected behavior:
The required bundled live OpenAI smoke test can run against the server-side key for Milestone 10.1 classification, Milestone 11 Get Back on Track narrative, and Milestone 12 Morning Brief narrative.

Actual behavior:
The key is not available in the current QA shell/server environment, so the live smoke test cannot run.

Likely root cause:
The API key has not been exposed to the local backend process environment used by this QA run.

Affected files:
- None confirmed.

Fix status:
Resolved without code changes. Raymond started the backend from a Terminal session with a server-side `OPENAI_API_KEY`, and the bundled live OpenAI smoke test ran over HTTP on 2026-07-17. The key was never printed, inspected, stored, or logged during QA.

### M13-003 - Milestone 11 Get Back on Track live AI narrative always fails with `narrative_status: "error"`

Severity: Critical

Blocks Version 1: No, once the approved fix is committed. Fix applied and live-verified 2026-07-17; awaiting Raymond's diff review and commit approval.

Steps to reproduce:
1. Start the backend with a valid server-side `OPENAI_API_KEY`.
2. Create an active project with a last completed step, next action, and one project update.
3. `POST /projects/<id>/resume-summary`.
4. Response returns the correct deterministic bundle but `"narrative": null, "narrative_status": "error"` on every attempt (3/3 failures).

Expected behavior:
With a valid key, the response should include a live AI narrative with `narrative_status: "available"`.

Actual behavior:
`narrative_status` is `"error"` on every attempt, while the same live key, model, and shared `callOpenAIResponsesApi()` path succeed for Milestone 10.1 classification and Milestone 12 Morning Brief in the same session.

Likely root cause:
`buildNarrativeRequest()` in `backend/projectResumeSummary.js` sets `max_output_tokens: 300`. The default model `gpt-5-mini` is a reasoning model whose reasoning tokens count against `max_output_tokens`, so the budget is likely exhausted before any output text is produced, the response contains no output text, parsing throws, and the catch block reports `"error"`. Classification (500 tokens) and Morning Brief (800 tokens) succeed on the same path. The catch block swallows the underlying error, which also makes this failure hard to diagnose.

Affected files:
- `backend/projectResumeSummary.js`

Fix status:
Fixed pending commit. With Raymond's approval, `max_output_tokens` for the resume narrative request was raised from 300 to 500 (matching the classification path) in `backend/projectResumeSummary.js`, with a regression test locking the budget in `backend/projectResumeSummary.test.js`. No other behavior changed. Live re-test after backend restart: `narrative_status: "available"` with a grounded non-empty narrative on 2/2 attempts (6.5-6.8s), deterministic fields unchanged, no records created or mutated, database restored from the verified pre-QA backup, full `npm test` 100/100, `git diff --check` clean, package files unchanged.

## Deferred Backlog Items
- Trim whitespace for required string fields.
- Consistent HTTP 400 malformed JSON handling.
- Restore focus to capture textarea after save.
- Waiting-task field validation.
- Tag management or relational tags.
- Stored `due_soon`.
- Editing Project Updates instead of append-only history.
- Scheduled backups.
- Notifications.
- Mobile app.
- External integrations.
- Autonomous AI.
- Batch classification.
- Prompt versioning, testing, variables, or templates.
- Morning Brief automation from live external systems.
