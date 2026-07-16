import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "./db.js";
import {
  TASK_STATUSES,
  archiveTask,
  completeTask,
  createTask,
  getTaskById,
  listTasks,
  updateTask,
} from "./tasks.js";
import { taskFixture } from "./tasks.fixture.js";

test("creates and reads an open task", () => {
  const database = createTestDatabase();
  try {
    const created = createTask(database, taskFixture());
    const stored = getTaskById(database, created.id);

    assert.equal(stored.id, created.id);
    assert.equal(stored.title, "Confirm electrician visit");
    assert.equal(stored.status, "open");
    assert.equal(stored.priority, "medium");
  } finally {
    database.close();
  }
});

test("creates a waiting task with approved waiting fields", () => {
  const database = createTestDatabase();
  try {
    const created = createTask(
      database,
      taskFixture({
        id: "waiting-task",
        status: "waiting",
        waiting_on: "Electrician",
        follow_up_date: "2026-07-18",
        last_contacted_at: "2026-07-16",
        next_action: "Follow up if visit is not confirmed",
      }),
    );

    assert.equal(created.status, "waiting");
    assert.equal(created.waiting_on, "Electrician");
    assert.equal(created.follow_up_date, "2026-07-18");
    assert.equal(created.last_contacted_at, "2026-07-16");
    assert.equal(created.next_action, "Follow up if visit is not confirmed");
  } finally {
    database.close();
  }
});

test("updates, completes, and archives a task while keeping it retrievable", () => {
  const database = createTestDatabase();
  try {
    const created = createTask(database, taskFixture());
    const updated = updateTask(database, created.id, {
      title: "Confirm electrician visit window",
      priority: "high",
      status: "in_progress",
    });
    const completed = completeTask(database, created.id, "2026-07-16T13:00:00.000Z");
    const archived = archiveTask(database, created.id, "2026-07-16T14:00:00.000Z");
    const stored = getTaskById(database, created.id);

    assert.equal(updated.title, "Confirm electrician visit window");
    assert.equal(updated.priority, "high");
    assert.equal(completed.status, "done");
    assert.equal(completed.completed_at, "2026-07-16T13:00:00.000Z");
    assert.equal(archived.status, "archived");
    assert.equal(archived.archived_at, "2026-07-16T14:00:00.000Z");
    assert.equal(stored.title, "Confirm electrician visit window");
  } finally {
    database.close();
  }
});

test("task statuses match the approved model", () => {
  assert.deepEqual(TASK_STATUSES, [
    "open",
    "in_progress",
    "waiting",
    "blocked",
    "done",
    "archived",
  ]);

  const database = createTestDatabase();
  try {
    assert.throws(
      () => createTask(database, taskFixture({ id: "bad-status", status: "new" })),
      /Invalid task status/,
    );
  } finally {
    database.close();
  }
});

test("database initialization creates tasks but no separate follow-up table", () => {
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
    assert.equal(tables.includes("follow_ups"), false);
  } finally {
    database.close();
  }
});

test("lists archived tasks so archived records remain retrievable", () => {
  const database = createTestDatabase();
  try {
    const created = createTask(database, taskFixture());
    archiveTask(database, created.id, "2026-07-16T14:00:00.000Z");

    assert.equal(listTasks(database).some((task) => task.id === created.id), true);
  } finally {
    database.close();
  }
});

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  return database;
}
