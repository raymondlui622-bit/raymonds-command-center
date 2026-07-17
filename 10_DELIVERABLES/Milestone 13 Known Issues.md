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

### M13-001 - Version 1 export omits four approved Version 1 record types

Severity: Critical

Blocks Version 1: Yes, unless Raymond explicitly accepts the gap as deferred.

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
Not fixed. Per Milestone 13 QA rules, application code fixes require Raymond approval first.

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
