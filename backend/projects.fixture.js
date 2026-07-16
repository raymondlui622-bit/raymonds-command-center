export function projectFixture(overrides = {}) {
  return {
    name: "Raymond Command Center",
    status: "active",
    current_phase: "Phase 3 implementation",
    priority: "high",
    source_of_truth: "10_DELIVERABLES/Phase 3 Implementation Plan.md",
    last_completed_step: "Milestone 5 approved",
    current_blocker: "Milestone 6 implementation",
    next_action: "Add Projects and Project Updates",
    active_reason: "currently being worked on",
    ...overrides,
  };
}

export function projectUpdateFixture(overrides = {}) {
  return {
    update_text: "Milestone 6 project tracking added.",
    update_type: "progress",
    source: "manual",
    decision_recorded: "Use append-only Project Updates.",
    next_action: "Verify current project state can change without rewriting history.",
    ...overrides,
  };
}
