const searchableModules = Object.freeze([
  "raw_capture",
  "task",
  "review_later_resource",
  "project",
  "project_update",
  "arsenal_item",
  "prompt_library_item",
]);

export function searchRecords(database, filters = {}) {
  const query = normalizeFilter(filters.q);
  const status = normalizeFilter(filters.status);
  const relatedProjectId = normalizeFilter(filters.related_project_id);
  const recordType = normalizeFilter(filters.record_type);

  const results = [];
  if (!recordType || recordType === "raw_capture") {
    results.push(...searchRawCaptures(database, { query, status, relatedProjectId }));
  }
  if (!recordType || recordType === "task") {
    results.push(...searchTasks(database, { query, status, relatedProjectId }));
  }
  if (!recordType || recordType === "review_later_resource") {
    results.push(...searchReviewLaterResources(database, { query, status, relatedProjectId }));
  }
  if (!recordType || recordType === "project") {
    results.push(...searchProjects(database, { query, status, relatedProjectId }));
  }
  if (!recordType || recordType === "project_update") {
    results.push(...searchProjectUpdates(database, { query, status, relatedProjectId }));
  }
  if (!recordType || recordType === "arsenal_item") {
    results.push(...searchArsenalItems(database, { query, status, relatedProjectId }));
  }
  if (!recordType || recordType === "prompt_library_item") {
    results.push(...searchPromptLibraryItems(database, { query, status, relatedProjectId }));
  }

  return results.sort((first, second) => second.sort_date.localeCompare(first.sort_date));
}

function searchRawCaptures(database, filters) {
  const where = [];
  const params = {};

  addKeywordFilter(where, params, filters.query, [
    "raw_text",
    "source",
    "title",
    "suggested_type",
    "why_it_matters",
  ]);
  addExactFilter(where, params, "status", filters.status, "status");
  addExactFilter(where, params, "related_project_id", filters.relatedProjectId, "related_project_id");

  return database
    .prepare(`
      SELECT
        'raw_capture' AS record_type,
        id,
        raw_text AS title,
        raw_text AS summary,
        status,
        related_project_id,
        captured_at AS sort_date
      FROM raw_captures
      ${whereClause(where)}
      ORDER BY captured_at DESC, id DESC
    `)
    .all(params);
}

function searchTasks(database, filters) {
  const where = [];
  const params = {};

  addKeywordFilter(where, params, filters.query, [
    "title",
    "description",
    "priority",
    "waiting_on",
    "next_action",
    "evidence_refs",
  ]);
  addExactFilter(where, params, "status", filters.status, "status");
  addExactFilter(where, params, "related_project_id", filters.relatedProjectId, "related_project_id");

  return database
    .prepare(`
      SELECT
        'task' AS record_type,
        id,
        title,
        COALESCE(description, next_action, '') AS summary,
        status,
        related_project_id,
        created_at AS sort_date
      FROM tasks
      ${whereClause(where)}
      ORDER BY created_at DESC, id DESC
    `)
    .all(params);
}

function searchReviewLaterResources(database, filters) {
  const where = [];
  const params = {};

  addKeywordFilter(where, params, filters.query, [
    "title",
    "resource_type",
    "why_it_matters",
    "url_or_location",
    "possible_use",
    "notes",
    "tags",
  ]);
  addExactFilter(where, params, "status", filters.status, "status");
  addExactFilter(where, params, "related_project_id", filters.relatedProjectId, "related_project_id");

  return database
    .prepare(`
      SELECT
        'review_later_resource' AS record_type,
        id,
        title,
        COALESCE(url_or_location, why_it_matters, '') AS summary,
        status,
        related_project_id,
        saved_at AS sort_date
      FROM review_later_resources
      ${whereClause(where)}
      ORDER BY saved_at DESC, id DESC
    `)
    .all(params);
}

function searchProjects(database, filters) {
  const where = [];
  const params = {};

  addKeywordFilter(where, params, filters.query, [
    "name",
    "current_phase",
    "priority",
    "source_of_truth",
    "last_completed_step",
    "current_blocker",
    "next_action",
    "waiting_on",
    "active_reason",
  ]);
  addExactFilter(where, params, "status", filters.status, "status");
  addExactFilter(where, params, "id", filters.relatedProjectId, "related_project_id");

  return database
    .prepare(`
      SELECT
        'project' AS record_type,
        id,
        name AS title,
        COALESCE(current_blocker, next_action, active_reason, '') AS summary,
        status,
        id AS related_project_id,
        created_at AS sort_date
      FROM projects
      ${whereClause(where)}
      ORDER BY created_at DESC, id DESC
    `)
    .all(params);
}

function searchProjectUpdates(database, filters) {
  if (filters.status) {
    return [];
  }

  const where = [];
  const params = {};

  addKeywordFilter(where, params, filters.query, [
    "update_text",
    "update_type",
    "source",
    "decision_recorded",
    "next_action",
    "evidence_refs",
  ]);
  addExactFilter(where, params, "project_id", filters.relatedProjectId, "related_project_id");

  return database
    .prepare(`
      SELECT
        'project_update' AS record_type,
        id,
        update_text AS title,
        COALESCE(next_action, decision_recorded, '') AS summary,
        NULL AS status,
        project_id AS related_project_id,
        created_at AS sort_date
      FROM project_updates
      ${whereClause(where)}
      ORDER BY created_at DESC, id DESC
    `)
    .all(params);
}

function searchArsenalItems(database, filters) {
  if (filters.relatedProjectId) {
    return [];
  }

  const where = [];
  const params = {};

  addKeywordFilter(where, params, filters.query, [
    "name",
    "category",
    "description",
    "url",
    "tags",
    "notes",
  ]);
  addExactFilter(where, params, "status", filters.status, "status");

  return database
    .prepare(`
      SELECT
        'arsenal_item' AS record_type,
        id,
        name AS title,
        COALESCE(description, url, notes, '') AS summary,
        status,
        NULL AS related_project_id,
        created_at AS sort_date
      FROM arsenal_items
      ${whereClause(where)}
      ORDER BY created_at DESC, id DESC
    `)
    .all(params);
}

function searchPromptLibraryItems(database, filters) {
  if (filters.relatedProjectId) {
    return [];
  }

  const where = [];
  const params = {};

  addKeywordFilter(where, params, filters.query, [
    "title",
    "category",
    "description",
    "full_prompt",
    "tags",
  ]);
  addExactFilter(where, params, "status", filters.status, "status");

  return database
    .prepare(`
      SELECT
        'prompt_library_item' AS record_type,
        id,
        title,
        COALESCE(description, full_prompt, '') AS summary,
        status,
        NULL AS related_project_id,
        created_at AS sort_date
      FROM prompt_library_items
      ${whereClause(where)}
      ORDER BY created_at DESC, id DESC
    `)
    .all(params);
}

function addKeywordFilter(where, params, query, columns) {
  if (!query) {
    return;
  }

  params.query = `%${query.toLowerCase()}%`;
  where.push(
    `(${columns.map((column) => `lower(COALESCE(${column}, '')) LIKE :query`).join(" OR ")})`,
  );
}

function addExactFilter(where, params, column, value, paramName) {
  if (!value) {
    return;
  }

  params[paramName] = value;
  where.push(`${column} = :${paramName}`);
}

function whereClause(where) {
  return where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
}

function normalizeFilter(value) {
  return typeof value === "string" && value !== "" ? value : null;
}

export function isSearchableModule(recordType) {
  return searchableModules.includes(recordType);
}
