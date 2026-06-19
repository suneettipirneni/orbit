import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schemas/index.js";

export type OrbitDatabase = BaseSQLiteDatabase<"sync", unknown, typeof schema>;
