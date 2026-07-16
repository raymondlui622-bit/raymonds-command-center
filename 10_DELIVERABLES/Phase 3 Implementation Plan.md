# Raymond Command Center - Phase 3 Implementation Plan

Status: Approved and frozen
Date: 2026-07-16
Implementation source of truth: `10_DELIVERABLES/Phase 2.5 Data Model and Information Flow.md`

## Purpose
Break Version 1 implementation into small milestones that can each be completed, tested, committed, summarized, and rolled back independently.

This plan does not begin implementation.

## Approved Foundations
- Phase 1: Approved.
- Phase 2: Approved.
- Phase 2.5: Approved.

## Build Rules
- Do not build the entire application at once.
- Milestone 1 is infrastructure only.
- Do not create all nine record types up front.
- Add database structures only when their corresponding module begins implementation.
- Move exports until after Raw Capture, Tasks, Review Later, and Projects have meaningful data.
- Do not add external integrations, cloud infrastructure, autonomous actions, or feature scope outside the approved Version 1.

## Required Checkpoint After Every Milestone
Each milestone must end with:
- Clean git status
- Successful local startup
- Manual test checklist completed
- Regression check against previous milestones
- Binder updated
- Git commit
- Rollback instructions verified
- Short milestone summary
- Recommendation to proceed or stop

## Milestone 1 - Local App Foundation
### Goal
Prove the local development foundation works. No features yet.

### Files to Create
- App root/config files
- React entry point
- Backend entry point
- Health endpoint
- SQLite connection check
- Basic local run instructions

### Files to Modify
- Binder progress files only after milestone completion

### Dependencies
- Node runtime
- Package manager
- React
- Small local backend framework
- SQLite library
- Basic test runner if needed

### Acceptance Criteria
- React starts
- Backend starts
- Health endpoint works
- SQLite connects
- Local development workflow is functional
- No navigation, layouts, dashboards, styling, or feature UI
- No product modules implemented

### Manual Test Checklist
- Start backend
- Start frontend
- Open local app
- Confirm backend health response
- Confirm SQLite connection check passes
- Stop and restart both services

### Rollback Strategy
Delete foundation files and return to binder-only project state.

### Estimated Complexity
Medium

## Milestone 2 - Raw Capture Data Slice
### Goal
Create only the database structure and backend data access needed for Raw Captures.

### Files to Create
- Raw Capture schema/migration
- Raw Capture data access functions
- Raw Capture test fixture
- Raw Capture data-layer tests

### Files to Modify
- Backend database initialization
- Test setup

### Dependencies
- Milestone 1
- Approved Phase 2.5 Raw Capture model

### Acceptance Criteria
- Raw Capture records can be created and read
- Raw Capture statuses match approved model
- Original raw text is preserved
- No tables for future modules are created yet

### Manual Test Checklist
- Initialize database
- Create one Raw Capture record
- Read the record back
- Confirm no Task, Project, Review Later, Prompt, Arsenal, Brief, or Correction tables exist yet

### Rollback Strategy
Remove Raw Capture schema/data files and reset local database.

### Estimated Complexity
Low to Medium

## Milestone 3 - Raw Capture Feature
### Goal
Build the first functional module: save raw captures exactly as entered.

### Files to Create
- Raw Capture backend handlers
- Raw Capture frontend view
- Raw Capture tests

### Files to Modify
- App entry only as needed to expose the Raw Capture view

### Dependencies
- Milestone 2

### Acceptance Criteria
- Raymond can enter a raw capture
- Capture status starts as `new`
- Capture can be viewed
- Capture can be archived
- Archived capture remains retrievable
- No AI classification yet

### Manual Test Checklist
- Add capture
- View capture
- Archive capture
- Confirm archived capture still exists

### Rollback Strategy
Remove Raw Capture feature handlers/views. Keep or reset Raw Capture data slice based on milestone review.

### Estimated Complexity
Medium

## Milestone 4 - Tasks and Waiting Tasks
### Goal
Add Tasks as the single action, reminder, waiting, and follow-up system.

### Files to Create
- Task schema/migration
- Task data access functions
- Task backend handlers
- Task frontend view
- Task tests

### Files to Modify
- Database initialization
- App entry/view exposure

### Dependencies
- Milestone 3
- Approved Phase 2.5 Task model

### Acceptance Criteria
- Tasks can be created, edited, completed, and archived
- Waiting tasks use `status = waiting`
- Waiting tasks support `waiting_on`, `follow_up_date`, `last_contacted_at`, and `next_action`
- No separate Follow-Up table, record, or feature exists

### Manual Test Checklist
- Create open task
- Create waiting task
- Mark task done
- Archive task
- Confirm archived task remains retrievable
- Confirm no Follow-Up structure exists

### Rollback Strategy
Remove Task files and reset Task schema/data.

### Estimated Complexity
Medium

## Milestone 5 - Review Later Resources
### Goal
Save resources with why Raymond cared.

### Files to Create
- Review Later schema/migration
- Review Later data access functions
- Review Later backend handlers
- Review Later frontend view
- Review Later tests

### Files to Modify
- Database initialization
- App entry/view exposure

### Dependencies
- Milestone 3
- Approved Phase 2.5 Review Later model

### Acceptance Criteria
- Resource can be saved with title, type, URL/location, and why it matters
- Resource statuses match approved model
- Resource can link to one primary project when projects exist later
- Resource can be archived and retrieved

### Manual Test Checklist
- Save GitHub repository
- Add why it matters
- Archive resource
- Confirm resource remains retrievable

### Rollback Strategy
Remove Review Later files and reset Review Later schema/data.

### Estimated Complexity
Medium

## Milestone 6 - Projects and Project Updates
### Goal
Add Projects, append-only Project Updates, and current project state.

### Files to Create
- Project schema/migration
- Project Update schema/migration
- Project data access functions
- Project backend handlers
- Project frontend view
- Project tests

### Files to Modify
- Database initialization
- Task and Review Later project-link behavior
- App entry/view exposure

### Dependencies
- Milestone 4
- Milestone 5
- Approved Phase 2.5 Project and Project Update models

### Acceptance Criteria
- Projects use approved simplified statuses
- `due_soon` is calculated, not stored
- `active_reason` is stored
- Project Updates are append-only
- Current project fields can change without overwriting update history
- Tasks and resources can link to one primary project

### Manual Test Checklist
- Create project
- Add project update
- Change current blocker
- Confirm old update remains
- Link task to project
- Link resource to project

### Rollback Strategy
Remove Project files and reset Project/Project Update schema/data. Preserve prior module data backups first.

### Estimated Complexity
Medium to High

## Milestone 7 - Search Foundation
### Goal
Add keyword search, tags, and filters for implemented modules only.

### Files to Create
- Search helpers/index setup
- Search backend handler
- Search results view
- Search tests

### Files to Modify
- Existing module queries

### Dependencies
- Milestone 6

### Acceptance Criteria
- Search works across Raw Captures, Tasks, Review Later, Projects, and Project Updates
- Filters support status and related project where applicable
- No semantic search or vector database exists

### Manual Test Checklist
- Search capture text
- Search task title
- Search resource URL/title
- Search project name
- Filter by status

### Rollback Strategy
Remove search files/indexes while preserving source records.

### Estimated Complexity
Medium

## Milestone 8 - Export and Portability
### Goal
Add Markdown and JSON exports now that core modules contain meaningful data.

### Files to Create
- JSON export service
- Markdown export service
- Export command or route
- Export tests

### Files to Modify
- README with export instructions

### Dependencies
- Milestone 6

### Acceptance Criteria
- JSON exports include all implemented record fields needed for recovery
- Markdown exports are human-readable
- Exports include Raw Captures, Tasks, Review Later, Projects, and Project Updates
- Exports do not become a second live source of truth

### Manual Test Checklist
- Create sample data in core modules
- Run JSON export
- Run Markdown export
- Open exported files
- Confirm readable and recoverable data

### Rollback Strategy
Remove export files and generated exports.

### Estimated Complexity
Low to Medium

## Milestone 9 - Minimal My Arsenal and Prompt Library
### Goal
Add searchable inventory and prompt library with copy support only.

### Files to Create
- Arsenal schema/migration
- Prompt schema/migration
- Arsenal handlers/view
- Prompt handlers/view
- Prompt copy support
- Unified search behavior for Arsenal and Prompts
- Tests

### Files to Modify
- Database initialization
- Search behavior

### Dependencies
- Milestone 7
- Approved Phase 2.5 Arsenal and Prompt models

### Acceptance Criteria
- Arsenal is searchable inventory only
- Prompt Library supports search and copy
- Prompt statuses are active, experimental, archived
- `favorite` is a boolean
- No auto-crawling, activation, or prompt recommendation exists

### Manual Test Checklist
- Create arsenal item
- Create prompt
- Mark prompt favorite
- Copy prompt
- Search returns both record types

### Rollback Strategy
Remove Arsenal/Prompt files and reset their schema/data.

### Estimated Complexity
Medium

## Milestone 10 - AI-Assisted Classification
### Goal
Add request-driven AI suggestions for classification without autonomous action.

### Files to Create
- AI request service
- Classification prompt templates
- Classification Correction schema/migration
- Classification review UI
- Classification Correction handlers
- Tests with mocked AI responses

### Files to Modify
- Raw Capture detail
- Task/Review Later creation flows

### Dependencies
- Milestone 5
- Approved Phase 2.5 Classification Correction model

### Acceptance Criteria
- AI suggestions are request-driven
- Raymond approves or edits before changes are applied
- Corrections are stored
- Original raw capture remains preserved
- No external system is read

### Manual Test Checklist
- Create raw capture
- Request classification
- Accept suggestion
- Reject suggestion
- Correct classification
- Confirm correction is recorded

### Rollback Strategy
Disable AI classification service and leave manual flows intact.

### Estimated Complexity
High

## Milestone 11 - Get Back on Track Summaries
### Goal
Generate project resume summaries from internal project data only.

### Files to Create
- Summary generation service
- Project summary UI section
- Tests with mocked AI responses

### Files to Modify
- Project detail view
- AI service if shared

### Dependencies
- Milestone 6
- Milestone 10

### Acceptance Criteria
- Summary uses Project, Project Updates, open Tasks, waiting Tasks, blockers, and next action
- Summary is generated on request
- Summary does not overwrite project history
- Raymond can refresh summary manually

### Manual Test Checklist
- Create project with updates
- Add waiting task
- Generate summary
- Update task
- Refresh summary

### Rollback Strategy
Remove summary UI/service and keep project data intact.

### Estimated Complexity
Medium to High

## Milestone 12 - Read-Only AI-Assisted Morning Brief
### Goal
Generate the approved Morning Brief from internal modules only.

### Files to Create
- Morning Brief Item schema/migration
- Morning Brief assembly service
- Morning Brief frontend view
- Morning Brief Item handlers
- Tests for section rules and item limits

### Files to Modify
- AI service
- Task/project/resource/capture queries

### Dependencies
- Milestone 10
- Milestone 11
- Approved Phase 2.5 Morning Brief Item model

### Acceptance Criteria
- Brief reads only from Projects, Tasks, Review Later, and Brain Dump
- Sections are Requires Raymond, Needs Verification, Waiting on Others, and FYI
- Requires Raymond targets 3-5 and normally does not exceed 7
- Waiting on Others comes from waiting tasks
- Brief Items store concise snapshots only
- Raymond can correct brief classifications

### Manual Test Checklist
- Create task requiring Raymond
- Create waiting task
- Create uncertain capture
- Generate brief
- Confirm sections
- Correct brief item
- Confirm correction is stored

### Rollback Strategy
Disable Morning Brief route/view and keep source records intact.

### Estimated Complexity
High

## Milestone 13 - Version 1 Stabilization and QA
### Goal
Verify the system is reliable, local-first, portable, and faithful to approved boundaries.

### Files to Create
- QA checklist
- Test report
- Known issues list

### Files to Modify
- README
- Binder progress files

### Dependencies
- All prior milestones

### Acceptance Criteria
- All milestone manual tests pass
- Exports work
- Search works
- No external integrations exist
- No separate Follow-Up record exists
- No cloud dependency exists
- Binder reflects current implementation status

### Manual Test Checklist
- Run full local app
- Test each module
- Export JSON and Markdown
- Restart app
- Confirm data persists
- Confirm no Gmail, Calendar, GitHub, Notion, Slack, mobile, notification, or cloud integration exists

### Rollback Strategy
Return to last known good milestone. Preserve SQLite backup and exports before rollback.

### Estimated Complexity
Medium

## Recommendation
Implementation may begin only after Raymond explicitly approves Milestone 1.

Milestone 1 remains infrastructure only. It must not include navigation, layouts, dashboards, styling, feature UI, AI behavior, or product modules.
