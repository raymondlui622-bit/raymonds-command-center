import test from "node:test";
import assert from "node:assert/strict";
import {
  ClassificationProviderError,
  ClassificationProviderUnavailableError,
  createOpenAIClassificationProvider,
  normalizeAcceptedClassification,
  normalizeClassificationSuggestion,
  requestClassificationSuggestion,
} from "./classificationService.js";

const rawCapture = {
  id: "capture-1",
  raw_text: "Follow up with electrician about Cory exterior lighting",
};

test("returns deterministic mocked Task suggestions through the provider boundary", async () => {
  const suggestion = await requestClassificationSuggestion(rawCapture, {
    async classifyRawCapture(input) {
      assert.deepEqual(input, {
        raw_text: "Follow up with electrician about Cory exterior lighting",
      });
      return {
        proposed_record_type: "task",
        reasoning: "The capture describes a follow-up action.",
        confidence: 0.87,
        values: {
          title: "Follow up with electrician",
          priority: "medium",
        },
      };
    },
  });

  assert.equal(typeof suggestion.acceptance_id, "string");
  assert.notEqual(suggestion.acceptance_id, "");
  assert.equal(suggestion.raw_capture_id, "capture-1");
  assert.equal(suggestion.proposed_record_type, "task");
  assert.equal(suggestion.values.title, "Follow up with electrician");
});

test("normalizes valid Review Later suggestions", () => {
  const suggestion = normalizeClassificationSuggestion(
    {
      proposed_record_type: "review_later_resource",
      reasoning: "The capture is a resource to review.",
      confidence: "medium",
      values: {
        title: "Lighting reference",
        resource_type: "note",
        why_it_matters: "May help with exterior lighting planning",
      },
    },
    "capture-2",
  );

  assert.equal(suggestion.proposed_record_type, "review_later_resource");
  assert.equal(suggestion.values.resource_type, "note");
  assert.deepEqual(Object.keys(suggestion.values), [
    "title",
    "resource_type",
    "why_it_matters",
  ]);
});

test("rejects malformed AI responses safely", () => {
  assert.throws(
    () =>
      normalizeClassificationSuggestion(
        {
          proposed_record_type: "project",
          reasoning: "Not supported in Milestone 10.",
          confidence: 0.4,
          values: { name: "Project" },
        },
        "capture-1",
      ),
    /classification_suggestion_invalid_record_type/,
  );

  assert.throws(
    () =>
      normalizeClassificationSuggestion(
        {
          proposed_record_type: "task",
          reasoning: "",
          confidence: 0.4,
          values: { title: "Task" },
        },
        "capture-1",
      ),
    /reasoning is required/,
  );

  assert.throws(
    () =>
      normalizeClassificationSuggestion(
        {
          proposed_record_type: "task",
          reasoning: "Extra fields are not allowed.",
          confidence: 0.4,
          values: { title: "Task", priority: "medium", next_action: "Nope" },
        },
        "capture-1",
      ),
    /Unsupported classification field/,
  );
});

test("reports provider unavailable when no runtime provider is configured", async () => {
  await assert.rejects(
    () => requestClassificationSuggestion(rawCapture, null),
    ClassificationProviderUnavailableError,
  );
});

test("normalizes edited accepted suggestions before record creation", () => {
  const accepted = normalizeAcceptedClassification(
    {
      acceptance_id: "accept-edited-1",
      proposed_record_type: "task",
      values: {
        title: "Edited task title",
        priority: "high",
      },
    },
    "capture-1",
  );

  assert.equal(accepted.values.title, "Edited task title");
  assert.equal(accepted.values.priority, "high");
  assert.equal(accepted.raw_capture_id, "capture-1");
});

test("OpenAI provider sends only Raw Capture text and uses the default model", async () => {
  const requests = [];
  const provider = createOpenAIClassificationProvider({
    apiKey: "test-key",
    fetchImpl: async (url, options) => {
      requests.push({ url, options, body: JSON.parse(options.body) });
      return jsonResponse({
        output_text: JSON.stringify({
          proposed_record_type: "task",
          reasoning: "This is a task.",
          confidence: 0.82,
          values: {
            title: "Follow up with electrician",
            priority: "medium",
          },
        }),
      });
    },
  });

  const suggestion = await requestClassificationSuggestion(rawCapture, provider);
  const request = requests[0];
  const bodyText = JSON.stringify(request.body);

  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.body.model, "gpt-5-mini");
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.equal(bodyText.includes(rawCapture.raw_text), true);
  assert.equal(bodyText.includes(rawCapture.id), false);
  assert.equal(bodyText.includes("acceptance_id"), false);
  assert.equal(bodyText.includes("raw_capture_id"), false);
  assert.equal(suggestion.raw_capture_id, rawCapture.id);
  assert.equal(typeof suggestion.acceptance_id, "string");
});

test("OpenAI provider uses configured model and strict structured output schema", async () => {
  let requestBody;
  const provider = createOpenAIClassificationProvider({
    apiKey: "test-key",
    model: "custom-model",
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return jsonResponse({
        output: [
          {
            content: [
              {
                text: JSON.stringify({
                  proposed_record_type: "review_later_resource",
                  reasoning: "This is a resource.",
                  confidence: 0.72,
                  values: {
                    title: "Lighting reference",
                    resource_type: "note",
                    why_it_matters: "May help with planning.",
                  },
                }),
              },
            ],
          },
        ],
      });
    },
  });

  const suggestion = await requestClassificationSuggestion(rawCapture, provider);

  assert.equal(requestBody.model, "custom-model");
  assert.equal(requestBody.text.format.type, "json_schema");
  assert.equal(requestBody.text.format.strict, true);
  assert.equal(requestBody.text.format.schema.additionalProperties, false);
  assert.equal(suggestion.proposed_record_type, "review_later_resource");
  assert.equal(suggestion.raw_capture_id, rawCapture.id);
});

test("OpenAI provider treats timeout, network, and provider errors as provider errors", async () => {
  const timeoutProvider = createOpenAIClassificationProvider({
    apiKey: "test-key",
    timeoutMs: 1,
    fetchImpl: (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new Error("aborted")));
      }),
  });
  const networkProvider = createOpenAIClassificationProvider({
    apiKey: "test-key",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });
  const provider4xx = createOpenAIClassificationProvider({
    apiKey: "test-key",
    fetchImpl: async () => jsonResponse({}, { ok: false, status: 401 }),
  });
  const provider5xx = createOpenAIClassificationProvider({
    apiKey: "test-key",
    fetchImpl: async () => jsonResponse({}, { ok: false, status: 500 }),
  });

  await assert.rejects(
    () => requestClassificationSuggestion(rawCapture, timeoutProvider),
    ClassificationProviderError,
  );
  await assert.rejects(
    () => requestClassificationSuggestion(rawCapture, networkProvider),
    ClassificationProviderError,
  );
  await assert.rejects(
    () => requestClassificationSuggestion(rawCapture, provider4xx),
    ClassificationProviderError,
  );
  await assert.rejects(
    () => requestClassificationSuggestion(rawCapture, provider5xx),
    ClassificationProviderError,
  );
});

test("OpenAI provider invalid structured output is rejected without becoming provider fallback", async () => {
  const provider = createOpenAIClassificationProvider({
    apiKey: "test-key",
    fetchImpl: async () =>
      jsonResponse({
        output_text: JSON.stringify({
          proposed_record_type: "project",
          reasoning: "Unsupported target.",
          confidence: 0.5,
          values: { title: "Project" },
        }),
      }),
  });

  await assert.rejects(
    () => requestClassificationSuggestion(rawCapture, provider),
    /classification_suggestion_invalid_record_type/,
  );
});

function jsonResponse(payload, overrides = {}) {
  return {
    ok: overrides.ok ?? true,
    status: overrides.status ?? 200,
    async json() {
      return payload;
    },
  };
}
