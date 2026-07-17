import { randomUUID } from "node:crypto";
import { PROMPT_LIBRARY_ITEM_STATUSES } from "./migrations/promptLibraryItems.js";

export { PROMPT_LIBRARY_ITEM_STATUSES };

const editableFields = [
  "title",
  "category",
  "description",
  "full_prompt",
  "tags",
  "is_favorite",
  "status",
  "updated_at",
];

export function createPromptLibraryItem(database, input) {
  const item = normalizePromptLibraryItemInput(input, {
    id: input?.id ?? randomUUID(),
    status: input?.status ?? "active",
    created_at: input?.created_at ?? new Date().toISOString(),
    updated_at: input?.updated_at ?? new Date().toISOString(),
  });

  database
    .prepare(`
      INSERT INTO prompt_library_items (
        id,
        title,
        category,
        description,
        full_prompt,
        tags,
        is_favorite,
        status,
        created_at,
        updated_at
      )
      VALUES (
        :id,
        :title,
        :category,
        :description,
        :full_prompt,
        :tags,
        :is_favorite,
        :status,
        :created_at,
        :updated_at
      )
    `)
    .run(item);

  return item;
}

export function getPromptLibraryItemById(database, id) {
  return database.prepare("SELECT * FROM prompt_library_items WHERE id = ?").get(id) ?? null;
}

export function listPromptLibraryItems(database) {
  return database
    .prepare(`
      SELECT *
      FROM prompt_library_items
      ORDER BY created_at DESC, id DESC
    `)
    .all();
}

export function updatePromptLibraryItem(database, id, input) {
  const existing = getPromptLibraryItemById(database, id);
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

  const next = normalizePromptLibraryItemInput(
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
      UPDATE prompt_library_items
      SET title = :title,
          category = :category,
          description = :description,
          full_prompt = :full_prompt,
          tags = :tags,
          is_favorite = :is_favorite,
          status = :status,
          updated_at = :updated_at
      WHERE id = :id
    `)
    .run(updateParams);

  return getPromptLibraryItemById(database, id);
}

export function archivePromptLibraryItem(
  database,
  id,
  updatedAt = new Date().toISOString(),
) {
  return updatePromptLibraryItem(database, id, {
    status: "archived",
    updated_at: updatedAt,
  });
}

export function setPromptLibraryItemFavorite(
  database,
  id,
  isFavorite,
  updatedAt = new Date().toISOString(),
) {
  return updatePromptLibraryItem(database, id, {
    is_favorite: isFavorite ? 1 : 0,
    updated_at: updatedAt,
  });
}

function normalizePromptLibraryItemInput(input, defaults) {
  const status = input?.status ?? defaults.status;

  if (!PROMPT_LIBRARY_ITEM_STATUSES.includes(status)) {
    throw new Error(`Invalid prompt library item status: ${status}`);
  }

  return {
    id: defaults.id,
    title: requireNonEmptyString(input?.title, "title"),
    category: nullableString(input?.category),
    description: nullableString(input?.description),
    full_prompt: requireNonEmptyString(input?.full_prompt, "full_prompt"),
    tags: nullableString(input?.tags),
    is_favorite: input?.is_favorite ? 1 : 0,
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
