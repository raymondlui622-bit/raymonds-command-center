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
- Do not continue to Milestone 9 without explicit approval.

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

## Milestone 9 Pending Approval
- Minimal My Arsenal and Prompt Library.
- Add searchable inventory and prompt library with copy support only.
- Do not add Morning Brief, AI, external integrations, exports, semantic search, vector database, or future unapproved modules.

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
- Milestone 9 implementation
- Dashboard design
- Future product modules
- AI behavior
