import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { schema, type OrbitDatabase } from "@orbit/db";

export interface DesktopDatabase {
  close(): void;
  db: OrbitDatabase;
  nativeBinding: string;
}

export interface CreateDesktopDatabaseOptions {
  databasePath: string;
  migrationsFolder: string;
  nativeBinding: string;
}

export function createDesktopDatabase({
  databasePath,
  migrationsFolder,
  nativeBinding,
}: CreateDesktopDatabaseOptions): DesktopDatabase {
  mkdirSync(dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath, { nativeBinding });
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder });

  return {
    close() {
      sqlite.close();
    },
    db,
    nativeBinding,
  };
}
