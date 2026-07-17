import {
  createClassificationCorrection,
  listClassificationCorrections,
} from "./classificationCorrections.js";
import {
  ClassificationProviderUnavailableError,
  normalizeAcceptedClassification,
  requestClassificationSuggestion,
} from "./classificationService.js";
import { getRawCaptureById } from "./rawCaptures.js";
import { createReviewLaterResource, getReviewLaterResourceById } from "./reviewLaterResources.js";
import { createTask, getTaskById } from "./tasks.js";

export async function handleClassificationRequest(
  request,
  response,
  database,
  options = {},
) {
  const url = new URL(request.url, "http://127.0.0.1:3001");

  if (request.method === "OPTIONS") {
    writeJson(response, 204, null);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/classification-corrections") {
    writeJson(response, 200, { corrections: listClassificationCorrections(database) });
    return true;
  }

  const correctionMatch = url.pathname.match(/^\/raw-captures\/([^/]+)\/classification-corrections$/);
  if (request.method === "POST" && correctionMatch) {
    const rawCaptureId = decodeURIComponent(correctionMatch[1]);
    const capture = getRawCaptureById(database, rawCaptureId);
    if (!capture) {
      writeJson(response, 404, { error: "not_found" });
      return true;
    }

    const payload = await readJsonBody(request);
    const correction = createClassificationCorrection(database, {
      raw_capture_id: rawCaptureId,
      suggested_record_type: payload.suggested_record_type,
      corrected_record_type: payload.corrected_record_type,
      original_suggestion: payload.original_suggestion,
      corrected_values: payload.corrected_values,
      correction_note: payload.correction_note,
    });
    writeJson(response, 201, { correction });
    return true;
  }

  const match = url.pathname.match(
    /^\/raw-captures\/([^/]+)\/classification-suggestion(?:\/(accept|reject))?$/,
  );
  if (!match) {
    return false;
  }

  const rawCaptureId = decodeURIComponent(match[1]);
  const action = match[2];
  const capture = getRawCaptureById(database, rawCaptureId);
  if (!capture) {
    writeJson(response, 404, { error: "not_found" });
    return true;
  }

  if (request.method === "POST" && !action) {
    try {
      const suggestion = await requestClassificationSuggestion(capture, options.provider);
      writeJson(response, 200, { suggestion });
    } catch (error) {
      if (error instanceof ClassificationProviderUnavailableError) {
        writeJson(response, 503, { error: "classification_provider_unavailable" });
        return true;
      }
      writeJson(response, 422, { error: "classification_suggestion_invalid" });
    }
    return true;
  }

  if (request.method === "POST" && action === "accept") {
    const payload = await readJsonBody(request);
    const accepted = normalizeAcceptedClassification(payload, rawCaptureId);
    const result = acceptClassification(database, accepted);
    writeJson(response, result.created ? 201 : 200, result);
    return true;
  }

  if (request.method === "POST" && action === "reject") {
    writeJson(response, 200, { rejected: true });
    return true;
  }

  return false;
}

function acceptClassification(database, accepted) {
  if (accepted.proposed_record_type === "task") {
    const existing = getTaskById(database, accepted.acceptance_id);
    if (existing) {
      return { created: false, record_type: "task", record: existing };
    }

    const task = createTask(database, {
      id: accepted.acceptance_id,
      ...accepted.values,
      source_capture_id: accepted.raw_capture_id,
    });
    return { created: true, record_type: "task", record: task };
  }

  const existing = getReviewLaterResourceById(database, accepted.acceptance_id);
  if (existing) {
    return { created: false, record_type: "review_later_resource", record: existing };
  }

  const resource = createReviewLaterResource(database, {
    id: accepted.acceptance_id,
    ...accepted.values,
    source_capture_id: accepted.raw_capture_id,
  });
  return { created: true, record_type: "review_later_resource", record: resource };
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Content-Type": "application/json",
  });

  response.end(payload === null ? "" : JSON.stringify(payload));
}

async function readJsonBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
  }

  if (body === "") {
    return {};
  }

  return JSON.parse(body);
}
