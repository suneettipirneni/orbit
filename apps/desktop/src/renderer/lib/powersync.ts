import { DrizzleAppSchema, wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import {
  PowerSyncDatabase,
  type AbstractPowerSyncDatabase,
  type CrudEntry,
  type PowerSyncBackendConnector,
  type PowerSyncCredentials,
} from "@powersync/web";
import { createPowerSyncAppSchemaEntries, powerSyncDrizzleSchema } from "./powersync-schema";

export type PowerSyncStorageMode = "auto" | "local-only" | "synced";

const explicitStorageMode = getConfiguredStorageMode();
export const powerSyncStorageMode =
  explicitStorageMode === "auto" ? resolveAutomaticStorageMode() : explicitStorageMode;
export const isPowerSyncLocalOnly = powerSyncStorageMode === "local-only";

const appSchema = new DrizzleAppSchema(
  createPowerSyncAppSchemaEntries({ localOnly: isPowerSyncLocalOnly }),
);

export const powerSync = new PowerSyncDatabase({
  database: {
    dbFilename: "orbit.sqlite",
  },
  schema: appSchema,
});

export const db = wrapPowerSyncWithDrizzle(powerSync, {
  schema: powerSyncDrizzleSchema,
});

let connectPromise: Promise<void> | undefined;

export function connectPowerSync() {
  if (isPowerSyncLocalOnly) {
    return Promise.resolve();
  }

  connectPromise ??= powerSync.connect(createBackendConnector()).catch((error: unknown) => {
    connectPromise = undefined;
    console.error("PowerSync connection failed", error);
  });

  return connectPromise;
}

function getConfiguredStorageMode(): PowerSyncStorageMode {
  const storedMode = readStoredStorageMode();

  if (storedMode) {
    return storedMode;
  }

  const envMode = getEnvString("VITE_POWERSYNC_STORAGE_MODE");

  if (isPowerSyncStorageMode(envMode)) {
    return envMode;
  }

  return "auto";
}

function readStoredStorageMode(): PowerSyncStorageMode | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const storedPreferences = window.localStorage.getItem("orbit:anki-preferences");

  if (!storedPreferences) {
    return undefined;
  }

  try {
    const parsedPreferences = JSON.parse(storedPreferences) as { powerSyncStorageMode?: unknown };
    const storageMode = parsedPreferences.powerSyncStorageMode;

    return isPowerSyncStorageMode(storageMode) ? storageMode : undefined;
  } catch {
    return undefined;
  }
}

function isPowerSyncStorageMode(value: unknown): value is PowerSyncStorageMode {
  return value === "auto" || value === "local-only" || value === "synced";
}

function resolveAutomaticStorageMode(): Exclude<PowerSyncStorageMode, "auto"> {
  return hasPowerSyncBackendConfiguration() ? "synced" : "local-only";
}

function hasPowerSyncBackendConfiguration() {
  return Boolean(
    (getEnvString("VITE_POWERSYNC_ENDPOINT") && getEnvString("VITE_POWERSYNC_DEMO_ACCESS")) ||
    getEnvString("VITE_POWERSYNC_CREDENTIALS_URL"),
  );
}

function getEnvString(key: string) {
  const env = import.meta.env as unknown as Record<string, unknown>;
  const value = env[key];

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function createBackendConnector(): PowerSyncBackendConnector {
  return {
    fetchCredentials: fetchPowerSyncCredentials,
    uploadData: uploadPowerSyncCrud,
  };
}

async function fetchPowerSyncCredentials(): Promise<PowerSyncCredentials | null> {
  const endpoint = getEnvString("VITE_POWERSYNC_ENDPOINT");
  const demoAccess = getEnvString("VITE_POWERSYNC_DEMO_ACCESS");
  const credentialsUrl = getEnvString("VITE_POWERSYNC_CREDENTIALS_URL");

  if (endpoint && demoAccess) {
    return { endpoint, token: demoAccess };
  }

  if (!credentialsUrl) {
    return null;
  }

  const response = await fetch(credentialsUrl, { credentials: "include" });

  if (response.status === 401 || response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`PowerSync credentials request failed with ${response.status}`);
  }

  return (await response.json()) as PowerSyncCredentials;
}

async function uploadPowerSyncCrud(database: AbstractPowerSyncDatabase) {
  const uploadUrl = getEnvString("VITE_POWERSYNC_UPLOAD_URL");
  const batch = await database.getCrudBatch();

  if (!batch) {
    return;
  }

  if (!uploadUrl) {
    return;
  }

  const response = await fetch(uploadUrl, {
    body: JSON.stringify({
      changes: batch.crud.map(serializeCrudEntry),
    }),
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`PowerSync upload failed with ${response.status}`);
  }

  const result = (await response.json().catch(() => ({}))) as { writeCheckpoint?: string };
  await batch.complete(result.writeCheckpoint);
}

function serializeCrudEntry(entry: CrudEntry) {
  return {
    data: entry.opData ?? null,
    id: entry.id,
    op: entry.op,
    table: entry.table,
  };
}
