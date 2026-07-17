import { buildExportFilename, renderJsonExport, renderMarkdownExport } from "./exports.js";

export async function handleExportRequest(request, response, database) {
  const url = new URL(request.url, "http://127.0.0.1:3001");

  if (request.method === "OPTIONS") {
    writeExportResponse(response, 204, "", "text/plain", null);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/export.json") {
    writeExportResponse(
      response,
      200,
      renderJsonExport(database),
      "application/json; charset=utf-8",
      buildExportFilename("json"),
    );
    return true;
  }

  if (request.method === "GET" && url.pathname === "/export.md") {
    writeExportResponse(
      response,
      200,
      renderMarkdownExport(database),
      "text/markdown; charset=utf-8",
      buildExportFilename("md"),
    );
    return true;
  }

  return false;
}

function writeExportResponse(response, statusCode, body, contentType, filename) {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Content-Type": contentType,
  };

  if (filename) {
    headers["Content-Disposition"] = `attachment; filename="${filename}"`;
  }

  response.writeHead(statusCode, headers);
  response.end(body);
}
