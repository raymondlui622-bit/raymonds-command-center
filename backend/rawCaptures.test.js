import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import {
  RAW_CAPTURE_STATUSES,
  createRawCapture,
  getRawCaptureById,
} from "./rawCaptures.js";
import { rawCaptureFixture } from "./rawCaptures.fixture.js";

const futureModuleTables = [
  "tasks",
  "review_later_resources",
  "projects",
  "project_updates",
  "arsenal_items",
  "prompt_library_items",
  "morning_brief_items",
  "classification_corrections",
  "follow_ups",
];

test("creates and reads a raw capture while preserving original raw text", () => {
  const database = createTestDatabase();
  try {
    const input = rawCaptureFixture();
    const created = createRawCapture(database, input);
    const stored = getRawCaptureById(database, created.id);

    assert.equal(stored.id, created.id);
    assert.equal(stored.source, created.source);
    assert.equal(stored.status, created.status);
    assert.equal(stored.captured_at, created.captured_at);
    assert.equal(
      stored.raw_text,
      "Follow up with electrician about Cory exterior lighting",
    );
  } finally {
    database.close();
  }
});

test("raw capture statuses match the approved model", () => {
  assert.deepEqual(RAW_CAPTURE_STATUSES, [
    "new",
    "proposed",
    "processed",
    "archived",
  ]);

  const database = createTestDatabase();
  try {
    assert.throws(
      () =>
        createRawCapture(
          database,
          rawCaptureFixture({ id: "bad-status", status: "done" }),
        ),
      /Invalid raw capture status/,
    );
  } finally {
    database.close();
  }
});

test("database initialization creates no future module tables", () => {
  const database = createTestDatabase();
  try {
    const tables = database
      .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
      `)
      .all()
      .map((row) => row.name);

    assert.ok(tables.includes("raw_captures"));
    for (const tableName of futureModuleTables) {
      assert.equal(tables.includes(tableName), false);
    }
  } finally {
    database.close();
  }
});

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}
