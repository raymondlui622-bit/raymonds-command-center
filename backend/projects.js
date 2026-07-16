import { randomUUID } from "node:crypto";
import { PROJECT_STATUSES } from "./migrations/projects.js";

export { PROJECT_STATUSES };

const projectEditableFields = [
  "name",
  "status",
  "current_phase",
  "priority",
  "source_of_truth",
  "last_completed_step",
  "current_blocker",
  "next_action",
  "waiting_on",
  "requires_raymond",
  "due_date",
  "active_reason",
  "last_reviewed_at",
  "completed_at",
  "archived_at",
];

export function createProject(database, input) {
  const project = normalizeProjectInput(input, {
    id: input?.id ?? randomUUID(),
    status: input?.status ?? "active",
    priority: input?.priority ?? "medium",
    created_at: input?.created_at ?? new Date().toISOString(),
  });

  database
    .prepare(`
      INSERT INTO projects (
        id,
        name,
        status,
        current_phase,
        priority,
        created_at,
        source_of_truth,
        last_completed_step,
        current_blocker,
        next_action,
        waiting_on,
        requires_raymond,
        due_date,
        active_reason,
        last_reviewed_at,
        completed_at,
        archived_at
      )
      VALUES (
        :id,
        :name,
        :status,
        :current_phase,
        :priority,
        :created_at,
        :source_of_truth,
        :last_completed_step,
        :current_blocker,
        :next_action,
        :waiting_on,
        :requires_raymond,
        :due_date,
        :active_reason,
        :last_reviewed_at,
        :completed_at,
        :archived_at
      )
    `)
    .run(project);

  return withCalculatedFields(project);
}

export function getProjectById(database, id) {
  const project = database.prepare("SELECT * FROM projects WHERE id = ?").get(id) ?? null;
  return project ? withCalculatedFields(project) : null;
}

export function listProjects(database) {
  return database
    .prepare(`
      SELECT *
      FROM projects
      ORDER BY created_at DESC, id DESC
    `)
    .all()
    .map(withCalculatedFields);
}

export function updateProject(database, id, input) {
  const existing = getProjectById(database, id);
  if (!existing) {
    return null;
  }

  const changes = {};
  for (const field of projectEditableFields) {
    if (Object.hasOwn(input, field)) {
      changes[field] = input[field];
    }
  }

  if (Object.keys(changes).length === 0) {
    return existing;
  }

  const next = normalizeProjectInput({ ...existing, ...changes }, existing);
  const { created_at, ...updateParams } = next;

  database
    .prepare(`
      UPDATE projects
      SET name = :name,
          status = :status,
          current_phase = :current_phase,
          priority = :priority,
          source_of_truth = :source_of_truth,
          last_completed_step = :last_completed_step,
          current_blocker = :current_blocker,
          next_action = :next_action,
          waiting_on = :waiting_on,
          requires_raymond = :requires_raymond,
          due_date = :due_date,
          active_reason = :active_reason,
          last_reviewed_at = :last_reviewed_at,
          completed_at = :completed_at,
          archived_at = :archived_at
      WHERE id = :id
    `)
    .run(updateParams);

  return getProjectById(database, id);
}

export function archiveProject(database, id, archivedAt = new Date().toISOString()) {
  const existing = getProjectById(database, id);
  if (!existing) {
    return null;
  }

  database
    .prepare(`
      UPDATE projects
      SET status = 'archived',
          archived_at = ?
      WHERE id = ?
    `)
    .run(archivedAt, id);

  return getProjectById(database, id);
}

export function createProjectUpdate(database, projectId, input) {
  if (!getProjectById(database, projectId)) {
    return null;
  }

  const update = normalizeProjectUpdateInput(input, {
    id: input?.id ?? randomUUID(),
    project_id: projectId,
    created_at: input?.created_at ?? new Date().toISOString(),
  });

  database
    .prepare(`
      INSERT INTO project_updates (
        id,
        project_id,
        update_text,
        update_type,
        created_at,
        source,
        decision_recorded,
        next_action,
        evidence_refs
      )
      VALUES (
        :id,
        :project_id,
        :update_text,
        :update_type,
        :created_at,
        :source,
        :decision_recorded,
        :next_action,
        :evidence_refs
      )
    `)
    .run(update);

  return update;
}

export function listProjectUpdates(database, projectId) {
  return database
    .prepare(`
      SELECT *
      FROM project_updates
      WHERE project_id = ?
      ORDER BY created_at DESC, id DESC
    `)
    .all(projectId);
}

function normalizeProjectInput(input, defaults) {
  const name = requireNonEmptyString(input?.name, "name");
  const currentPhase = requireNonEmptyString(input?.current_phase, "current_phase");
  const status = input?.status ?? defaults.status;

  if (!PROJECT_STATUSES.includes(status)) {
    throw new Error(`Invalid project status: ${status}`);
  }

  return {
    id: defaults.id,
    name,
    status,
    current_phase: currentPhase,
    priority: requireNonEmptyString(input?.priority ?? defaults.priority, "priority"),
    created_at: defaults.created_at,
    source_of_truth: nullableString(input?.source_of_truth),
    last_completed_step: nullableString(input?.last_completed_step),
    current_blocker: nullableString(input?.current_blocker),
    next_action: nullableString(input?.next_action),
    waiting_on: nullableString(input?.waiting_on),
    requires_raymond: input?.requires_raymond ? 1 : 0,
    due_date: nullableString(input?.due_date),
    active_reason: nullableString(input?.active_reason),
    last_reviewed_at: nullableString(input?.last_reviewed_at),
    completed_at: nullableString(input?.completed_at),
    archived_at: nullableString(input?.archived_at),
  };
}

function normalizeProjectUpdateInput(input, defaults) {
  return {
    id: defaults.id,
    project_id: defaults.project_id,
    update_text: requireNonEmptyString(input?.update_text, "update_text"),
    update_type: requireNonEmptyString(input?.update_type, "update_type"),
    created_at: defaults.created_at,
    source: nullableString(input?.source),
    decision_recorded: nullableString(input?.decision_recorded),
    next_action: nullableString(input?.next_action),
    evidence_refs: nullableString(input?.evidence_refs),
  };
}

function withCalculatedFields(project) {
  return {
    ...project,
    due_soon: isDueWithinThirtyDays(project.due_date) ? 1 : 0,
  };
}

function isDueWithinThirtyDays(dueDate) {
  if (!dueDate) {
    return false;
  }

  const due = new Date(`${dueDate}T00:00:00.000`);
  if (Number.isNaN(due.getTime())) {
    return false;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysFromToday = new Date(today);
  thirtyDaysFromToday.setDate(today.getDate() + 30);

  return due >= today && due <= thirtyDaysFromToday;
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
