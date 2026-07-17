import {
  archivePromptLibraryItem,
  createPromptLibraryItem,
  getPromptLibraryItemById,
  listPromptLibraryItems,
  setPromptLibraryItemFavorite,
  updatePromptLibraryItem,
} from "./promptLibraryItems.js";

export async function handlePromptLibraryItemRequest(request, response, database) {
  const url = new URL(request.url, "http://127.0.0.1:3001");

  if (request.method === "OPTIONS") {
    writeJson(response, 204, null);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/prompts") {
    writeJson(response, 200, { prompts: listPromptLibraryItems(database) });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/prompts") {
    const payload = await readJsonBody(request);
    const prompt = createPromptLibraryItem(database, payload);

    writeJson(response, 201, { prompt });
    return true;
  }

  const match = url.pathname.match(/^\/prompts\/([^/]+)(?:\/(archive|favorite))?$/);
  if (!match) {
    return false;
  }

  const id = decodeURIComponent(match[1]);
  const action = match[2];

  if (request.method === "GET" && !action) {
    const prompt = getPromptLibraryItemById(database, id);
    writeJson(response, prompt ? 200 : 404, prompt ? { prompt } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && !action) {
    const payload = await readJsonBody(request);
    const prompt = updatePromptLibraryItem(database, id, payload);
    writeJson(response, prompt ? 200 : 404, prompt ? { prompt } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && action === "archive") {
    const prompt = archivePromptLibraryItem(database, id);
    writeJson(response, prompt ? 200 : 404, prompt ? { prompt } : { error: "not_found" });
    return true;
  }

  if (request.method === "PATCH" && action === "favorite") {
    const payload = await readJsonBody(request);
    const prompt = setPromptLibraryItemFavorite(database, id, payload.is_favorite);
    writeJson(response, prompt ? 200 : 404, prompt ? { prompt } : { error: "not_found" });
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
