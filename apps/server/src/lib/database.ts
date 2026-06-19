import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schemas/index.js";

export interface DatabaseHandle {
  db: ReturnType<typeof drizzle<typeof schema>>;
  sqlite: Database.Database;
}

export interface CreateDatabaseOptions {
  migrationsFolder?: string;
}

export function createDatabase(
  databasePath: string,
  options: CreateDatabaseOptions = {},
): DatabaseHandle {
  mkdirSync(dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });
  migrate(db, {
    migrationsFolder: options.migrationsFolder ?? getDefaultMigrationsFolder(),
  });

  return {
    db,
    sqlite,
  };
}

function getDefaultMigrationsFolder() {
  return fileURLToPath(new URL("./migrations", import.meta.url));
}
