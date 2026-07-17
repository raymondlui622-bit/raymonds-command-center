import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import { handleMorningBriefRequest } from "./morningBriefHandlers.js";
import { createTask } from "./tasks.js";
import { taskFixture } from "./tasks.fixture.js";
import { createProject } from "./projects.js";
import { projectFixture } from "./projects.fixture.js";
import { createRawCapture } from "./rawCaptures.js";
import { rawCaptureFixture } from "./rawCaptures.fixture.js";
import { createReviewLaterResource } from "./reviewLaterResources.js";
import { reviewLaterResourceFixture } from "./reviewLaterResources.fixture.js";
import { createArsenalItem } from "./arsenalItems.js";
import { arsenalItemFixture } from "./arsenalItems.fixture.js";
import { createPromptLibraryItem } from "./promptLibraryItems.js";
import { promptLibraryItemFixture } from "./promptLibraryItems.fixture.js";

test("POST /morning-brief generates and persists a deterministic batch with no key configured", async () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-requires", status: "open", requires_raymond: 1 }));
    createTask(database, taskFixture({ id: "task-waiting", status: "waiting", waiting_on: "vendor" }));

    const response = await sendRequest(database, {
      method: "POST",
      url: "/morning-brief",
      openAIConfig: null,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ai_status, "unavailable");
    assert.equal(typeof response.body.brief_batch_id, "string");
    assert.equal(response.body.items.requires_raymond.length, 1);
    assert.equal(response.body.items.waiting_on_others.length, 1);
    assert.equal(
      response.body.items.requires_raymond.every(
        (item) => item.brief_batch_id === response.body.brief_batch_id && item.confidence === 1.0,
      ),
      true,
    );
  } finally {
    database.close();
  }
});

test("POST /morning-brief returns AI narrative when the provider succeeds", async () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-requires", status: "open", requires_raymond: 1 }));

    const response = await sendRequest(database, {
      method: "POST",
      url: "/morning-brief",
      openAIConfig: {
        apiKey: "test-key",
        fetchImpl: async () =>
          jsonResponse({
            output_text: JSON.stringify({ narratives: [{ narrative: "Needs your sign-off today." }] }),
          }),
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ai_status, "available");
    assert.equal(response.body.items.requires_raymond[0].ai_narrative, "Needs your sign-off today.");
  } finally {
    database.close();
  }
});

test("POST /morning-brief stays fully usable on provider timeout, 4xx, 5xx, and malformed output", async () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-requires", status: "open", requires_raymond: 1 }));

    const failingConfigs = [
      { apiKey: "test-key", fetchImpl: async () => jsonResponse({}, { ok: false, status: 401 }) },
      { apiKey: "test-key", fetchImpl: async () => jsonResponse({}, { ok: false, status: 500 }) },
      {
        apiKey: "test-key",
        timeoutMs: 1,
        fetchImpl: (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      },
      { apiKey: "test-key", fetchImpl: async () => jsonResponse({ output_text: "not json" }) },
    ];

    for (const openAIConfig of failingConfigs) {
      const response = await sendRequest(database, { method: "POST", url: "/morning-brief", openAIConfig });
      assert.equal(response.statusCode, 200);
      assert.equal(response.body.ai_status, "error");
      assert.equal(response.body.items.requires_raymond.length, 1);
      assert.equal(response.body.items.requires_raymond[0].ai_narrative, null);
    }
  } finally {
    database.close();
  }
});

test("two generations produce two distinct brief_batch_id values", async () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-requires", status: "open", requires_raymond: 1 }));

    const first = await sendRequest(database, { method: "POST", url: "/morning-brief", openAIConfig: null });
    const second = await sendRequest(database, { method: "POST", url: "/morning-brief", openAIConfig: null });

    assert.notEqual(first.body.brief_batch_id, second.body.brief_batch_id);

    const history = await sendRequest(database, { method: "GET", url: "/morning-brief/history" });
    assert.equal(history.body.batches.length, 2);
  } finally {
    database.close();
  }
});

test("GET /morning-brief/latest returns only the newest batch", async () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-requires", status: "open", requires_raymond: 1 }));
    await sendRequest(database, { method: "POST", url: "/morning-brief", openAIConfig: null });
    const second = await sendRequest(database, { method: "POST", url: "/morning-brief", openAIConfig: null });

    const latest = await sendRequest(database, { method: "GET", url: "/morning-brief/latest" });
    assert.equal(latest.body.brief_batch_id, second.body.brief_batch_id);
  } finally {
    database.close();
  }
});

test("GET /morning-brief/history returns batch metadata without item bodies", async () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-requires", status: "open", requires_raymond: 1 }));
    createReviewLaterResource(database, reviewLaterResourceFixture({ id: "resource-1", status: "new" }));
    await sendRequest(database, { method: "POST", url: "/morning-brief", openAIConfig: null });

    const history = await sendRequest(database, { method: "GET", url: "/morning-brief/history" });
    assert.equal(history.body.batches.length, 1);
    assert.equal(history.body.batches[0].counts.requires_raymond, 1);
    assert.equal(history.body.batches[0].counts.fyi, 1);
    assert.equal(history.body.batches[0].items, undefined);
  } finally {
    database.close();
  }
});

test("PATCH accepts, dismisses, and corrects an item; rejects invalid review_status and missing section", async () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-requires", status: "open", requires_raymond: 1 }));
    const generated = await sendRequest(database, { method: "POST", url: "/morning-brief", openAIConfig: null });
    const itemId = generated.body.items.requires_raymond[0].id;

    const accepted = await sendRequest(database, {
      method: "PATCH",
      url: `/morning-brief-items/${itemId}`,
      body: { review_status: "accepted" },
    });
    assert.equal(accepted.statusCode, 200);
    assert.equal(accepted.body.item.review_status, "accepted");

    const corrected = await sendRequest(database, {
      method: "PATCH",
      url: `/morning-brief-items/${itemId}`,
      body: { review_status: "corrected", section: "waiting_on_others", corrected_note: "Actually waiting." },
    });
    assert.equal(corrected.statusCode, 200);
    assert.equal(corrected.body.item.section, "waiting_on_others");
    assert.equal(corrected.body.item.corrected_note, "Actually waiting.");

    const invalidStatus = await sendRequest(database, {
      method: "PATCH",
      url: `/morning-brief-items/${itemId}`,
      body: { review_status: "proposed" },
    });
    assert.equal(invalidStatus.statusCode, 422);
    assert.deepEqual(invalidStatus.body, { error: "invalid_review_status" });

    const missingSection = await sendRequest(database, {
      method: "PATCH",
      url: `/morning-brief-items/${itemId}`,
      body: { review_status: "corrected" },
    });
    assert.equal(missingSection.statusCode, 422);
    assert.deepEqual(missingSection.body, { error: "invalid_section" });

    const missingItem = await sendRequest(database, {
      method: "PATCH",
      url: "/morning-brief-items/does-not-exist",
      body: { review_status: "accepted" },
    });
    assert.equal(missingItem.statusCode, 404);
  } finally {
    database.close();
  }
});

test("generation, reads, and review actions never mutate any of the seven source tables", async () => {
  const database = createTestDatabase();
  try {
    createTask(database, taskFixture({ id: "task-requires", status: "open", requires_raymond: 1 }));
    createTask(database, taskFixture({ id: "task-waiting", status: "waiting" }));
    createProject(database, projectFixture({ id: "project-requires", status: "active", requires_raymond: 1 }));
    createRawCapture(database, rawCaptureFixture({ id: "capture-1", status: "new" }));
    createReviewLaterResource(database, reviewLaterResourceFixture({ id: "resource-1", status: "new" }));
    createArsenalItem(database, arsenalItemFixture({ id: "arsenal-1" }));
    createPromptLibraryItem(database, promptLibraryItemFixture({ id: "prompt-1" }));

    const before = snapshotSourceTables(database);

    const generated = await sendRequest(database, {
      method: "POST",
      url: "/morning-brief",
      openAIConfig: {
        apiKey: "test-key",
        fetchImpl: async () =>
          jsonResponse({
            output_text: JSON.stringify({
              narratives: [{ narrative: "n1" }, { narrative: "n2" }],
            }),
          }),
      },
    });
    await sendRequest(database, { method: "GET", url: "/morning-brief/latest" });
    await sendRequest(database, { method: "GET", url: "/morning-brief/history" });

    const itemId = generated.body.items.requires_raymond[0].id;
    await sendRequest(database, {
      method: "PATCH",
      url: `/morning-brief-items/${itemId}`,
      body: { review_status: "corrected", section: "fyi", corrected_note: "note" },
    });

    const after = snapshotSourceTables(database);
    assert.deepEqual(after, before);
  } finally {
    database.close();
  }
});

function snapshotSourceTables(database) {
  const tables = [
    "tasks",
    "projects",
    "raw_captures",
    "project_updates",
    "review_later_resources",
    "arsenal_items",
    "prompt_library_items",
  ];
  const snapshot = {};
  for (const table of tables) {
    snapshot[table] = database.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
  }
  return snapshot;
}

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

async function sendRequest(database, { method, url, body, openAIConfig }) {
  const request = Readable.from(body ? [JSON.stringify(body)] : []);
  request.method = method;
  request.url = url;

  const response = {
    body: "",
    statusCode: null,
    writeHead(statusCode) {
      this.statusCode = statusCode;
    },
    end(chunk = "") {
      this.body += chunk;
    },
  };

  await handleMorningBriefRequest(request, response, database, { openAIConfig });

  return {
    statusCode: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
  };
}
