import { randomUUID } from "node:crypto";

const supportedRecordTypes = Object.freeze(["task", "review_later_resource"]);
const defaultOpenAIModel = "gpt-5-mini";
const defaultOpenAITimeoutMs = 15000;
const openAIResponsesUrl = "https://api.openai.com/v1/responses";

export class ClassificationProviderUnavailableError extends Error {
  constructor() {
    super("classification_provider_unavailable");
    this.name = "ClassificationProviderUnavailableError";
  }
}

export class ClassificationProviderError extends Error {
  constructor(message = "classification_provider_error") {
    super(message);
    this.name = "ClassificationProviderError";
  }
}

export function getRuntimeOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: process.env.RCC_AI_CLASSIFICATION_MODEL ?? defaultOpenAIModel,
    timeoutMs: Number.parseInt(
      process.env.RCC_AI_CLASSIFICATION_TIMEOUT_MS ?? `${defaultOpenAITimeoutMs}`,
      10,
    ),
  };
}

export function getRuntimeClassificationProvider() {
  const config = getRuntimeOpenAIConfig();
  if (!config) {
    return null;
  }

  return createOpenAIClassificationProvider(config);
}

export async function callOpenAIResponsesApi({
  apiKey,
  model,
  timeoutMs = defaultOpenAITimeoutMs,
  fetchImpl = fetch,
  requestBody,
}) {
  const requestTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : defaultOpenAITimeoutMs;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  let response;
  try {
    response = await fetchImpl(openAIResponsesUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch {
    throw new ClassificationProviderError();
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ClassificationProviderError();
  }

  try {
    return await response.json();
  } catch {
    throw new ClassificationProviderError();
  }
}

export function createOpenAIClassificationProvider({
  apiKey,
  model = defaultOpenAIModel,
  timeoutMs = defaultOpenAITimeoutMs,
  fetchImpl = fetch,
} = {}) {
  if (!apiKey) {
    throw new ClassificationProviderUnavailableError();
  }

  return {
    async classifyRawCapture(input) {
      const payload = await callOpenAIResponsesApi({
        apiKey,
        model,
        timeoutMs,
        fetchImpl,
        requestBody: buildOpenAIClassificationRequest(input.raw_text, model),
      });

      return parseOpenAIClassificationResponse(payload);
    },
  };
}

export async function requestClassificationSuggestion(rawCapture, provider = getRuntimeClassificationProvider()) {
  if (!provider || typeof provider.classifyRawCapture !== "function") {
    throw new ClassificationProviderUnavailableError();
  }

  const providerSuggestion = await provider.classifyRawCapture({
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
    acceptance_id: randomUUID(),
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
    requireOnlyFields(values, ["title", "priority"]);
    return {
      title: requireNonEmptyString(values.title, "title"),
      priority: optionalString(values.priority) ?? "medium",
    };
  }

  requireOnlyFields(values, ["title", "resource_type", "why_it_matters"]);
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

function requireOnlyFields(values, allowedFields) {
  for (const field of Object.keys(values)) {
    if (!allowedFields.includes(field)) {
      throw new Error(`Unsupported classification field: ${field}`);
    }
  }
}

function buildOpenAIClassificationRequest(rawText, model) {
  return {
    model,
    input: [
      {
        role: "system",
        content:
          "Classify one raw capture into exactly one supported Command Center record type. Return only the structured JSON requested. Do not invent IDs, timestamps, statuses, archive state, or extra fields.",
      },
      {
        role: "user",
        content: `Raw Capture text:\n${rawText}`,
      },
    ],
    max_output_tokens: 500,
    text: {
      format: {
        type: "json_schema",
        name: "raw_capture_classification",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["proposed_record_type", "reasoning", "confidence", "values"],
          properties: {
            proposed_record_type: {
              type: "string",
              enum: ["task", "review_later_resource"],
            },
            reasoning: {
              type: "string",
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
            values: {
              anyOf: [
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "priority"],
                  properties: {
                    title: { type: "string" },
                    priority: { type: "string" },
                  },
                },
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "resource_type", "why_it_matters"],
                  properties: {
                    title: { type: "string" },
                    resource_type: { type: "string" },
                    why_it_matters: { type: "string" },
                  },
                },
              ],
            },
          },
        },
      },
    },
  };
}

function parseOpenAIClassificationResponse(payload) {
  const outputText = extractOpenAIOutputText(payload);
  if (!outputText) {
    throw new Error("classification_suggestion_invalid");
  }

  return JSON.parse(outputText);
}

export function extractOpenAIOutputText(payload) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  for (const output of payload?.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}
