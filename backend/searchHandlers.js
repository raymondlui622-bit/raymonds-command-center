import { isSearchableModule, searchRecords } from "./search.js";

export async function handleSearchRequest(request, response, database) {
  const url = new URL(request.url, "http://127.0.0.1:3001");

  if (request.method === "OPTIONS") {
    writeJson(response, 204, null);
    return true;
  }

  if (request.method !== "GET" || url.pathname !== "/search") {
    return false;
  }

  const recordType = url.searchParams.get("record_type") ?? "";
  if (recordType !== "" && !isSearchableModule(recordType)) {
    writeJson(response, 400, { error: "invalid_record_type" });
    return true;
  }

  const results = searchRecords(database, {
    q: url.searchParams.get("q") ?? "",
    status: url.searchParams.get("status") ?? "",
    related_project_id: url.searchParams.get("related_project_id") ?? "",
    record_type: recordType,
  });

  writeJson(response, 200, { results });
  return true;
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Content-Type": "application/json",
  });

  response.end(payload === null ? "" : JSON.stringify(payload));
}
