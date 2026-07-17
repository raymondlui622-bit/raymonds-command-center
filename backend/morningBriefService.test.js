import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { assembleMorningBrief, requestMorningBriefNarrative } from "./morningBriefService.js";
import { createRawCapture } from "./rawCaptures.js";
import { rawCaptureFixture } from "./rawCaptures.fixture.js";
import { createReviewLaterResource } from "./reviewLaterResources.js";
import { reviewLaterResourceFixture } from "./reviewLaterResources.fixture.js";
import { createProject } from "./projects.js";
import { projectFixture } from "./projects.fixture.js";
import { createTask } from "./tasks.js";
import { taskFixture } from "./tasks.fixture.js";

test("assembles requires_raymond from flagged open tasks and active-family projects only", () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-requires-open", status: "open", requires_raymond: 1 }));
    createTask(database, taskFixture({ id: "task-requires-done", status: "done", requires_raymond: 1 }));
    createTask(database, taskFixture({ id: "task-not-flagged", status: "open", requires_raymond: 0 }));
    createProject(
      database,
      projectFixture({ id: "project-requires", status: "active", requires_raymond: 1 }),
    );
    createProject(
      database,
      projectFixture({ id: "project-requires-completed", status: "completed", requires_raymond: 1 }),
    );

    const { items } = assembleMorningBrief(database);
    const requiresRaymond = items.filter((item) => item.section === "requires_raymond");

    assert.equal(requiresRaymond.length, 2);
    assert.equal(
      requiresRaymond.some((item) => item.source_refs[0].id === "task-requires-open"),
      true,
    );
    assert.equal(
      requiresRaymond.some((item) => item.source_refs[0].id === "project-requires"),
      true,
    );
    assert.equal(
      requiresRaymond.every((item) => item.importance === "high" && item.confidence === 1.0),
      true,
    );
  } finally {
    database.close();
  }
});

test("requires_raymond includes every matching item with no count-based downgrade", () => {
  const database = createTestDatabase();
  try {
    for (let index = 0; index < 9; index += 1) {
      createTask(
        database,
        taskFixture({ id: `task-requires-${index}`, status: "open", requires_raymond: 1 }),
      );
    }

    const { items } = assembleMorningBrief(database);
    const requiresRaymond = items.filter((item) => item.section === "requires_raymond");

    assert.equal(requiresRaymond.length, 9);
    assert.equal(
      requiresRaymond.every((item) => item.importance === "high"),
      true,
    );
  } finally {
    database.close();
  }
});

test("assembles waiting_on_others from waiting tasks only", () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-waiting", status: "waiting", waiting_on: "electrician" }));
    createTask(database, taskFixture({ id: "task-open", status: "open" }));

    const { items } = assembleMorningBrief(database);
    const waiting = items.filter((item) => item.section === "waiting_on_others");

    assert.equal(waiting.length, 1);
    assert.equal(waiting[0].source_refs[0].id, "task-waiting");
    assert.equal(waiting[0].importance, "medium");
  } finally {
    database.close();
  }
});

test("assembles fyi from eligible review later statuses, excluding dismissed and archived", () => {
  const database = createTestDatabase();
  try {
    createReviewLaterResource(database, reviewLaterResourceFixture({ id: "resource-new", status: "new" }));
    createReviewLaterResource(
      database,
      reviewLaterResourceFixture({ id: "resource-dismissed", status: "dismissed" }),
    );
    createReviewLaterResource(
      database,
      reviewLaterResourceFixture({ id: "resource-archived", status: "archived" }),
    );

    const { items } = assembleMorningBrief(database);
    const fyi = items.filter((item) => item.section === "fyi");

    assert.equal(fyi.length, 1);
    assert.equal(fyi[0].source_refs[0].id, "resource-new");
    assert.equal(fyi[0].importance, "low");
  } finally {
    database.close();
  }
});

test("assembles needs_verification from unresolved captures missing project or type only", () => {
  const database = createTestDatabase();
  try {
    createRawCapture(
      database,
      rawCaptureFixture({ id: "capture-missing-both", status: "new" }),
    );
    createRawCapture(
      database,
      rawCaptureFixture({
        id: "capture-complete",
        status: "new",
        related_project_id: "project-1",
        suggested_type: "task",
      }),
    );
    createRawCapture(database, rawCaptureFixture({ id: "capture-processed", status: "processed" }));

    const { items } = assembleMorningBrief(database);
    const needsVerification = items.filter((item) => item.section === "needs_verification");

    assert.equal(needsVerification.length, 1);
    assert.equal(needsVerification[0].source_refs[0].id, "capture-missing-both");
    assert.equal(needsVerification[0].importance, "medium");
  } finally {
    database.close();
  }
});

test("assembleMorningBrief gives every item a shared brief_batch_id and confidence 1.0", () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-1", status: "open", requires_raymond: 1 }));
    createTask(database, taskFixture({ id: "task-2", status: "waiting" }));

    const { briefBatchId, items } = assembleMorningBrief(database);

    assert.equal(items.length, 2);
    assert.equal(
      items.every((item) => item.brief_batch_id === briefBatchId && item.confidence === 1.0),
      true,
    );
    assert.equal(
      items.every((item) => item.review_status === "proposed" && item.ai_narrative === null),
      true,
    );
  } finally {
    database.close();
  }
});

test("requestMorningBriefNarrative is unavailable with no config and never calls fetch", async () => {
  const result = await requestMorningBriefNarrative([{ id: "item-1", section: "fyi" }], null);
  assert.deepEqual(result, { items: [{ id: "item-1", section: "fyi" }], ai_status: "unavailable" });
});

test("requestMorningBriefNarrative sends only section/title/summary/reason, no internal IDs", async () => {
  const items = [
    { id: "item-1", section: "fyi", title: "Repo", summary: "Saved repo", reason: "Not actioned." },
  ];
  const requests = [];

  const result = await requestMorningBriefNarrative(items, {
    apiKey: "test-key",
    model: "gpt-5-mini",
    fetchImpl: async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body) });
      return jsonResponse({
        output_text: JSON.stringify({ narratives: [{ narrative: "Worth a read this week." }] }),
      });
    },
  });

  const bodyText = JSON.stringify(requests[0].body);
  assert.equal(result.ai_status, "available");
  assert.equal(result.items[0].ai_narrative, "Worth a read this week.");
  assert.equal(bodyText.includes("item-1"), false);
  assert.equal(bodyText.includes("Repo"), true);
});

test("requestMorningBriefNarrative resolves to error on timeout, 4xx, 5xx, and mismatched-length output", async () => {
  const items = [{ id: "item-1", section: "fyi", title: "Repo", summary: "Saved repo", reason: "Not actioned." }];

  const timeoutResult = await requestMorningBriefNarrative(items, {
    apiKey: "test-key",
    timeoutMs: 1,
    fetchImpl: (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new Error("aborted")));
      }),
  });
  assert.equal(timeoutResult.ai_status, "error");
  assert.deepEqual(timeoutResult.items, items);

  const errorResult = await requestMorningBriefNarrative(items, {
    apiKey: "test-key",
    fetchImpl: async () => jsonResponse({}, { ok: false, status: 500 }),
  });
  assert.equal(errorResult.ai_status, "error");

  const mismatchedResult = await requestMorningBriefNarrative(items, {
    apiKey: "test-key",
    fetchImpl: async () =>
      jsonResponse({ output_text: JSON.stringify({ narratives: [] }) }),
  });
  assert.equal(mismatchedResult.ai_status, "error");
  assert.deepEqual(mismatchedResult.items, items);
});

function jsonResponse(payload, overrides = {}) {
  return {
    ok: overrides.ok ?? true,
    status: overrides.status ?? 200,
    async json() {
      return payload;
    },
  };
}

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}
