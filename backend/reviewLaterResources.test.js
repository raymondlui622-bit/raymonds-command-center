import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import {
  REVIEW_LATER_RESOURCE_STATUSES,
  archiveReviewLaterResource,
  createReviewLaterResource,
  getReviewLaterResourceById,
  listReviewLaterResources,
  updateReviewLaterResource,
} from "./reviewLaterResources.js";
import { reviewLaterResourceFixture } from "./reviewLaterResources.fixture.js";

test("creates and reads a review later resource", () => {
  const database = createTestDatabase();
  try {
    const created = createReviewLaterResource(database, reviewLaterResourceFixture());
    const stored = getReviewLaterResourceById(database, created.id);

    assert.equal(stored.id, created.id);
    assert.equal(stored.title, "Useful GitHub repository");
    assert.equal(stored.resource_type, "github_repository");
    assert.equal(stored.url_or_location, "https://github.com/example/repo");
    assert.equal(stored.why_it_matters, "Potential reference for local-first architecture choices");
    assert.equal(stored.status, "new");
  } finally {
    database.close();
  }
});

test("review later statuses match the approved model", () => {
  assert.deepEqual(REVIEW_LATER_RESOURCE_STATUSES, [
    "new",
    "reviewing",
    "useful",
    "turned_into_task",
    "reference",
    "dismissed",
    "archived",
  ]);

  const database = createTestDatabase();
  try {
    assert.throws(
      () =>
        createReviewLaterResource(
          database,
          reviewLaterResourceFixture({ id: "bad-status", status: "open" }),
        ),
      /Invalid review later resource status/,
    );
  } finally {
    database.close();
  }
});

test("updates a review later resource including one primary project link", () => {
  const database = createTestDatabase();
  try {
    const created = createReviewLaterResource(database, reviewLaterResourceFixture());
    const updated = updateReviewLaterResource(database, created.id, {
      status: "useful",
      related_project_id: "future-project-id",
      possible_use: "Use as a reference once Projects exist",
      notes: "Strong match for the approved local-first architecture.",
    });

    assert.equal(updated.status, "useful");
    assert.equal(updated.related_project_id, "future-project-id");
    assert.equal(updated.possible_use, "Use as a reference once Projects exist");
    assert.equal(updated.notes, "Strong match for the approved local-first architecture.");
  } finally {
    database.close();
  }
});

test("archives review later resources while keeping them retrievable", () => {
  const database = createTestDatabase();
  try {
    const created = createReviewLaterResource(database, reviewLaterResourceFixture());
    const archived = archiveReviewLaterResource(database, created.id, "2026-07-16T15:00:00.000Z");
    const stored = getReviewLaterResourceById(database, created.id);

    assert.equal(archived.status, "archived");
    assert.equal(archived.archived_at, "2026-07-16T15:00:00.000Z");
    assert.equal(stored.status, "archived");
    assert.equal(listReviewLaterResources(database).some((resource) => resource.id === created.id), true);
  } finally {
    database.close();
  }
});

test("database initialization creates only approved milestone tables", () => {
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

    assert.deepEqual(tables, ["raw_captures", "review_later_resources", "tasks"]);
  } finally {
    database.close();
  }
});

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}
