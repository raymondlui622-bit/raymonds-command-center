export function promptLibraryItemFixture(overrides = {}) {
  return {
    id: "prompt-test-1",
    title: "Get Back on Track",
    category: "project",
    description: "Summarizes the current state of a project",
    full_prompt: "Summarize this project and identify the next action.",
    tags: "project,summary",
    is_favorite: 0,
    status: "active",
    created_at: "2026-07-17T12:00:00.000Z",
    updated_at: "2026-07-17T12:00:00.000Z",
    ...overrides,
  };
}
