import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import {
  RAW_CAPTURE_STATUSES,
  archiveRawCapture,
  createRawCapture,
  getRawCaptureById,
  listRawCaptures,
} from "./rawCaptures.js";
import { rawCaptureFixture } from "./rawCaptures.fixture.js";

const futureModuleTables = [
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

test("archives a raw capture while keeping it retrievable", () => {
  const database = createTestDatabase();
  try {
    const created = createRawCapture(database, rawCaptureFixture());
    const archived = archiveRawCapture(
      database,
      created.id,
      "2026-07-16T11:00:00.000Z",
    );
    const stored = getRawCaptureById(database, created.id);
    const listed = listRawCaptures(database);

    assert.equal(archived.status, "archived");
    assert.equal(archived.archived_at, "2026-07-16T11:00:00.000Z");
    assert.equal(stored.raw_text, created.raw_text);
    assert.equal(listed.some((capture) => capture.id === created.id), true);
  } finally {
    database.close();
  }
});

test("database initialization creates only approved module tables through milestone 5", () => {
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
    assert.ok(tables.includes("tasks"));
    assert.ok(tables.includes("review_later_resources"));
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
