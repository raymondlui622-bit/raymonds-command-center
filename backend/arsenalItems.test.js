import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import {
  ARSENAL_ITEM_STATUSES,
  archiveArsenalItem,
  createArsenalItem,
  getArsenalItemById,
  listArsenalItems,
  updateArsenalItem,
} from "./arsenalItems.js";
import { arsenalItemFixture } from "./arsenalItems.fixture.js";

test("creates and reads an arsenal item with approved fields", () => {
  const database = createTestDatabase();
  try {
    const created = createArsenalItem(database, arsenalItemFixture());
    const stored = getArsenalItemById(database, created.id);

    assert.equal(stored.id, "arsenal-test-1");
    assert.equal(stored.name, "Prompt Master");
    assert.equal(stored.category, "skill");
    assert.equal(stored.description, "Improves reusable prompts");
    assert.equal(stored.url, "https://example.com/prompt-master");
    assert.equal(stored.tags, "prompt,skill");
    assert.equal(stored.notes, "Use for reusable prompt cleanup");
    assert.equal(stored.status, "active");
    assert.equal(stored.created_at, "2026-07-17T12:00:00.000Z");
    assert.equal(stored.updated_at, "2026-07-17T12:00:00.000Z");
  } finally {
    database.close();
  }
});

test("updates and archives an arsenal item while keeping it retrievable", () => {
  const database = createTestDatabase();
  try {
    const created = createArsenalItem(database, arsenalItemFixture());
    const updated = updateArsenalItem(database, created.id, {
      name: "Prompt Master Skill",
      category: "workflow",
      updated_at: "2026-07-17T13:00:00.000Z",
    });
    const archived = archiveArsenalItem(
      database,
      created.id,
      "2026-07-17T14:00:00.000Z",
    );
    const stored = getArsenalItemById(database, created.id);

    assert.equal(updated.name, "Prompt Master Skill");
    assert.equal(updated.category, "workflow");
    assert.equal(updated.updated_at, "2026-07-17T13:00:00.000Z");
    assert.equal(archived.status, "archived");
    assert.equal(archived.updated_at, "2026-07-17T14:00:00.000Z");
    assert.equal(stored.status, "archived");
    assert.equal(listArsenalItems(database).some((item) => item.id === created.id), true);
  } finally {
    database.close();
  }
});

test("arsenal statuses match the approved milestone 9 model", () => {
  assert.deepEqual(ARSENAL_ITEM_STATUSES, ["active", "archived"]);

  const database = createTestDatabase();
  try {
    assert.throws(
      () => createArsenalItem(database, arsenalItemFixture({ id: "bad-status", status: "available" })),
      /Invalid arsenal item status/,
    );
  } finally {
    database.close();
  }
});

test("database initialization creates the arsenal table with approved columns", () => {
  const database = createTestDatabase();
  try {
    const columns = database
      .prepare("PRAGMA table_info(arsenal_items)")
      .all()
      .map((column) => column.name);

    assert.deepEqual(columns, [
      "id",
      "name",
      "category",
      "description",
      "url",
      "tags",
      "notes",
      "status",
      "created_at",
      "updated_at",
    ]);
  } finally {
    database.close();
  }
});

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}
