# Raymond Command Center - Blueprint

## Product Vision
Raymond Command Center is Raymond's personal AI Chief of Staff, COO, and searchable operating layer.

It should review Raymond's operational world, filter what genuinely requires his attention, catch slipping obligations, restore project context, and recommend the highest-leverage actions. It should also make Raymond's reusable tools, prompts, workflows, agents, and saved knowledge easy to find when they reduce cognitive load.

The Command Center should feel less like a dashboard and more like an experienced Chief of Staff saying:

"Good morning, Raymond. I've already reviewed everything. Here are the only things you need to care about today, here's what's slipping, here's where you left off, and here's what I would do first."

## Core User
Raymond is the primary user. He is the final decision-maker, not the manual operator of the system.

The system should prepare, organize, summarize, draft, monitor, and recommend wherever possible. It should interrupt Raymond only when his judgment, approval, relationship management, negotiation, strategic direction, or direct action is genuinely required.

## Main Problems
- Too much manual checking across email, projects, notes, tenant issues, contractor threads, deals, saved links, and AI work.
- Important operational items can fall through the cracks.
- Project context is hard to resume after time away.
- Useful prompts, tools, workflows, and resources already exist but are hard to find at the moment of need.
- Saved knowledge often loses the original reason it mattered.
- Daily priorities are not always obvious across competing obligations.

## Version 1 Goals
- Provide one fast capture point for thoughts, tasks, follow-ups, reminders, project updates, decisions, and useful links.
- Create lightweight task and follow-up tracking.
- Create a Review Later / Knowledge Queue that preserves why an item was saved.
- Track active projects well enough to answer "Where did I leave off?"
- Generate Get Back on Track summaries for active projects.
- Create minimal searchable indexes for My Arsenal and Prompt Library.
- Define a read-only Morning Executive Brief that can be reviewed, trusted, and refined before automation.
- Reduce cognitive load without creating a large productivity app.

## Version 1 Modules
1. Universal Brain Dump / Quick Capture
2. Tasks and Follow-Ups
3. Review Later / Knowledge Queue
4. Projects on the Go
5. Get Back on Track summaries
6. Minimal My Arsenal as a searchable inventory only
7. Minimal Prompt Library as searchable with copy support only
8. AI-assisted Morning Executive Brief reading only from internal Command Center modules

## Product Success Metric
The Command Center succeeds if, within three minutes of opening it each morning, Raymond can confidently answer:

- What deserves my attention today?
- What is falling through the cracks?
- Where did I leave off?
- What are my top three priorities?
- What can wait?

without opening Gmail, Finder, GitHub, or any other application.

## Deferred Modules
- Personal Intelligence Digest
- Email automation and sending
- Full email priority engine
- Full property management operations system
- Full realtor transaction management
- Contractor reminder automation
- Tenant communication automation
- Waiting-on-others automation
- Notification engine
- Mobile app
- Voice capture
- Dashboard customization
- Deep integrations
- Autonomous AI actions

## Homepage Information Hierarchy
The homepage should eventually be the Morning Executive Brief, not a grid of modules.

1. Requires Raymond
2. Top three recommended priorities
3. Needs Verification
4. Waiting on Others
5. Projects stalled or off track
6. Outstanding tenant, contractor, deal, and project issues
7. Email volume with only attention-worthy items surfaced
8. FYI / Research

The brief should be readable in under three minutes.

Requires Raymond should normally contain no more than 7 items, with a target of 3-5.

## Requires Raymond Rules
Show an item only when Raymond's decision, approval, judgment, relationship management, strategic direction, negotiation, or direct action is genuinely needed.

Eligible categories:
- Money and approval decisions
- Property and tenant operations
- Realtor and transaction matters
- AI project approvals and blockers
- Strategic decisions
- Personal and family obligations

Do not show items merely because they are new, unread, recent, or related to work.

## Needs Verification Rules
Use Needs Verification for items where the system is uncertain, missing context, or cannot confidently determine whether Raymond needs to act.

Include uncertain items when they may involve:
- Legal risk
- Transaction deadlines
- Urgent tenant issues
- Money
- Major project blockers
- Important relationship context
- Safety or time-sensitive obligations

Each Needs Verification item should explain:
- What the system detected
- Why it is uncertain
- What information is missing
- Source evidence
- Suggested next step
- Confidence level

Needs Verification may be collapsed by default, but it should show the number of items and whether any are high-risk.

## FYI Rules
FYI contains useful information that does not require action.

Examples:
- AI news
- Toronto real estate news
- Ontario landlord updates
- Saved resources
- Interesting repositories
- Market trends
- Research updates

FYI should never compete visually or mentally with operational work.

## Trust and Evidence Requirements
The system should earn trust over time.

Every recommendation should include:
- Reasoning
- Confidence
- Importance
- Source evidence
- Suggested next action
- Clear escalation category

The system should prefer one extra surfaced item over hiding a critical one, especially in high-risk domains.

Raymond should be able to correct classifications using actions such as:
- Requires Me
- Waiting on Someone Else
- FYI Only
- Create Task
- Dismiss
- Link to Existing Issue

Corrections should improve future recommendations while keeping a visible record of why behavior changed.

## Core User Flows
### Morning Review
Raymond opens the Command Center, reads Requires Raymond, reviews the top three priorities, optionally opens Needs Verification, and leaves knowing what deserves attention today.

### Quick Capture
Raymond captures an idea, task, link, reminder, decision, project update, or follow-up without organizing it first. AI later suggests type, project, priority, status, and next action.

### Review Later
Raymond saves a resource with the reason it mattered. Later, the system helps turn it into reference material, a task, a project input, or FYI.

### Get Back on Track
Raymond selects a project and sees a 30-second summary, last completed step, current blocker, waiting-on, and exact next action.

### Find a Reusable Asset
Raymond searches My Arsenal or Prompt Library for a topic such as tenant, SEO, YouTube, or OpenArt and sees relevant tools, prompts, workflows, skills, or resources.

## Shared Data Concepts
Many modules share the same underlying concepts:
- Title
- Type
- Source
- Date captured
- Why it matters
- Related project
- Related person or organization
- Status
- Priority
- Confidence
- Importance
- Evidence
- Next action
- Waiting on
- Due date or follow-up date
- Tags
- Last reviewed
- Last updated

## Version 1 Source Boundaries
Version 1 reads only from internal Command Center modules:
- Projects
- Tasks
- Review Later
- Brain Dump

The Morning Executive Brief is AI-assisted, not fully automated.

## Active Projects Definition
For Version 1, active projects are only those currently being worked on, blocked, waiting for approval, waiting on another person, or due within 30 days.

## MVP Boundaries
- Do not build the application yet.
- Do not create a database yet.
- Technical architecture may be designed in Phase 2, but implementation must wait for approval.
- Do not create a polished dashboard before the information system works.
- Do not turn every future module into Version 1 scope.
- Do not create duplicate task, project, or knowledge systems without checking the existing AI OS architecture.
- Keep Version 1 focused on capture, review, project context, reusable libraries, and a read-only brief.

## Phase 2 Architecture Direction
Recommended Version 1 architecture:
- Local-first web app.
- Simple React frontend.
- Small local backend.
- SQLite as the local operational database.
- SQLite full-text search plus tags and filters.
- Request-driven AI assistance.
- Markdown and JSON exports for backup and portability.

Source-of-truth rule:
- The app database owns live operational records.
- The project binder owns product decisions, PRDs, architecture, and governance.
- Markdown and JSON exports are readable backups, not competing live systems.

Version 1 should not use cloud infrastructure, external integrations, vector databases, microservices, collaboration features, autonomous actions, or a desktop wrapper.

## Phase 2.5 Data Model Direction
Status: Approved.

Recommended Version 1 record types:
- Raw Captures
- Tasks
- Review Later Resources
- Projects
- Project Updates
- My Arsenal Items
- Prompt Library Items
- Morning Brief Items
- Classification Corrections

Data model principles:
- Preserve original raw captures by default.
- Use one primary project link per record in Version 1.
- Use Tasks as the single action and follow-up system.
- Represent Waiting on Others with Tasks where `status = waiting`.
- Store project updates as append-only history.
- Store Morning Brief items as daily snapshots that point back to source records.
- Keep live operational data in SQLite.
- Export Markdown and JSON for backup and portability.

## Phase 3 Implementation Direction
Phase 3 should proceed in small, independently testable milestones.

The first milestone should build only the local app foundation needed to support future modules. It should not implement product features, AI behavior, or the Morning Brief.

## Future Phase Notes
### Personal Intelligence Digest
Purpose: Aggregate the 5-6 newsletters Raymond subscribes to, summarize them, remove duplicate stories, rank items by relevance to his work, and produce one concise digest.

Default placement: FYI / Research.

Only promote an item into Requires Raymond when the system can clearly explain what changed, why it affects Raymond, what action is needed, and when he needs to act.

Status: Future backlog, not MVP.
