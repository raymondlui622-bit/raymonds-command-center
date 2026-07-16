# Raymond Command Center - Phase 1 Approved PRD

Status: Approved source of truth for Phase 1
Date: 2026-07-16

## Product Success Metric
The Command Center succeeds if, within three minutes of opening it each morning, Raymond can confidently answer:

- What deserves my attention today?
- What is falling through the cracks?
- Where did I leave off?
- What are my top three priorities?
- What can wait?

without opening Gmail, Finder, GitHub, or any other application.

## 1. Product Vision
Raymond Command Center is Raymond's personal AI Chief of Staff, COO, and searchable operating layer.

It should review Raymond's operational world, filter what genuinely requires his attention, catch slipping obligations, restore project context, and recommend the three highest-leverage actions for the day. It should also make Raymond's reusable tools, prompts, workflows, agents, and saved knowledge easy to find when they reduce cognitive load.

The system should feel like an experienced Chief of Staff saying:

"Good morning, Raymond. I've already reviewed everything. Here are the only things you need to care about today, here's what's slipping, here's where you left off, and here's what I would do first."

## 2. Primary User and Core Problems
Primary user: Raymond.

Core problems:
- Manual checking across too many places creates cognitive load.
- Important emails, tenant issues, contractor delays, deal matters, project blockers, and deadlines can fall through the cracks.
- Active project context is hard to resume quickly.
- Useful tools, prompts, workflows, and saved resources are hard to find when needed.
- Saved resources often lose the reason they mattered.
- Daily priorities are hard to choose across competing obligations.

## 3. Version 1 Goals
- Create one fast capture point for ideas, tasks, links, reminders, project updates, decisions, and follow-ups.
- Track tasks and follow-ups lightly.
- Preserve saved knowledge with the reason it mattered.
- Track active projects well enough to answer "Where did I leave off?"
- Produce Get Back on Track summaries.
- Create minimal searchable indexes for My Arsenal and Prompt Library.
- Define and test a read-only Morning Executive Brief.
- Keep the product small enough to reduce cognitive load rather than add a new system burden.

## 4. Version 1 Modules
### Universal Brain Dump / Quick Capture
Fast capture for tasks, ideas, follow-ups, project updates, reminders, decisions, and useful links. Raymond should not need to categorize first.

### Tasks and Follow-Ups
Lightweight tracking for actionable items, waiting items, priorities, due dates, and next actions.

### Review Later / Knowledge Queue
A queue for websites, repositories, YouTube videos, articles, tools, research, reports, and ideas. Each item must preserve why Raymond cared.

### Projects on the Go
A simple view of active projects, current phase, last completed step, source of truth, blocker, next action, waiting-on, and priority.

### Get Back on Track Summaries
For each active project, provide a 30-second summary, last completed step, current blocker, and exact next action.

### Minimal My Arsenal
A searchable inventory of high-value reusable assets such as skills, prompts, plugins, MCP servers, agents, automations, APIs, tools, templates, SOPs, and proven workflows.

Minimum fields: name, type, what it solves, when to use it, how to access it, tags, related project, status, and notes.

Version 1 boundary: searchable inventory only. No automatic crawling, activation, or management.

### Minimal Prompt Library
A searchable home for approved or useful prompts.

Minimum fields: title, purpose, full prompt, category, tags, related project, tool/model, notes, and favorite status.

Version 1 boundary: searchable with copy support only. No advanced versioning or automated prompt recommendation.

### Read-Only Morning Executive Brief
An AI-assisted brief that reads only from internal Command Center modules in Version 1. It is not fully automated and does not read external systems directly.

Version 1 sources:
- Projects
- Tasks
- Review Later
- Brain Dump

## 5. Deferred Modules
- Personal Intelligence Digest
- Full email priority engine
- Email reply automation or sending
- Full property management operations system
- Full realtor transaction management
- Contractor reminder automation
- Tenant communication automation
- Waiting-on-others automation
- Mobile app
- Voice capture
- Notification engine
- Dashboard customization
- Deep integrations
- Autonomous AI actions
- Full My Arsenal crawler or auto-inventory
- Full Prompt Library versioning system
- AI news, real estate news, and landlord news automation

## 6. Homepage Information Hierarchy
The eventual homepage should be the Morning Executive Brief.

Order:
1. Requires Raymond
2. Top three recommended priorities
3. Needs Verification
4. Waiting on Others
5. Projects stalled or off track
6. Outstanding tenant, contractor, deal, and project issues
7. Email volume and only the items requiring attention
8. FYI / Research

The brief should be readable in under three minutes.

Requires Raymond should normally contain no more than 7 items, with a target of 3-5.

## 7. Requires Raymond Rules
Requires Raymond is for high-confidence items that genuinely need Raymond's decision, approval, judgment, relationship management, strategic direction, negotiation, or direct action.

Eligible categories:
- Money and approval decisions
- Property and tenant operations
- Realtor and transaction matters
- AI project approvals and blockers
- Strategic decisions
- Personal and family obligations

Items should not appear merely because they are new, unread, recent, or related to work.

Normal limit: no more than 7 items, with a target of 3-5. If more than 7 items appear, the system should group, prioritize, or move lower-confidence items into Needs Verification.

## 8. Needs Verification Rules
Needs Verification is for uncertain or missing-context items that may matter.

Use this section when the system cannot confidently determine whether Raymond needs to act, especially if the item may involve:
- Legal risk
- Transaction deadlines
- Urgent tenant issues
- Money
- Major project blockers
- Important relationship context
- Safety or time-sensitive obligations

Each item should show:
- What the system detected
- Why it is uncertain
- What information is missing
- Source
- Suggested next step
- Confidence level

Suggested resolution actions:
- Requires Me
- Waiting on Someone Else
- FYI Only
- Create Task
- Dismiss
- Link to Existing Issue

## 9. FYI Rules
FYI is useful information that does not require action.

Examples:
- AI news
- Toronto real estate news
- Ontario landlord updates
- Interesting repositories
- Market trends
- Saved resources
- Research

FYI should never compete with operational work.

## 10. Trust and Evidence Requirements
The system should earn trust over time.

Every recommendation should include:
- Reasoning
- Confidence
- Importance
- Evidence
- Source
- Suggested next action

The system should learn from Raymond's corrections while preserving a visible record of why a recommendation changed.

Trust stages:
1. Assisted Review: Raymond verifies heavily.
2. Guided Delegation: AI handles more low-risk sorting and drafting.
3. Trusted Briefing: Raymond mostly relies on the Command Center for morning review.
4. Proactive Operator: AI monitors, prepares, follows up, and escalates only when needed.

## 11. Core User Flows
### Morning Review
Raymond opens the brief, reviews Requires Raymond, sees the top three priorities, optionally opens Needs Verification, and leaves knowing what needs attention today.

### Quick Capture
Raymond captures an item without categorizing it. AI suggests the type, related project, priority, status, and next action later.

### Review Later
Raymond saves a resource with why it mattered. The item can later become reference material, a task, a project input, or FYI.

### Project Resume
Raymond opens a project and receives a 30-second Get Back on Track summary with last completed step, blocker, waiting-on, and next action.

### Search Reusable Assets
Raymond searches My Arsenal or Prompt Library and finds relevant tools, workflows, prompts, skills, agents, or resources.

## 12. Data Shared Across Modules
Shared concepts:
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

Active Projects definition for Version 1:
- Currently being worked on
- Blocked
- Waiting for Raymond's approval
- Waiting on another person
- Due within 30 days

## 13. MVP Boundaries
- No coding before PRD approval.
- No database design before PRD approval.
- No technical architecture before PRD approval.
- No polished dashboard before the information system works.
- No duplicate task, project, or knowledge systems without checking the existing AI OS architecture.
- No autonomous sending, spending, approving, or legal action.
- No full automation of email, property management, or project management in Version 1.

## 14. Risks and Resolved Decisions
Risks:
- Version 1 may become too broad if My Arsenal and Prompt Library expand beyond their approved minimal boundaries.
- A read-only brief may be less satisfying than automation, but it is safer for trust validation.
- If source systems are unclear, the product may duplicate existing AI OS architecture.
- If Requires Raymond is too loose, the brief becomes noisy.
- If Needs Verification is too hidden, uncertain high-risk items may be missed.

Resolved Version 1 decisions:
- Minimal My Arsenal remains in Version 1 as a searchable inventory only.
- Minimal Prompt Library remains in Version 1 as searchable with copy support only.
- Version 1 only reads from internal Command Center modules: Projects, Tasks, Review Later, and Brain Dump.
- The Morning Executive Brief is AI-assisted, not fully automated.
- Requires Raymond should normally contain no more than 7 items, with a target of 3-5.
- Active Projects are only those currently being worked on, blocked, waiting for approval, waiting on another person, or due within 30 days.

## 15. Recommended Build Phases
### Phase 1: Product Definition
Complete. The PRD is approved and frozen as the Phase 1 source of truth.

### Phase 2: Technical Architecture
Only after PRD approval, design data model, source integrations, permission model, evidence model, and trust/correction loop.

### Phase 3: Manual or Semi-Manual Prototype
Create a low-risk version that validates capture, project summaries, review later, reusable libraries, and the read-only brief.

### Phase 4: Automation and Integrations
Add integrations only after the information model proves useful.

### Phase 5: Proactive Operator
Add reminders, recommendations, follow-ups, and higher trust automation after repeated correction and validation.
