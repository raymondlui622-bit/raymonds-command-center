# Milestone 13 QA Checklist - Version 1 Stabilization and QA

Status: Complete
Date: 2026-07-17
Evidence: See Milestone 13 QA Report and Milestone 13 Known Issues for findings M13-001, M13-002, M13-003 and detailed results.
Scope: Stabilization, bug discovery, verification, documentation, and release readiness only.

## Scope Guard
- No new features.
- No new record types.
- No new integrations.
- No scheduling, notifications, or UI redesign.
- No application bug fixes without Raymond approval after reproduction, severity classification, and documentation.
- QA-documentation mistakes introduced during Milestone 13 may be corrected within this milestone.

## Severity Rules
Every finding must be classified as exactly one severity.

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

## Frozen-Document Alignment
- [x] Phase 1 PRD reviewed.
- [x] Phase 2 Technical Architecture reviewed.
- [x] Phase 2.5 Data Model reviewed.
- [x] Phase 3 Implementation Plan reviewed.
- [x] Progress, Todo, Decisions, and Lessons reviewed.
- [x] Prior milestone verification documents reviewed.
- [x] Confirmed Milestone 13 remains stabilization-only.

## Automated Verification
- [x] `npm test`
- [x] `git diff --check`
- [x] Package files unchanged unless approved.
- [x] `data/command-center.sqlite` unchanged or restored after QA.
- [x] Git status reviewed.

## Database Verification
- [x] Current database backed up before destructive or high-volume QA.
- [x] SQLite integrity check performed on backup.
- [x] Fresh database initialization verified.
- [x] Existing database upgrade/idempotency verified.
- [x] Backup restore procedure verified.

## End-to-End User Flows
- [x] Raw Capture create/view/archive.
- [x] Raw Capture classification request, review, edit, accept, reject, duplicate accept protection.
- [x] Task create/list/read/update/complete/archive/search.
- [x] Review Later create/list/read/update/archive/search.
- [x] Project create/update/archive/search.
- [x] Project Updates append-only create/list.
- [x] Get Back on Track deterministic summary.
- [x] Get Back on Track no-key fallback.
- [x] Get Back on Track live AI narrative.
- [x] My Arsenal create/list/read/update/archive/search.
- [x] Prompt Library create/list/read/update/favorite/copy/archive/search.
- [x] Morning Brief generate/latest/history/review actions.
- [x] Morning Brief no-key fallback.
- [x] Morning Brief live AI narrative.
- [x] Export JSON download.
- [x] Export Markdown download.
- [x] Restart persistence.

## Browser UI Click-Through
- [x] Milestone 11 Get Back on Track UI clicked and verified.
- [x] Milestone 12 Morning Brief UI clicked and verified.
- [x] Browser console checked for errors.
- [x] Browser network checked for secret exposure.

## Bundled Live OpenAI Smoke Test
- [x] Backend started with server-side `OPENAI_API_KEY`.
- [x] Milestone 10.1 classification returns a real suggestion.
- [x] Classification uses the live OpenAI Responses API path, not a mock.
- [x] Browser never receives the API key.
- [x] Only approved minimal data is sent externally.
- [x] Server generates `acceptance_id`.
- [x] Server attaches trusted local IDs after validation.
- [x] Edit and acceptance create exactly one record.
- [x] Duplicate acceptance creates no duplicate.
- [x] Rejection creates no record.
- [x] Original Raw Capture remains unchanged.
- [x] Milestone 11 live AI narrative works.
- [x] Milestone 12 live AI narrative works.
- [x] Logs contain no API key or sensitive test content.
- [x] Token usage, model, response time, and approximate cost recorded when available.

## No-Key Fallback
- [x] Classification unavailable state works with no key.
- [x] No fabricated suggestions with no key.
- [x] Get Back on Track deterministic summary works with no key.
- [x] Morning Brief deterministic/persisted behavior works with no key.
- [x] Failed AI availability creates no records.

## Export Integrity
- [x] Export metadata present.
- [x] Required archived records included.
- [x] Stored fields represented for approved export scope.
- [x] Export does not mutate SQLite.
- [x] Export contains no secrets.
- [x] Any export coverage gap is classified and documented.

## Source-Record No-Mutation
- [x] Classification request preserves Raw Capture.
- [x] Classification rejection creates nothing.
- [x] Get Back on Track mutates no source records.
- [x] Morning Brief generation mutates no source records.
- [x] Morning Brief review actions mutate only Morning Brief items.
- [x] Search mutates no records.
- [x] Export mutates no records.

## Error-State Coverage
- [x] Missing required fields.
- [x] Invalid statuses.
- [x] Invalid IDs.
- [x] Not-found records.
- [x] Duplicate acceptance.
- [x] Unsupported AI output.
- [x] Provider timeout/error.
- [x] Empty datasets.
- [x] Archived records.
- [x] Malformed JSON behavior documented without implementing API-hardening backlog.

## Security Checks
- [x] No API key in frontend source.
- [x] No API key in browser requests.
- [x] No API key in SQLite.
- [x] No API key in exports.
- [x] No API key in logs.
- [x] No API key in committed files.
- [x] No raw provider responses, authorization headers, stack traces, or secrets exposed.
- [x] No unapproved external integrations.

## Performance Checks
- [x] Local startup acceptable.
- [x] Core create/update/search/export actions responsive on representative local data.
- [x] AI requests respect timeout behavior.
- [x] UI remains usable during AI requests.
- [x] Morning Brief and search do not noticeably freeze the browser.

## Final Release Checklist
- [x] Findings grouped by severity.
- [x] Known issues documented.
- [x] Deferred backlog confirmed.
- [x] README updated if release usage notes need correction.
- [x] Binder updated.
- [x] Milestone 13 QA Report completed.
- [x] Milestone 13 Verification completed.
- [x] Final Version 1 release decision recorded as PASS or FAIL.
