import { randomUUID } from "node:crypto";
import { RAW_CAPTURE_STATUSES } from "./migrations/rawCaptures.js";

export { RAW_CAPTURE_STATUSES };

export function createRawCapture(database, input) {
  const rawText = requireNonEmptyString(input?.raw_text, "raw_text");
  const source = requireNonEmptyString(input?.source, "source");
  const status = input.status ?? "new";

  if (!RAW_CAPTURE_STATUSES.includes(status)) {
    throw new Error(`Invalid raw capture status: ${status}`);
  }

  const capture = {
    id: input.id ?? randomUUID(),
    raw_text: rawText,
    source,
    status,
    captured_at: input.captured_at ?? new Date().toISOString(),
    title: input.title ?? null,
    suggested_type: input.suggested_type ?? null,
    related_project_id: input.related_project_id ?? null,
    why_it_matters: input.why_it_matters ?? null,
    ai_confidence: input.ai_confidence ?? null,
    concise_ai_reason: input.concise_ai_reason ?? null,
    reviewed_at: input.reviewed_at ?? null,
    archived_at: input.archived_at ?? null,
  };

  database
    .prepare(`
      INSERT INTO raw_captures (
        id,
        raw_text,
        source,
        status,
        captured_at,
        title,
        suggested_type,
        related_project_id,
        why_it_matters,
        ai_confidence,
        concise_ai_reason,
        reviewed_at,
        archived_at
      )
      VALUES (
        :id,
        :raw_text,
        :source,
        :status,
        :captured_at,
        :title,
        :suggested_type,
        :related_project_id,
        :why_it_matters,
        :ai_confidence,
        :concise_ai_reason,
        :reviewed_at,
        :archived_at
      )
    `)
    .run(capture);

  return capture;
}

export function getRawCaptureById(database, id) {
  return database
    .prepare("SELECT * FROM raw_captures WHERE id = ?")
    .get(id) ?? null;
}

export function listRawCaptures(database) {
  return database
    .prepare(`
      SELECT *
      FROM raw_captures
      ORDER BY captured_at DESC, id DESC
    `)
    .all();
}

export function archiveRawCapture(database, id, archivedAt = new Date().toISOString()) {
  const existing = getRawCaptureById(database, id);

  if (!existing) {
    return null;
  }

  database
    .prepare(`
      UPDATE raw_captures
      SET status = 'archived',
          archived_at = ?
      WHERE id = ?
    `)
    .run(archivedAt, id);

  return getRawCaptureById(database, id);
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required`);
  }

  return value;
}
