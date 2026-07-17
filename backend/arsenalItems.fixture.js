export function arsenalItemFixture(overrides = {}) {
  return {
    id: "arsenal-test-1",
    name: "Prompt Master",
    category: "skill",
    description: "Improves reusable prompts",
    url: "https://example.com/prompt-master",
    tags: "prompt,skill",
    notes: "Use for reusable prompt cleanup",
    status: "active",
    created_at: "2026-07-17T12:00:00.000Z",
    updated_at: "2026-07-17T12:00:00.000Z",
    ...overrides,
  };
}
