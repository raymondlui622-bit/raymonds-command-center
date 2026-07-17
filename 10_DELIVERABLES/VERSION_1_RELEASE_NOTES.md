# Raymond Command Center - Version 1 Release Notes

- Version: 1.0.0
- Release date: 2026-07-17
- Final release commit: `0c78c48518a2ef5cab8312c553b4cded30e27baa`
- Release decision: PASS (Milestone 13 QA Report and Milestone 13 Verification)

## What Version 1 Is

A local-first personal command center. Capture anything fast, let AI propose what it is, review and accept on your terms, and get daily and per-project summaries that help you resume work. Everything lives in one local SQLite file you can back up, restore, and export.

## Version 1 Capabilities

- **Raw Captures** - capture any thought or note instantly; view and archive later.
- **AI Classification** - request an AI suggestion for a Raw Capture (task or resource), review the reasoning and confidence, edit values, then accept or reject. Duplicate acceptance is prevented; the original capture is never modified.
- **Classification Corrections** - corrections are stored for future learning.
- **Tasks** - create, list, update, complete, archive, and search; priorities, due dates, waiting-on tracking, and requires-Raymond flags.
- **Review Later Resources** - save articles and links with why-it-matters context; full lifecycle and search.
- **Projects and Project Updates** - projects with phases, blockers, and next actions, plus an append-only update history.
- **Get Back on Track** - one click per project returns a deterministic resume bundle (last step, blockers, next action, open and waiting tasks, recent updates) plus an AI narrative paragraph when a key is configured.
- **My Arsenal** - inventory of tools and services with lifecycle and search.
- **Prompt Library** - reusable prompts with favorites, copy, lifecycle, and search.
- **Morning Brief** - one click generates a persisted daily brief grouped into Requires Raymond, Needs Verification, Waiting on Others, and FYI, with per-item AI narratives when a key is configured, and accept/dismiss/correct review actions.
- **Search** - across record types.
- **Exports** - read-only JSON and Markdown downloads covering all nine Version 1 record types, including archived records.
- **Health check** - `GET /health`.

## Final Architecture

- **Frontend:** React 19 + Vite, served at `127.0.0.1:5173`. Talks to the backend over local HTTP only. Never sees the API key.
- **Backend:** plain Node.js `http` server at `127.0.0.1:3001` (`npm run dev:backend`). No web framework.
- **Database:** SQLite via Node's built-in `node:sqlite` (`--experimental-sqlite`), single file at `data/command-center.sqlite`. Nine Version 1 tables; idempotent initialization.
- **AI boundary:** one server-side module calls the OpenAI Responses API with native `fetch`. No OpenAI SDK, no third-party AI dependencies. Strict JSON-schema-constrained responses.
- **Dependencies:** react, react-dom, vite. Nothing else.
- **Tests:** 100 tests via Node's built-in test runner (`npm test`); AI paths tested with deterministic mocked providers.

## AI Provider and Model

- Provider: OpenAI Responses API (`https://api.openai.com/v1/responses`), server-side only.
- Current default model: `gpt-5-mini`.
- Optional overrides: `RCC_AI_CLASSIFICATION_MODEL`, `RCC_AI_CLASSIFICATION_TIMEOUT_MS` (default 15000 ms).
- Only minimal approved data is sent externally: capture text for classification; project name, steps, blockers, task titles, and recent update text for resume narratives; item section/title/summary/reason for Morning Brief narratives.

## Works Without an API Key

- Everything except live AI narratives and live classification suggestions:
  - All record types, lifecycle actions, and search.
  - Get Back on Track deterministic resume bundle (`narrative_status: "unavailable"`).
  - Morning Brief deterministic persisted items (`ai_status: "unavailable"`).
  - Exports, health, backups.
- Classification without a key returns a clear provider-not-configured state; nothing is sent externally and no record is created.

## Requires OpenAI API Access

- Live Raw Capture classification suggestions.
- Get Back on Track AI narrative paragraph.
- Morning Brief per-item AI narratives.

Set `OPENAI_API_KEY` in the backend's environment before `npm run dev:backend`. The key stays server-side; it never reaches the browser, database, exports, or logs.

## Critical QA Findings Resolved (Milestone 13)

- **M13-001** - Version 1 exports omitted four approved record types. Fixed in commit `09a398c`; JSON and Markdown exports now include all nine record types.
- **M13-002** - The bundled live OpenAI smoke test could not run because `OPENAI_API_KEY` was unavailable in the QA environment. Resolved by running the backend from a key-holding session; the full live smoke test then ran and the key never appeared in code, logs, database, or documents.
- **M13-003** - Get Back on Track live narrative always failed: the 300-token output budget starved `gpt-5-mini`'s reasoning output. Fixed in commit `86fb868` by raising `max_output_tokens` to 500 with a regression test; live re-verified 2/2.

Full details: `Milestone 13 QA Report.md` and `Milestone 13 Known Issues.md`.

## Known Limitations

- Single-user, local-only; no authentication, hosting, or sync.
- Backend requires Node with `--experimental-sqlite`.
- Whitespace-only strings can pass required-field validation.
- Malformed JSON handling returns generic 400s rather than hardened, consistent errors.
- Project Updates are append-only by design; entries cannot be edited.
- Token usage and exact cost are not surfaced in API responses.
- AI classification supports two target record types (task, review later resource).

## Deferred Backlog (documented, not blockers)

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

## Recommended Next Step

Use Version 1 in real daily work before planning Version 2. Capture real notes, run the Morning Brief every morning, and use Get Back on Track when resuming projects. Let actual friction - not speculation - decide what Version 2 contains.

## Rollback and Recovery

- **Data:** back up `data/command-center.sqlite` by copying the file; restore by copying it back. Verify with a checksum and `PRAGMA integrity_check;`. This procedure was exercised and verified during Milestone 13 QA.
- **Code:** each milestone is a single commit on `main`; revert the specific commit that caused a problem. Release commit: `0c78c48518a2ef5cab8312c553b4cded30e27baa`.
- Milestone-level rollback notes live in each `Milestone N Verification.md`.

## Version 2 Ideas (future only - not commitments)

- Scheduled/automated Morning Brief.
- External integrations (email, calendar) feeding captures.
- Notifications for due and waiting items.
- Batch classification of capture backlogs.
- Tags and richer relations across records.
- Prompt Library versioning and templates.
- Mobile or remote access.
- Scheduled automatic backups.
