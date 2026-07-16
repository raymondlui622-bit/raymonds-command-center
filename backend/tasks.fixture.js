export function taskFixture(overrides = {}) {
  return {
    id: "task-test-1",
    title: "Confirm electrician visit",
    status: "open",
    priority: "medium",
    created_at: "2026-07-16T12:00:00.000Z",
    ...overrides,
  };
}
