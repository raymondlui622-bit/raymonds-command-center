import { randomUUID } from "node:crypto";
import { ARSENAL_ITEM_STATUSES } from "./migrations/arsenalItems.js";

export { ARSENAL_ITEM_STATUSES };

const editableFields = [
  "name",
  "category",
  "description",
  "url",
  "tags",
  "notes",
  "status",
  "updated_at",
];

export function createArsenalItem(database, input) {
  const item = normalizeArsenalItemInput(input, {
    id: input?.id ?? randomUUID(),
    status: input?.status ?? "active",
    created_at: input?.created_at ?? new Date().toISOString(),
    updated_at: input?.updated_at ?? new Date().toISOString(),
  });

  database
    .prepare(`
      INSERT INTO arsenal_items (
        id,
        name,
        category,
        description,
        url,
        tags,
        notes,
        status,
        created_at,
        updated_at
      )
      VALUES (
        :id,
        :name,
        :category,
        :description,
        :url,
        :tags,
        :notes,
        :status,
        :created_at,
        :updated_at
      )
    `)
    .run(item);

  return item;
}

export function getArsenalItemById(database, id) {
  return database.prepare("SELECT * FROM arsenal_items WHERE id = ?").get(id) ?? null;
}

export function listArsenalItems(database) {
  return database
    .prepare(`
      SELECT *
      FROM arsenal_items
      ORDER BY created_at DESC, id DESC
    `)
    .all();
}

export function updateArsenalItem(database, id, input) {
  const existing = getArsenalItemById(database, id);
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

  const next = normalizeArsenalItemInput(
    {
      ...existing,
      ...changes,
      updated_at: changes.updated_at ?? new Date().toISOString(),
    },
    existing,
  );
  const { created_at, ...updateParams } = next;

  database
    .prepare(`
      UPDATE arsenal_items
      SET name = :name,
          category = :category,
          description = :description,
          url = :url,
          tags = :tags,
          notes = :notes,
          status = :status,
          updated_at = :updated_at
      WHERE id = :id
    `)
    .run(updateParams);

  return getArsenalItemById(database, id);
}

export function archiveArsenalItem(
  database,
  id,
  updatedAt = new Date().toISOString(),
) {
  return updateArsenalItem(database, id, {
    status: "archived",
    updated_at: updatedAt,
  });
}

function normalizeArsenalItemInput(input, defaults) {
  const status = input?.status ?? defaults.status;

  if (!ARSENAL_ITEM_STATUSES.includes(status)) {
    throw new Error(`Invalid arsenal item status: ${status}`);
  }

  return {
    id: defaults.id,
    name: requireNonEmptyString(input?.name, "name"),
    category: nullableString(input?.category),
    description: nullableString(input?.description),
    url: nullableString(input?.url),
    tags: nullableString(input?.tags),
    notes: nullableString(input?.notes),
    status,
    created_at: defaults.created_at,
    updated_at: input?.updated_at ?? defaults.updated_at,
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
