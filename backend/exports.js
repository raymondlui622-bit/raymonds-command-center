import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJsonPath = join(rootDir, "package.json");
const applicationVersion = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;

export const EXPORT_FORMAT_VERSION = "1";

export function buildExportPayload(database, exportedAt = new Date().toISOString()) {
  return {
    metadata: {
      exported_at: exportedAt,
      format_version: EXPORT_FORMAT_VERSION,
      application_version: applicationVersion,
    },
    data: {
      raw_captures: selectAll(database, "raw_captures", "captured_at DESC, id DESC"),
      tasks: selectAll(database, "tasks", "created_at DESC, id DESC"),
      review_later_resources: selectAll(
        database,
        "review_later_resources",
        "saved_at DESC, id DESC",
      ),
      projects: selectAll(database, "projects", "created_at DESC, id DESC"),
      project_updates: selectAll(database, "project_updates", "created_at DESC, id DESC"),
      arsenal_items: selectAll(database, "arsenal_items", "created_at DESC, id DESC"),
      prompt_library_items: selectAll(
        database,
        "prompt_library_items",
        "created_at DESC, id DESC",
      ),
      classification_corrections: selectAll(
        database,
        "classification_corrections",
        "created_at DESC, id DESC",
      ),
      morning_brief_items: selectAll(
        database,
        "morning_brief_items",
        "created_at DESC, id DESC",
      ),
    },
  };
}

export function renderJsonExport(database) {
  return `${JSON.stringify(buildExportPayload(database), null, 2)}\n`;
}

export function renderMarkdownExport(database) {
  const payload = buildExportPayload(database);
  const lines = [
    "# Raymond Command Center Export",
    "",
    "## Metadata",
    "",
    `- Exported at: ${payload.metadata.exported_at}`,
    `- Format version: ${payload.metadata.format_version}`,
    `- Application version: ${payload.metadata.application_version}`,
    "",
  ];

  appendRecordSection(lines, "Raw Captures", payload.data.raw_captures);
  appendRecordSection(lines, "Tasks", payload.data.tasks);
  appendRecordSection(lines, "Review Later Resources", payload.data.review_later_resources);
  appendRecordSection(lines, "Projects", payload.data.projects);
  appendRecordSection(lines, "Project Updates", payload.data.project_updates);
  appendRecordSection(lines, "My Arsenal Items", payload.data.arsenal_items);
  appendRecordSection(lines, "Prompt Library Items", payload.data.prompt_library_items);
  appendRecordSection(lines, "Classification Corrections", payload.data.classification_corrections);
  appendRecordSection(lines, "Morning Brief Items", payload.data.morning_brief_items);

  return `${lines.join("\n")}\n`;
}

export function buildExportFilename(extension, date = new Date()) {
  const datePart = date.toISOString().slice(0, 10);
  return `raymond-command-center-export-${datePart}.${extension}`;
}

function selectAll(database, tableName, orderBy) {
  return database
    .prepare(`
      SELECT *
      FROM ${tableName}
      ORDER BY ${orderBy}
    `)
    .all();
}

function appendRecordSection(lines, title, records) {
  lines.push(`## ${title}`, "");

  if (records.length === 0) {
    lines.push("_No records._", "");
    return;
  }

  records.forEach((record, index) => {
    lines.push(`### ${index + 1}. ${recordTitle(record)}`, "");
    lines.push("| Field | Value |", "| --- | --- |");

    for (const [field, value] of Object.entries(record)) {
      lines.push(`| ${escapeMarkdownTableCell(field)} | ${escapeMarkdownTableCell(formatValue(value))} |`);
    }

    lines.push("");
  });
}

function recordTitle(record) {
  return record.title ?? record.name ?? record.update_text ?? record.raw_text ?? record.id;
}

function formatValue(value) {
  if (value === null) {
    return "null";
  }

  return String(value);
}

function escapeMarkdownTableCell(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", "<br>");
}
