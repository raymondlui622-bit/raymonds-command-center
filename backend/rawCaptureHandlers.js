import {
  archiveRawCapture,
  createRawCapture,
  getRawCaptureById,
  listRawCaptures,
} from "./rawCaptures.js";

export async function handleRawCaptureRequest(request, response, database) {
  const url = new URL(request.url, "http://127.0.0.1:3001");

  if (request.method === "OPTIONS") {
    writeJson(response, 204, null);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/raw-captures") {
    writeJson(response, 200, { captures: listRawCaptures(database) });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/raw-captures") {
    const payload = await readJsonBody(request);
    const capture = createRawCapture(database, {
      raw_text: payload.raw_text,
      source: payload.source ?? "manual",
    });

    writeJson(response, 201, { capture });
    return true;
  }

  const match = url.pathname.match(/^\/raw-captures\/([^/]+)(?:\/archive)?$/);
  if (!match) {
    return false;
  }

  const id = decodeURIComponent(match[1]);

  if (request.method === "GET" && url.pathname === `/raw-captures/${match[1]}`) {
    const capture = getRawCaptureById(database, id);
    writeJson(response, capture ? 200 : 404, capture ? { capture } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && url.pathname.endsWith("/archive")) {
    const capture = archiveRawCapture(database, id);
    writeJson(response, capture ? 200 : 404, capture ? { capture } : { error: "not_found" });
    return true;
  }

  return false;
}

export function writeJson(response, statusCode, payload) {
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
