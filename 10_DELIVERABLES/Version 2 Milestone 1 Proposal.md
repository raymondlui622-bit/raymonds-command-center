# Version 2 — Milestone 1: Dashboard UI Foundation

Status: Proposed — awaiting Raymond's approval
Date: 2026-07-17
Type: UI only. No backend, database, API, AI, export, search, or business-logic changes.

---

## 1. Current UI Problems

- Zero styling. No stylesheet exists anywhere in the app. Everything renders as browser-default HTML: black text, blue links, unstyled forms.
- One giant page. All nine sections (Morning Brief, Search, Export, Raw Capture, Tasks, Review Later, My Arsenal, Prompt Library, Projects) stack vertically in a single scroll. Finding anything means scrolling.
- No navigation. No header, no sidebar, no way to jump to a section.
- Forms are walls of bare labels and inputs with no grouping or spacing.
- Lists render as plain bullet points — records, statuses, and actions all blur together.
- No visual difference between a status ("blocked"), a title, and a note.
- Empty states are single bare sentences ("No search results.") with no guidance.
- All code lives in one 1,861-line file, `src/main.jsx`, which makes any UI change risky and hard to review.

## 2. Proposed Layout

Classic two-column app shell, desktop-first:

```
+--------------------------------------------------------------+
| Header: app name | quick capture shortcut | (right: status)  |
+------------+-------------------------------------------------+
| Left nav   |  Content area                                   |
|            |                                                 |
| Morning    |  One section visible at a time.                 |
| Brief      |  Section = page title + cards/tables/forms      |
| Capture    |  with consistent spacing.                       |
| Tasks      |                                                 |
| ...        |                                                 |
+------------+-------------------------------------------------+
```

- Header: app name left, a "Capture" quick-jump button, nothing else. Thin, stays out of the way.
- Left nav: fixed-width column listing every section. Active section highlighted.
- Content area: shows only the selected section. Max content width capped (~1100px) so text stays readable on big monitors.
- Below ~800px wide: nav collapses to a horizontal scrollable strip under the header; content goes full width. Usable, not optimized — desktop is the target.

## 3. Proposed Navigation Structure

Single flat list — no nesting, no dropdowns:

1. Morning Brief (default landing view)
2. Search
3. Raw Captures
4. Tasks
5. Projects (Project Updates, Decisions, Lessons, and Get Back on Track live inside each project card — see note below)
6. Review Later
7. My Arsenal
8. Prompt Library
9. Export

Nav switches sections with plain React state (`activeSection`). No router, no new dependency. Every section stays mounted logic-wise exactly as today — only visibility changes.

**Note on Decisions and Lessons:** these are not separate record types in Version 1 — they exist only as the free-text `update_type` on Project Updates. This milestone gives them visual treatment (a badge on each update: progress / decision / lesson / blocker) inside the Projects section. Making them first-class sections would need data-model changes — out of scope here, candidate for a later V2 milestone.

## 4. Files Created or Modified

| File | Action | What |
|---|---|---|
| `src/styles.css` | **Create** | The one stylesheet. Design tokens (colors, spacing, type scale) as CSS variables at top, then shell, nav, cards, forms, buttons, tables, badges, empty states. |
| `src/main.jsx` | **Modify** | Import stylesheet, add shell markup (header + nav + section switching), add classNames, extract 3 files below. Logic untouched. |
| `src/sections.jsx` | **Create** | The nine section render blocks moved out of App (extraction detail in §5). |
| `src/ui.jsx` | **Create** | Small shared presentational pieces: `Card`, `EmptyState`, `StatusBadge`, `Section` wrapper. Dumb components, no state, no fetch. |
| `index.html` | **Modify (maybe)** | Only if a font stack meta/link is wanted — current plan uses system fonts, so likely untouched. |

No new dependencies. No backend files touched. No changes under `backend/`.

## 5. Should main.jsx Be Split? Minimum Practical Split

Yes — but minimally. Restyling nine sections inside one 1,861-line file means every edit risks breaking unrelated sections, and review becomes impossible.

Minimum split (3 new files total, listed above):

- **Keep in `main.jsx`:** all state, all fetch/save/update/archive functions, all payload builders, the constants, the App component itself. This is the risky logic — it does not move.
- **Move to `sections.jsx`:** the JSX return blocks for each section, converted to plain function components that receive state + handlers as props. This is a mechanical cut-and-paste with props threaded through — no behavior change.
- **Move to `ui.jsx`:** the 4 tiny shared visuals (Card, EmptyState, StatusBadge, Section).

Explicitly **not** doing: per-section folders, custom hooks, state management refactor, splitting the handler functions, TypeScript, or any "proper architecture" pass. That is a separate decision for a later milestone if V2 grows.

## 6. Milestone Scope

- App shell: header + left nav + content area
- Section switching (one section visible at a time)
- One stylesheet at `src/styles.css` — design tokens, layout, components
- Every section visually distinct: page title, cards for records, styled forms, styled tables/lists
- Status badges for task status, project status, review-later status, and update type
- Clear empty states for every section (short message + what to do next)
- Consistent buttons (primary / secondary / danger for archive)
- Responsive: desktop-first, usable down to ~700px
- The minimum file split described in §5
- All Version 1 behavior preserved exactly

## 7. Explicitly Out of Scope

- Any backend, database, migration, or API change
- Any AI, classification, export, or search logic change
- New record types (Decisions/Lessons as first-class sections)
- New features, new fields, new buttons that do new things
- CSS frameworks (Tailwind, Bootstrap) or any new npm dependency
- Routing library / URL-based navigation
- Dark mode
- Mobile-optimized layout (usable is enough)
- Icons libraries, animations, charts
- Full component architecture refactor, custom hooks, TypeScript

## 8. Implementation Sequence

1. Create `src/styles.css` with design tokens and base styles (typography, spacing, buttons, forms, cards, badges, empty states). App still renders unchanged.
2. Extract `ui.jsx` (Card, EmptyState, StatusBadge, Section) — unused at first.
3. Extract sections from `main.jsx` into `sections.jsx` one at a time, verifying each still works before the next. No styling yet — pure mechanical move.
4. Build the shell in `main.jsx`: header, left nav, `activeSection` state, content area.
5. Style sections one at a time, simplest first: Export, Search, Raw Captures, Review Later, My Arsenal, Prompt Library, Tasks, Morning Brief, Projects (most complex last).
6. Add empty states everywhere.
7. Responsive pass (~700–1000px widths).
8. Full manual verification (checklist below), then verification doc in `10_DELIVERABLES`.

Each numbered step is a separate commit, so any step can be reverted alone.

## 9. Verification Checklist

For every section, with backend running:

- [ ] Section reachable from left nav; active state highlights correctly
- [ ] Create works (capture, task, project, review-later, arsenal, prompt, project update)
- [ ] Edit/update works and persists after refresh
- [ ] Archive works for each record type
- [ ] Morning Brief: generate, refresh, review buttons, "show more" toggle
- [ ] Search: all filters return same results as V1
- [ ] Export: all export buttons produce same files as V1
- [ ] Classification panel: request, accept, reject, correction flows unchanged
- [ ] Get Back on Track summary renders
- [ ] Prompt copy button works
- [ ] Every section shows its empty state with an empty database
- [ ] All backend tests still pass (`backend/*.test.js` — nothing should have touched them)
- [ ] Layout usable at 700px, 1024px, 1440px widths
- [ ] No console errors

## 10. Rollback Plan

- Work happens on a branch (`v2-milestone-1-ui`), merged to `main` only after verification.
- Version 1 is fully committed and tagged at the current `main` (`b326581`). Rollback = `git checkout main` / revert the merge commit.
- Because implementation lands as one commit per sequence step, a partial problem can be reverted step-by-step instead of all-or-nothing.
- No data risk: no schema, API, or data changes anywhere in this milestone.

## 11. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Section extraction breaks a handler wire-up (wrong prop passed) | Medium | Extract one section at a time, manually test each before moving on |
| Section switching hides a bug (state that assumed everything visible) | Low | Sections keep same mount/state model; only CSS/conditional render changes visibility — verify each flow per checklist |
| Styling changes form behavior (e.g., label `htmlFor` mismatch after edits) | Low | ClassNames added, structure preserved; checklist covers every form |
| Scope creep ("while we're here…") | High | §7 is the contract. Anything new becomes a Milestone 2 note |
| 1,861-line file merge pain if other work happens in parallel | Low | Single branch, short milestone, no parallel edits to main.jsx |

## 12. Recommended Visual Direction (Plain English)

Borrow Curious Made Simple's foundation, toned down for a work tool:

- **Background:** soft off-white — Parchment (`#F3ECDB`) or a lighter near-white version of it if full parchment feels too warm on a dashboard. Cards sit slightly deeper (`#EFE6D0`) with hairline borders (`#E0D5BC`).
- **Text:** warm near-black Ink (`#20201D`). Never pure black, never gray-on-gray.
- **One accent:** Luna Teal (`#2E6E60`) for the active nav item, primary buttons, and links. Burnt Orange (`#C25A2B`) reserved for a few status badges (blocked, requires attention) so warnings actually stand out.
- **Type:** system font stack (no webfont download, instant load). Clear scale — one page title, one card title size, one body size, one small-label size. Nothing else.
- **Feel:** modern editorial/SaaS — generous whitespace, cards with soft corners and hairline borders, no shadows heavier than a whisper, no gradients, no animation. Calm and readable, like Notion or Linear, but warm instead of sterile.
- **Badges:** small rounded pills, tinted background + dark text. One color per meaning, used consistently everywhere (e.g., green-teal = done/active, orange = blocked/attention, neutral tan = archived/neutral).
- **Empty states:** centered short message in a card — what's empty and the one action that fills it ("No tasks yet. Add one above."). No illustrations.

---

**Next step:** Raymond reviews and approves. No code changes until approval.
