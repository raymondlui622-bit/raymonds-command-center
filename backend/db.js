import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(rootDir, "data");
const databasePath = join(dataDir, "command-center.sqlite");

export function checkSqliteConnection() {
  mkdirSync(dataDir, { recursive: true });
  const database = new DatabaseSync(databasePath);
  try {
    const result = database.prepare("SELECT 1 AS ok").get();
    return { ok: result.ok === 1, databasePath };
  } finally {
    database.close();
  }
}
