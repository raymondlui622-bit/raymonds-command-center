# Milestone 13 QA Checklist - Version 1 Stabilization and QA

Status: In progress
Date: 2026-07-17
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
- [ ] Phase 1 PRD reviewed.
- [ ] Phase 2 Technical Architecture reviewed.
- [ ] Phase 2.5 Data Model reviewed.
- [ ] Phase 3 Implementation Plan reviewed.
- [ ] Progress, Todo, Decisions, and Lessons reviewed.
- [ ] Prior milestone verification documents reviewed.
- [ ] Confirmed Milestone 13 remains stabilization-only.

## Automated Verification
- [ ] `npm test`
- [ ] `git diff --check`
- [ ] Package files unchanged unless approved.
- [ ] `data/command-center.sqlite` unchanged or restored after QA.
- [ ] Git status reviewed.

## Database Verification
- [ ] Current database backed up before destructive or high-volume QA.
- [ ] SQLite integrity check performed on backup.
- [ ] Fresh database initialization verified.
- [ ] Existing database upgrade/idempotency verified.
- [ ] Backup restore procedure verified.

## End-to-End User Flows
- [ ] Raw Capture create/view/archive.
- [ ] Raw Capture classification request, review, edit, accept, reject, duplicate accept protection.
- [ ] Task create/list/read/update/complete/archive/search.
- [ ] Review Later create/list/read/update/archive/search.
- [ ] Project create/update/archive/search.
- [ ] Project Updates append-only create/list.
- [ ] Get Back on Track deterministic summary.
- [ ] Get Back on Track no-key fallback.
- [ ] Get Back on Track live AI narrative.
- [ ] My Arsenal create/list/read/update/archive/search.
- [ ] Prompt Library create/list/read/update/favorite/copy/archive/search.
- [ ] Morning Brief generate/latest/history/review actions.
- [ ] Morning Brief no-key fallback.
- [ ] Morning Brief live AI narrative.
- [ ] Export JSON download.
- [ ] Export Markdown download.
- [ ] Restart persistence.

## Browser UI Click-Through
- [ ] Milestone 11 Get Back on Track UI clicked and verified.
- [ ] Milestone 12 Morning Brief UI clicked and verified.
- [ ] Browser console checked for errors.
- [ ] Browser network checked for secret exposure.

## Bundled Live OpenAI Smoke Test
- [ ] Backend started with server-side `OPENAI_API_KEY`.
- [ ] Milestone 10.1 classification returns a real suggestion.
- [ ] Classification uses the live OpenAI Responses API path, not a mock.
- [ ] Browser never receives the API key.
- [ ] Only approved minimal data is sent externally.
- [ ] Server generates `acceptance_id`.
- [ ] Server attaches trusted local IDs after validation.
- [ ] Edit and acceptance create exactly one record.
- [ ] Duplicate acceptance creates no duplicate.
- [ ] Rejection creates no record.
- [ ] Original Raw Capture remains unchanged.
- [ ] Milestone 11 live AI narrative works.
- [ ] Milestone 12 live AI narrative works.
- [ ] Logs contain no API key or sensitive test content.
- [ ] Token usage, model, response time, and approximate cost recorded when available.

## No-Key Fallback
- [ ] Classification unavailable state works with no key.
- [ ] No fabricated suggestions with no key.
- [ ] Get Back on Track deterministic summary works with no key.
- [ ] Morning Brief deterministic/persisted behavior works with no key.
- [ ] Failed AI availability creates no records.

## Export Integrity
- [ ] Export metadata present.
- [ ] Required archived records included.
- [ ] Stored fields represented for approved export scope.
- [ ] Export does not mutate SQLite.
- [ ] Export contains no secrets.
- [ ] Any export coverage gap is classified and documented.

## Source-Record No-Mutation
- [ ] Classification request preserves Raw Capture.
- [ ] Classification rejection creates nothing.
- [ ] Get Back on Track mutates no source records.
- [ ] Morning Brief generation mutates no source records.
- [ ] Morning Brief review actions mutate only Morning Brief items.
- [ ] Search mutates no records.
- [ ] Export mutates no records.

## Error-State Coverage
- [ ] Missing required fields.
- [ ] Invalid statuses.
- [ ] Invalid IDs.
- [ ] Not-found records.
- [ ] Duplicate acceptance.
- [ ] Unsupported AI output.
- [ ] Provider timeout/error.
- [ ] Empty datasets.
- [ ] Archived records.
- [ ] Malformed JSON behavior documented without implementing API-hardening backlog.

## Security Checks
- [ ] No API key in frontend source.
- [ ] No API key in browser requests.
- [ ] No API key in SQLite.
- [ ] No API key in exports.
- [ ] No API key in logs.
- [ ] No API key in committed files.
- [ ] No raw provider responses, authorization headers, stack traces, or secrets exposed.
- [ ] No unapproved external integrations.

## Performance Checks
- [ ] Local startup acceptable.
- [ ] Core create/update/search/export actions responsive on representative local data.
- [ ] AI requests respect timeout behavior.
- [ ] UI remains usable during AI requests.
- [ ] Morning Brief and search do not noticeably freeze the browser.

## Final Release Checklist
- [ ] Findings grouped by severity.
- [ ] Known issues documented.
- [ ] Deferred backlog confirmed.
- [ ] README updated if release usage notes need correction.
- [ ] Binder updated.
- [ ] Milestone 13 QA Report completed.
- [ ] Milestone 13 Verification completed.
- [ ] Final Version 1 release decision recorded as PASS or FAIL.
