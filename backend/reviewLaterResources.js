import { randomUUID } from "node:crypto";
import { REVIEW_LATER_RESOURCE_STATUSES } from "./migrations/reviewLaterResources.js";

export { REVIEW_LATER_RESOURCE_STATUSES };

const editableFields = [
  "title",
  "resource_type",
  "why_it_matters",
  "status",
  "url_or_location",
  "related_project_id",
  "possible_use",
  "notes",
  "tags",
  "source_capture_id",
  "reviewed_at",
  "archived_at",
];

export function createReviewLaterResource(database, input) {
  const resource = normalizeResourceInput(input, {
    id: input?.id ?? randomUUID(),
    status: input?.status ?? "new",
    saved_at: input?.saved_at ?? new Date().toISOString(),
  });

  database
    .prepare(`
      INSERT INTO review_later_resources (
        id,
        title,
        resource_type,
        why_it_matters,
        status,
        saved_at,
        url_or_location,
        related_project_id,
        possible_use,
        notes,
        tags,
        source_capture_id,
        reviewed_at,
        archived_at
      )
      VALUES (
        :id,
        :title,
        :resource_type,
        :why_it_matters,
        :status,
        :saved_at,
        :url_or_location,
        :related_project_id,
        :possible_use,
        :notes,
        :tags,
        :source_capture_id,
        :reviewed_at,
        :archived_at
      )
    `)
    .run(resource);

  return resource;
}

export function getReviewLaterResourceById(database, id) {
  return database.prepare("SELECT * FROM review_later_resources WHERE id = ?").get(id) ?? null;
}

export function listReviewLaterResources(database) {
  return database
    .prepare(`
      SELECT *
      FROM review_later_resources
      ORDER BY saved_at DESC, id DESC
    `)
    .all();
}

export function updateReviewLaterResource(database, id, input) {
  const existing = getReviewLaterResourceById(database, id);
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

  const next = normalizeResourceInput({ ...existing, ...changes }, existing);
  const { saved_at, ...updateParams } = next;

  database
    .prepare(`
      UPDATE review_later_resources
      SET title = :title,
          resource_type = :resource_type,
          why_it_matters = :why_it_matters,
          status = :status,
          url_or_location = :url_or_location,
          related_project_id = :related_project_id,
          possible_use = :possible_use,
          notes = :notes,
          tags = :tags,
          source_capture_id = :source_capture_id,
          reviewed_at = :reviewed_at,
          archived_at = :archived_at
      WHERE id = :id
    `)
    .run(updateParams);

  return getReviewLaterResourceById(database, id);
}

export function archiveReviewLaterResource(
  database,
  id,
  archivedAt = new Date().toISOString(),
) {
  const existing = getReviewLaterResourceById(database, id);
  if (!existing) {
    return null;
  }

  database
    .prepare(`
      UPDATE review_later_resources
      SET status = 'archived',
          archived_at = ?
      WHERE id = ?
    `)
    .run(archivedAt, id);

  return getReviewLaterResourceById(database, id);
}

function normalizeResourceInput(input, defaults) {
  const title = requireNonEmptyString(input?.title, "title");
  const resourceType = requireNonEmptyString(input?.resource_type, "resource_type");
  const whyItMatters = requireNonEmptyString(input?.why_it_matters, "why_it_matters");
  const status = input?.status ?? defaults.status;

  if (!REVIEW_LATER_RESOURCE_STATUSES.includes(status)) {
    throw new Error(`Invalid review later resource status: ${status}`);
  }

  return {
    id: defaults.id,
    title,
    resource_type: resourceType,
    why_it_matters: whyItMatters,
    status,
    saved_at: defaults.saved_at,
    url_or_location: nullableString(input?.url_or_location),
    related_project_id: nullableString(input?.related_project_id),
    possible_use: nullableString(input?.possible_use),
    notes: nullableString(input?.notes),
    tags: nullableString(input?.tags),
    source_capture_id: nullableString(input?.source_capture_id),
    reviewed_at: nullableString(input?.reviewed_at),
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
