import { getRuntimeOpenAIConfig } from "./classificationService.js";
import {
  getLatestMorningBriefBatch,
  getMorningBriefItemById,
  insertMorningBriefBatch,
  listMorningBriefHistory,
  updateMorningBriefItemReview,
} from "./morningBriefItems.js";
import { assembleMorningBrief, requestMorningBriefNarrative } from "./morningBriefService.js";

const allowedSections = ["requires_raymond", "needs_verification", "waiting_on_others", "fyi"];
const allowedPatchStatuses = ["accepted", "dismissed", "corrected"];

export async function handleMorningBriefRequest(request, response, database, options = {}) {
  const url = new URL(request.url, "http://127.0.0.1:3001");

  if (request.method === "OPTIONS") {
    writeJson(response, 204, null);
    return true;
  }

  if (request.method === "POST" && url.pathname === "/morning-brief") {
    const assembled = assembleMorningBrief(database);
    const narrativeResult = await requestMorningBriefNarrative(
      assembled.items,
      options.openAIConfig ?? getRuntimeOpenAIConfig(),
    );
    const savedItems = insertMorningBriefBatch(database, narrativeResult.items);

    writeJson(response, 200, {
      brief_batch_id: assembled.briefBatchId,
      generated_at: assembled.generatedAt,
      brief_date: assembled.briefDate,
      ai_status: narrativeResult.ai_status,
      items: groupBySection(savedItems),
    });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/morning-brief/latest") {
    const batch = getLatestMorningBriefBatch(database);
    if (!batch) {
      writeJson(response, 200, {
        brief_batch_id: null,
        generated_at: null,
        brief_date: null,
        items: groupBySection([]),
      });
      return true;
    }

    writeJson(response, 200, {
      brief_batch_id: batch[0].brief_batch_id,
      generated_at: batch[0].generated_at,
      brief_date: batch[0].brief_date,
      items: groupBySection(batch),
    });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/morning-brief/history") {
    writeJson(response, 200, { batches: listMorningBriefHistory(database) });
    return true;
  }

  const patchMatch = url.pathname.match(/^\/morning-brief-items\/([^/]+)$/);
  if (request.method === "PATCH" && patchMatch) {
    const id = decodeURIComponent(patchMatch[1]);
    const existing = getMorningBriefItemById(database, id);
    if (!existing) {
      writeJson(response, 404, { error: "not_found" });
      return true;
    }

    const payload = await readJsonBody(request);
    if (!allowedPatchStatuses.includes(payload.review_status)) {
      writeJson(response, 422, { error: "invalid_review_status" });
      return true;
    }

    if (payload.review_status === "corrected" && !allowedSections.includes(payload.section)) {
      writeJson(response, 422, { error: "invalid_section" });
      return true;
    }

    const updated = updateMorningBriefItemReview(database, id, {
      review_status: payload.review_status,
      section: payload.section,
      corrected_note: payload.corrected_note,
    });
    writeJson(response, 200, { item: updated });
    return true;
  }

  return false;
}

function groupBySection(items) {
  const grouped = Object.fromEntries(allowedSections.map((section) => [section, []]));
  for (const item of items) {
    grouped[item.section].push(item);
  }
  return grouped;
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
