import {
  archiveArsenalItem,
  createArsenalItem,
  getArsenalItemById,
  listArsenalItems,
  updateArsenalItem,
} from "./arsenalItems.js";

export async function handleArsenalItemRequest(request, response, database) {
  const url = new URL(request.url, "http://127.0.0.1:3001");

  if (request.method === "OPTIONS") {
    writeJson(response, 204, null);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/arsenal") {
    writeJson(response, 200, { items: listArsenalItems(database) });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/arsenal") {
    const payload = await readJsonBody(request);
    const item = createArsenalItem(database, payload);

    writeJson(response, 201, { item });
    return true;
  }

  const match = url.pathname.match(/^\/arsenal\/([^/]+)(?:\/archive)?$/);
  if (!match) {
    return false;
  }

  const id = decodeURIComponent(match[1]);
  const isArchiveAction = url.pathname.endsWith("/archive");

  if (request.method === "GET" && !isArchiveAction) {
    const item = getArsenalItemById(database, id);
    writeJson(response, item ? 200 : 404, item ? { item } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && !isArchiveAction) {
    const payload = await readJsonBody(request);
    const item = updateArsenalItem(database, id, payload);
    writeJson(response, item ? 200 : 404, item ? { item } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && isArchiveAction) {
    const item = archiveArsenalItem(database, id);
    writeJson(response, item ? 200 : 404, item ? { item } : { error: "not_found" });
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
