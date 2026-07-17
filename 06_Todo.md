# Raymond Command Center - Todo

## Immediate Product Tasks
- Phase 1 product definition is approved and frozen.
- Treat `10_DELIVERABLES/Phase 1 Approved PRD.md` as the approved source of truth.

## Phase 2 Technical Architecture Tasks
- Phase 2 technical architecture is approved.

## Phase 2.5 Data Model Review Tasks
- Phase 2.5 data model is approved and frozen.
- Treat `10_DELIVERABLES/Phase 2.5 Data Model and Information Flow.md` as the implementation source of truth.

## Phase 3 Implementation Planning Tasks
- Phase 3 Implementation Plan is approved and frozen.
- Milestone 1 - Local App Foundation is complete.
- Milestone 2 - Raw Capture Data Slice is complete.
- Milestone 3 - Raw Capture Feature is complete.
- Milestone 4 - Tasks and Waiting Tasks is complete.
- Milestone 5 - Review Later Resources is complete.
- Milestone 6 - Projects and Project Updates is complete.
- Milestone 7 - Search Foundation is complete.
- Milestone 8 - Export and Portability is complete.
- Milestone 9 - Minimal My Arsenal and Prompt Library is complete.
- Milestone 10 - AI-Assisted Classification is complete.
- Milestone 10.1 - Live AI Provider Connection is complete (live OpenAI verification deferred).
- Milestone 11 - Get Back on Track Summaries is complete.
- Milestone 12 - Read-Only AI-Assisted Morning Brief is complete (persisted, live OpenAI narrative verification deferred).
- Do not continue to Milestone 13 without explicit approval.

## Milestone 1 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 1 Verification.md`.

## Milestone 2 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 2 Verification.md`.

## Milestone 3 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 3 Verification.md`.

## Milestone 4 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 4 Verification.md`.

## Milestone 5 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 5 Verification.md`.

## Milestone 6 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 6 Verification.md`.

## Milestone 7 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 7 Verification.md`.

## Milestone 8 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 8 Verification.md`.

## Milestone 9 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 9 Verification.md`.

## Milestone 10 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 10 Verification.md`.

## Milestone 10.1 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 10.1 Verification.md`. Live OpenAI verification deferred to a bundled Version 1 smoke test.

## Milestone 11 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 11 Verification.md`. Live OpenAI narrative verification deferred to the same bundled Version 1 smoke test.

## Milestone 12 Verification Gate
- Completed. See `10_DELIVERABLES/Milestone 12 Verification.md`. Live OpenAI narrative verification deferred to the same bundled Version 1 smoke test.

## Milestone 13 Pending Approval
- Version 1 Stabilization and QA.
- Do not begin without explicit approval.

## Completed Milestone 10 Scope
- AI-Assisted Classification.
- Added review-first Raw Capture classification suggestion flow for Task and Review Later Resource only.
- Added Classification Corrections as historical feedback records.
- Added safe unavailable runtime behavior because no AI provider/model has been approved or configured.
- Tests use deterministic mocked provider responses.
- Did not add autonomous classification, background/batch classification, Projects, Project Updates, Morning Brief generation, Get Back on Track summaries, external integrations, prompt execution, model training, embeddings, export changes, search redesign, API hardening, or Milestone 11 work.

## Completed Milestone 12 Scope
- Read-Only AI-Assisted Morning Brief (persisted, request-driven).
- Added `morning_brief_items` table and `POST /morning-brief`, `GET /morning-brief/latest`, `GET /morning-brief/history`, `PATCH /morning-brief-items/:id`.
- Deterministic four-section assembly from Tasks, Projects, Raw Captures, Review Later Resources; fixed per-section `importance`; `confidence` inert at `1.0`.
- All matching items always saved and returned; 7-item Requires Raymond display cap is frontend-only.
- Optional AI narrative enrichment only, reusing Milestone 10.1/11 OpenAI provider plumbing; no AI-driven placement, ranking, or risk judgment.
- No source record mutation under any condition, verified across all seven source tables.
- Did not add automatic scheduling, notifications, email delivery, external integrations, AI-driven section placement, write-back to source records, a parent "Morning Briefs" table, or Milestone 13 work.

## Completed Milestone 11 Scope
- Get Back on Track Summaries.
- Added `POST /projects/:id/resume-summary`: deterministic project fields, linked open tasks, linked waiting tasks, and latest three project updates, always available with no API key.
- Added an optional AI narrative on the same response, reusing the Milestone 10.1 OpenAI provider plumbing, request-driven and never stored.
- Rejected completed and archived projects with no provider call and no mutation.
- Did not add Milestone 12 Morning Brief work, caching/persistence of narratives, multi-provider support, new dependencies, or cross-project ranking.

## Completed Milestone 10.1 Scope
- Live AI Provider Connection.
- Connected the existing provider boundary to OpenAI `gpt-5-mini` using native server-side `fetch`.
- Uses Responses API strict Structured Outputs.
- Sends only selected Raw Capture text externally.
- Generates `acceptance_id` server-side and attaches trusted local `raw_capture_id` server-side after validation.
- Keeps missing-key safe unavailable behavior.
- Did not add SDK dependencies, multi-provider architecture, model-selection UI, autonomous/background/batch classification, embeddings, training, additional targets, Morning Brief work, Get Back on Track work, or unrelated refactoring.

## Completed Milestone 9 Scope
- Minimal My Arsenal and Prompt Library.
- Added searchable My Arsenal and Prompt Library records with create, list, read, update, archive, favorite, and copy support.
- Did not add AI recommendations, auto-crawling, automatic inventory, prompt execution, prompt versioning, prompt variables/templates, tool activation, external integrations, export changes, API hardening, or Milestone 10 work.

## Completed Milestone 8 Scope
- Export and Portability.
- Added read-only Markdown and JSON exports for implemented core records.
- Did not add import/restore, scheduled backups, ZIP files, AI summaries, search changes, API hardening, or UI polish.

## Completed Milestone 7 Scope
- Search Foundation.
- Add keyword search, tags, and filters for implemented modules only.
- Do not add semantic search, vector database, Morning Brief, AI, exports, Arsenal, Prompt Library, or future module tables.

## Completed Milestone 6 Scope
- Projects and Project Updates.
- Add Projects, append-only Project Updates, and current project state.
- Do not add Search, Morning Brief, AI, exports, Arsenal, Prompt Library, or future module tables.

## Completed Milestone 5 Scope
- Review Later Resources.
- Save resources with title, type, URL/location, and why it matters.
- Do not add Projects, Search, Morning Brief, AI, or exports.
- Do not add future module tables.

## Backlog
- Trim whitespace for required string fields before storing them when it naturally fits a future milestone.
- Return HTTP 400 for malformed JSON bodies instead of allowing JSON.parse errors to propagate when it naturally fits a future milestone.
- After saving a capture, restore keyboard focus to the capture textarea when it naturally fits a future milestone.
- Consider validating waiting-task fields in a future milestone, for example requiring `waiting_on` when `status = waiting`.
- Handle malformed JSON consistently across every API endpoint with HTTP 400 responses when it naturally fits a future milestone.
- Keep tags as a simple string until search requirements justify a more complex structure.
- Keep `due_soon` as a calculated field. Do not store it in the database.
- Add one future API-hardening milestone to return HTTP 400 for malformed JSON consistently across all endpoints.
- Preserve Project Updates as append-only history unless a future approved requirement explicitly changes that design.

## Deferred Ideas
These are future concepts, not approved Version 1 build scope:
- Personal Intelligence Digest
- Full email priority engine
- Email sending or reply automation
- Contractor reminder automation
- Tenant communication automation
- Full property management operations system
- Full realtor transaction management
- Waiting-on-others automation
- Morning Executive Brief automation from live integrations
- Mobile app
- Voice capture
- Notification engine
- Dashboard customization
- Deep integrations
- Autonomous AI actions
- Full My Arsenal crawler or auto-inventory
- Full Prompt Library versioning system
- AI news, real estate news, and landlord news automation

## Do Not Start Yet
- Milestone 11 implementation
- Dashboard design
- Future product modules
- Additional AI behavior beyond approved Milestone 10 review-first classification
