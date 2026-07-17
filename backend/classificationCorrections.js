import { randomUUID } from "node:crypto";

export function createClassificationCorrection(database, input) {
  const correction = {
    id: input?.id ?? randomUUID(),
    raw_capture_id: requireNonEmptyString(input?.raw_capture_id, "raw_capture_id"),
    suggested_record_type: requireSupportedRecordType(
      input?.suggested_record_type,
      "suggested_record_type",
    ),
    corrected_record_type: requireSupportedRecordType(
      input?.corrected_record_type,
      "corrected_record_type",
    ),
    original_suggestion: serializeJsonText(input?.original_suggestion, "original_suggestion"),
    corrected_values:
      input?.corrected_values === undefined || input?.corrected_values === null
        ? null
        : serializeJsonText(input.corrected_values, "corrected_values"),
    correction_note: nullableString(input?.correction_note),
    created_at: input?.created_at ?? new Date().toISOString(),
  };

  database
    .prepare(`
      INSERT INTO classification_corrections (
        id,
        raw_capture_id,
        suggested_record_type,
        corrected_record_type,
        original_suggestion,
        corrected_values,
        correction_note,
        created_at
      )
      VALUES (
        :id,
        :raw_capture_id,
        :suggested_record_type,
        :corrected_record_type,
        :original_suggestion,
        :corrected_values,
        :correction_note,
        :created_at
      )
    `)
    .run(correction);

  return correction;
}

export function getClassificationCorrectionById(database, id) {
  return database
    .prepare("SELECT * FROM classification_corrections WHERE id = ?")
    .get(id) ?? null;
}

export function listClassificationCorrections(database) {
  return database
    .prepare(`
      SELECT *
      FROM classification_corrections
      ORDER BY created_at DESC, id DESC
    `)
    .all();
}

function requireSupportedRecordType(value, fieldName) {
  const text = requireNonEmptyString(value, fieldName);
  if (!["task", "review_later_resource"].includes(text)) {
    throw new Error(`${fieldName} must be task or review_later_resource`);
  }
  return text;
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

function serializeJsonText(value, fieldName) {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  throw new Error(`${fieldName} is required`);
}
