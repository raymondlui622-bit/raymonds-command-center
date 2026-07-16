export function rawCaptureFixture(overrides = {}) {
  return {
    id: "raw-capture-test-1",
    raw_text: "Follow up with electrician about Cory exterior lighting",
    source: "manual",
    status: "new",
    captured_at: "2026-07-16T09:00:00.000Z",
    ...overrides,
  };
}
