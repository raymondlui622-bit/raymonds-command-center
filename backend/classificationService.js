import { randomUUID } from "node:crypto";

const supportedRecordTypes = Object.freeze(["task", "review_later_resource"]);

export class ClassificationProviderUnavailableError extends Error {
  constructor() {
    super("classification_provider_unavailable");
    this.name = "ClassificationProviderUnavailableError";
  }
}

export function getRuntimeClassificationProvider() {
  return null;
}

export async function requestClassificationSuggestion(rawCapture, provider = getRuntimeClassificationProvider()) {
  if (!provider || typeof provider.classifyRawCapture !== "function") {
    throw new ClassificationProviderUnavailableError();
  }

  const providerSuggestion = await provider.classifyRawCapture({
    id: rawCapture.id,
    raw_text: rawCapture.raw_text,
  });

  return normalizeClassificationSuggestion(providerSuggestion, rawCapture.id);
}

export function normalizeClassificationSuggestion(input, rawCaptureId) {
  if (!input || typeof input !== "object") {
    throw new Error("classification_suggestion_invalid");
  }

  const proposedRecordType = input.proposed_record_type;
  if (!supportedRecordTypes.includes(proposedRecordType)) {
    throw new Error("classification_suggestion_invalid_record_type");
  }

  const suggestion = {
    acceptance_id: input.acceptance_id ?? randomUUID(),
    raw_capture_id: rawCaptureId,
    proposed_record_type: proposedRecordType,
    reasoning: requireNonEmptyString(input.reasoning, "reasoning"),
    confidence: normalizeConfidence(input.confidence),
    values: normalizeValues(proposedRecordType, input.values),
  };

  return suggestion;
}

export function normalizeAcceptedClassification(input, rawCaptureId) {
  if (!input || typeof input !== "object") {
    throw new Error("classification_acceptance_invalid");
  }

  return {
    acceptance_id: requireNonEmptyString(input.acceptance_id, "acceptance_id"),
    raw_capture_id: rawCaptureId,
    proposed_record_type: requireSupportedRecordType(input.proposed_record_type),
    values: normalizeValues(input.proposed_record_type, input.values),
  };
}

function normalizeValues(recordType, values) {
  if (!values || typeof values !== "object") {
    throw new Error("classification_suggestion_values_invalid");
  }

  if (recordType === "task") {
    return {
      title: requireNonEmptyString(values.title, "title"),
      priority: optionalString(values.priority) ?? "medium",
    };
  }

  return {
    title: requireNonEmptyString(values.title, "title"),
    resource_type: requireNonEmptyString(values.resource_type, "resource_type"),
    why_it_matters: requireNonEmptyString(values.why_it_matters, "why_it_matters"),
  };
}

function requireSupportedRecordType(value) {
  if (!supportedRecordTypes.includes(value)) {
    throw new Error("classification_record_type_unsupported");
  }

  return value;
}

function normalizeConfidence(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(1, value));
  }

  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  throw new Error("confidence is required");
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required`);
  }

  return value;
}

function optionalString(value) {
  return typeof value === "string" && value !== "" ? value : null;
}
