import { randomUUID } from "node:crypto";

const sectionKeys = ["requires_raymond", "needs_verification", "waiting_on_others", "fyi"];

export function insertMorningBriefBatch(database, items) {
  const insert = database.prepare(`
    INSERT INTO morning_brief_items (
      id, brief_batch_id, brief_date, generated_at, section, title, summary, reason,
      confidence, importance, source_refs, suggested_action, ai_narrative,
      review_status, corrected_note, created_at
    ) VALUES (
      :id, :brief_batch_id, :brief_date, :generated_at, :section, :title, :summary, :reason,
      :confidence, :importance, :source_refs, :suggested_action, :ai_narrative,
      :review_status, :corrected_note, :created_at
    )
  `);

  const now = new Date().toISOString();
  const rows = items.map((item) => ({
    id: item.id ?? randomUUID(),
    brief_batch_id: item.brief_batch_id,
    brief_date: item.brief_date,
    generated_at: item.generated_at,
    section: item.section,
    title: item.title,
    summary: item.summary,
    reason: item.reason,
    confidence: item.confidence,
    importance: item.importance,
    source_refs: JSON.stringify(item.source_refs),
    suggested_action: item.suggested_action,
    ai_narrative: item.ai_narrative ?? null,
    review_status: item.review_status ?? "proposed",
    corrected_note: item.corrected_note ?? null,
    created_at: item.created_at ?? now,
  }));

  for (const row of rows) {
    insert.run(row);
  }

  return rows.map(deserializeItem);
}

export function getMorningBriefItemById(database, id) {
  const row = database.prepare("SELECT * FROM morning_brief_items WHERE id = ?").get(id);
  return row ? deserializeItem(row) : null;
}

export function getLatestMorningBriefBatch(database) {
  const latest = database
    .prepare(
      "SELECT brief_batch_id FROM morning_brief_items ORDER BY generated_at DESC, rowid DESC LIMIT 1",
    )
    .get();

  return latest ? getMorningBriefBatchById(database, latest.brief_batch_id) : null;
}

export function getMorningBriefBatchById(database, briefBatchId) {
  const rows = database
    .prepare(
      "SELECT * FROM morning_brief_items WHERE brief_batch_id = ? ORDER BY created_at ASC, id ASC",
    )
    .all(briefBatchId);

  return rows.length === 0 ? null : rows.map(deserializeItem);
}

export function listMorningBriefHistory(database) {
  const rows = database
    .prepare(`
      SELECT brief_batch_id, brief_date, generated_at, section, COUNT(*) as count, MAX(rowid) as last_rowid
      FROM morning_brief_items
      GROUP BY brief_batch_id, section
    `)
    .all();

  const batches = new Map();
  for (const row of rows) {
    if (!batches.has(row.brief_batch_id)) {
      batches.set(row.brief_batch_id, {
        brief_batch_id: row.brief_batch_id,
        brief_date: row.brief_date,
        generated_at: row.generated_at,
        lastRowid: row.last_rowid,
        counts: Object.fromEntries(sectionKeys.map((key) => [key, 0])),
      });
    }
    const batch = batches.get(row.brief_batch_id);
    batch.counts[row.section] = row.count;
    batch.lastRowid = Math.max(batch.lastRowid, row.last_rowid);
  }

  return [...batches.values()]
    .sort((a, b) => (a.generated_at === b.generated_at ? b.lastRowid - a.lastRowid : a.generated_at < b.generated_at ? 1 : -1))
    .map(({ lastRowid, ...batch }) => batch);
}

export function updateMorningBriefItemReview(database, id, input) {
  const existing = database.prepare("SELECT * FROM morning_brief_items WHERE id = ?").get(id);
  if (!existing) {
    return null;
  }

  const section = input.review_status === "corrected" ? input.section : existing.section;
  const correctedNote =
    input.corrected_note === undefined ? existing.corrected_note : nullableString(input.corrected_note);

  database
    .prepare(`
      UPDATE morning_brief_items
      SET review_status = :review_status,
          section = :section,
          corrected_note = :corrected_note
      WHERE id = :id
    `)
    .run({ id, review_status: input.review_status, section, corrected_note: correctedNote });

  return getMorningBriefItemById(database, id);
}

function nullableString(value) {
  return typeof value === "string" && value !== "" ? value : null;
}

function deserializeItem(row) {
  return { ...row, source_refs: JSON.parse(row.source_refs) };
}
