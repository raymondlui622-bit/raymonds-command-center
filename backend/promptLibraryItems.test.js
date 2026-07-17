import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import {
  PROMPT_LIBRARY_ITEM_STATUSES,
  archivePromptLibraryItem,
  createPromptLibraryItem,
  getPromptLibraryItemById,
  listPromptLibraryItems,
  setPromptLibraryItemFavorite,
  updatePromptLibraryItem,
} from "./promptLibraryItems.js";
import { promptLibraryItemFixture } from "./promptLibraryItems.fixture.js";

test("creates and reads a prompt library item with approved fields", () => {
  const database = createTestDatabase();
  try {
    const created = createPromptLibraryItem(database, promptLibraryItemFixture());
    const stored = getPromptLibraryItemById(database, created.id);

    assert.equal(stored.id, "prompt-test-1");
    assert.equal(stored.title, "Get Back on Track");
    assert.equal(stored.category, "project");
    assert.equal(stored.description, "Summarizes the current state of a project");
    assert.equal(stored.full_prompt, "Summarize this project and identify the next action.");
    assert.equal(stored.tags, "project,summary");
    assert.equal(stored.is_favorite, 0);
    assert.equal(stored.status, "active");
    assert.equal(stored.created_at, "2026-07-17T12:00:00.000Z");
    assert.equal(stored.updated_at, "2026-07-17T12:00:00.000Z");
  } finally {
    database.close();
  }
});

test("updates, favorites, unfavorites, and archives a prompt while keeping it retrievable", () => {
  const database = createTestDatabase();
  try {
    const created = createPromptLibraryItem(database, promptLibraryItemFixture());
    const updated = updatePromptLibraryItem(database, created.id, {
      title: "Project Restart Prompt",
      updated_at: "2026-07-17T13:00:00.000Z",
    });
    const favorited = setPromptLibraryItemFavorite(
      database,
      created.id,
      true,
      "2026-07-17T14:00:00.000Z",
    );
    const unfavorited = setPromptLibraryItemFavorite(
      database,
      created.id,
      false,
      "2026-07-17T15:00:00.000Z",
    );
    const archived = archivePromptLibraryItem(
      database,
      created.id,
      "2026-07-17T16:00:00.000Z",
    );
    const stored = getPromptLibraryItemById(database, created.id);

    assert.equal(updated.title, "Project Restart Prompt");
    assert.equal(favorited.is_favorite, 1);
    assert.equal(favorited.status, "active");
    assert.equal(unfavorited.is_favorite, 0);
    assert.equal(archived.status, "archived");
    assert.equal(stored.status, "archived");
    assert.equal(listPromptLibraryItems(database).some((prompt) => prompt.id === created.id), true);
  } finally {
    database.close();
  }
});

test("prompt statuses and favorite storage match the approved milestone 9 model", () => {
  assert.deepEqual(PROMPT_LIBRARY_ITEM_STATUSES, ["active", "archived"]);

  const database = createTestDatabase();
  try {
    assert.throws(
      () =>
        createPromptLibraryItem(
          database,
          promptLibraryItemFixture({ id: "bad-status", status: "experimental" }),
        ),
      /Invalid prompt library item status/,
    );
  } finally {
    database.close();
  }
});

test("database initialization creates the prompt table with approved columns", () => {
  const database = createTestDatabase();
  try {
    const columns = database
      .prepare("PRAGMA table_info(prompt_library_items)")
      .all()
      .map((column) => column.name);

    assert.deepEqual(columns, [
      "id",
      "title",
      "category",
      "description",
      "full_prompt",
      "tags",
      "is_favorite",
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
