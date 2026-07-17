import { randomUUID } from "node:crypto";
import { TASK_STATUSES } from "./migrations/tasks.js";

export { TASK_STATUSES };

const editableFields = [
  "title",
  "description",
  "status",
  "priority",
  "related_project_id",
  "due_date",
  "waiting_on",
  "follow_up_date",
  "last_contacted_at",
  "requires_raymond",
  "next_action",
  "evidence_refs",
  "source_capture_id",
  "completed_at",
  "archived_at",
];

export function createTask(database, input) {
  const task = normalizeTaskInput(input, {
    id: input?.id ?? randomUUID(),
    status: input?.status ?? "open",
    priority: input?.priority ?? "medium",
    created_at: input?.created_at ?? new Date().toISOString(),
  });

  database
    .prepare(`
      INSERT INTO tasks (
        id,
        title,
        status,
        priority,
        created_at,
        description,
        related_project_id,
        due_date,
        waiting_on,
        follow_up_date,
        last_contacted_at,
        requires_raymond,
        next_action,
        evidence_refs,
        source_capture_id,
        completed_at,
        archived_at
      )
      VALUES (
        :id,
        :title,
        :status,
        :priority,
        :created_at,
        :description,
        :related_project_id,
        :due_date,
        :waiting_on,
        :follow_up_date,
        :last_contacted_at,
        :requires_raymond,
        :next_action,
        :evidence_refs,
        :source_capture_id,
        :completed_at,
        :archived_at
      )
    `)
    .run(task);

  return task;
}

export function getTaskById(database, id) {
  return database.prepare("SELECT * FROM tasks WHERE id = ?").get(id) ?? null;
}

export function listTasks(database) {
  return database
    .prepare(`
      SELECT *
      FROM tasks
      ORDER BY created_at DESC, id DESC
    `)
    .all();
}

export function listTasksForProject(database, projectId, statuses) {
  const placeholders = statuses.map(() => "?").join(",");
  return database
    .prepare(`
      SELECT *
      FROM tasks
      WHERE related_project_id = ? AND status IN (${placeholders})
      ORDER BY created_at DESC, id DESC
    `)
    .all(projectId, ...statuses);
}

export function updateTask(database, id, input) {
  const existing = getTaskById(database, id);
  if (!existing) {
    return null;
  }

  const changes = {};
  for (const field of editableFields) {
    if (Object.hasOwn(input, field)) {
      changes[field] = input[field];
    }
  }

  if (Object.keys(changes).length === 0) {
    return existing;
  }

  const next = normalizeTaskInput({ ...existing, ...changes }, existing);
  const { created_at, ...updateParams } = next;
  database
    .prepare(`
      UPDATE tasks
      SET title = :title,
          status = :status,
          priority = :priority,
          description = :description,
          related_project_id = :related_project_id,
          due_date = :due_date,
          waiting_on = :waiting_on,
          follow_up_date = :follow_up_date,
          last_contacted_at = :last_contacted_at,
          requires_raymond = :requires_raymond,
          next_action = :next_action,
          evidence_refs = :evidence_refs,
          source_capture_id = :source_capture_id,
          completed_at = :completed_at,
          archived_at = :archived_at
      WHERE id = :id
    `)
    .run(updateParams);

  return getTaskById(database, id);
}

export function completeTask(database, id, completedAt = new Date().toISOString()) {
  const existing = getTaskById(database, id);
  if (!existing) {
    return null;
  }

  database
    .prepare(`
      UPDATE tasks
      SET status = 'done',
          completed_at = ?
      WHERE id = ?
    `)
    .run(completedAt, id);

  return getTaskById(database, id);
}

export function archiveTask(database, id, archivedAt = new Date().toISOString()) {
  const existing = getTaskById(database, id);
  if (!existing) {
    return null;
  }

  database
    .prepare(`
      UPDATE tasks
      SET status = 'archived',
          archived_at = ?
      WHERE id = ?
    `)
    .run(archivedAt, id);

  return getTaskById(database, id);
}

function normalizeTaskInput(input, defaults) {
  const title = requireNonEmptyString(input?.title, "title");
  const status = input?.status ?? defaults.status;

  if (!TASK_STATUSES.includes(status)) {
    throw new Error(`Invalid task status: ${status}`);
  }

  return {
    id: defaults.id,
    title,
    status,
    priority: requireNonEmptyString(input?.priority ?? defaults.priority, "priority"),
    created_at: defaults.created_at,
    description: nullableString(input?.description),
    related_project_id: nullableString(input?.related_project_id),
    due_date: nullableString(input?.due_date),
    waiting_on: nullableString(input?.waiting_on),
    follow_up_date: nullableString(input?.follow_up_date),
    last_contacted_at: nullableString(input?.last_contacted_at),
    requires_raymond: input?.requires_raymond ? 1 : 0,
    next_action: nullableString(input?.next_action),
    evidence_refs: nullableString(input?.evidence_refs),
    source_capture_id: nullableString(input?.source_capture_id),
    completed_at: nullableString(input?.completed_at),
    archived_at: nullableString(input?.archived_at),
  };
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required`);
  }

  return value;
}

function nullableString(value) {
  return typeof value === "string" && value !== "" ? value : null;
}
