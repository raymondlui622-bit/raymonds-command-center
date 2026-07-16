import {
  archiveReviewLaterResource,
  createReviewLaterResource,
  getReviewLaterResourceById,
  listReviewLaterResources,
  updateReviewLaterResource,
} from "./reviewLaterResources.js";

export async function handleReviewLaterResourceRequest(request, response, database) {
  const url = new URL(request.url, "http://127.0.0.1:3001");

  if (request.method === "OPTIONS") {
    writeJson(response, 204, null);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/review-later") {
    writeJson(response, 200, { resources: listReviewLaterResources(database) });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/review-later") {
    const payload = await readJsonBody(request);
    const resource = createReviewLaterResource(database, payload);

    writeJson(response, 201, { resource });
    return true;
  }

  const match = url.pathname.match(/^\/review-later\/([^/]+)(?:\/archive)?$/);
  if (!match) {
    return false;
  }

  const id = decodeURIComponent(match[1]);
  const isArchiveAction = url.pathname.endsWith("/archive");

  if (request.method === "GET" && !isArchiveAction) {
    const resource = getReviewLaterResourceById(database, id);
    writeJson(response, resource ? 200 : 404, resource ? { resource } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && !isArchiveAction) {
    const payload = await readJsonBody(request);
    const resource = updateReviewLaterResource(database, id, payload);
    writeJson(response, resource ? 200 : 404, resource ? { resource } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && isArchiveAction) {
    const resource = archiveReviewLaterResource(database, id);
    writeJson(response, resource ? 200 : 404, resource ? { resource } : { error: "not_found" });
    return true;
  }

  return false;
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
