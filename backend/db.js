import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { migrateArsenalItems } from "./migrations/arsenalItems.js";
import { migrateClassificationCorrections } from "./migrations/classificationCorrections.js";
import { migrateProjectUpdates } from "./migrations/projectUpdates.js";
import { migrateProjects } from "./migrations/projects.js";
import { migratePromptLibraryItems } from "./migrations/promptLibraryItems.js";
import { migrateRawCaptures } from "./migrations/rawCaptures.js";
import { migrateReviewLaterResources } from "./migrations/reviewLaterResources.js";
import { migrateTasks } from "./migrations/tasks.js";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(rootDir, "data");
const databasePath = join(dataDir, "command-center.sqlite");

export function openDatabase(path = databasePath) {
  mkdirSync(dirname(path), { recursive: true });
  return new DatabaseSync(path);
}

export function initializeDatabase(database) {
  migrateRawCaptures(database);
  migrateTasks(database);
  migrateReviewLaterResources(database);
  migrateProjects(database);
  migrateProjectUpdates(database);
  migrateArsenalItems(database);
  migratePromptLibraryItems(database);
  migrateClassificationCorrections(database);
}

export function getDatabase(path = databasePath) {
  const database = openDatabase(path);
  initializeDatabase(database);
  return database;
}

export function checkSqliteConnection() {
  const database = getDatabase(databasePath);
  try {
    const result = database.prepare("SELECT 1 AS ok").get();
    return { ok: result.ok === 1, databasePath };
  } finally {
    database.close();
  }
}
