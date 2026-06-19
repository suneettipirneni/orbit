import { ipcMain } from "electron";
import { createDeckInputSchema, updateDeckInputSchema } from "@orbit/api";
import type { ListDeckCardsInput, PaginationInput } from "@orbit/api";
import { isAnkiPackagePath, loadAnkiPackage } from "@orbit/anki";
import type { OrbitDatabase } from "@orbit/db";
import * as deckRepo from "@orbit/db/deck";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import type { IpcImportAnkiDecksInput } from "../../preload/api.js";
import type { IpcRuntimeOptions } from "./index.js";
import { requireFound } from "./shared.js";

export function registerDeckIpcHandlers(db: OrbitDatabase, options: IpcRuntimeOptions) {
  ipcMain.handle("orbit:decks:list", (_event, input: PaginationInput | undefined) =>
    deckRepo.listDecks(db, input),
  );

  ipcMain.handle("orbit:decks:create", (_event, input) =>
    deckRepo.createDeck(db, createDeckInputSchema.parse(input)),
  );

  ipcMain.handle("orbit:decks:get", (_event, deckId: string) =>
    requireFound(deckRepo.getDeck(db, deckId), "Deck not found."),
  );

  ipcMain.handle("orbit:decks:update", (_event, deckId: string, input) =>
    requireFound(
      deckRepo.updateDeck(db, deckId, updateDeckInputSchema.parse(input)),
      "Deck not found.",
    ),
  );

  ipcMain.handle("orbit:decks:delete", (_event, deckId: string) => deckRepo.deleteDeck(db, deckId));

  ipcMain.handle("orbit:decks:import-anki", (_event, input: IpcImportAnkiDecksInput) =>
    importAnkiDecks(db, input, options),
  );

  ipcMain.handle(
    "orbit:decks:list-cards",
    (_event, deckId: string, input: ListDeckCardsInput | undefined) =>
      requireFound(deckRepo.listDeckCards(db, deckId, input), "Deck not found."),
  );

  ipcMain.handle(
    "orbit:decks:list-note-types",
    (_event, deckId: string, input: PaginationInput | undefined) =>
      requireFound(deckRepo.listDeckNoteTypes(db, deckId, input), "Deck not found."),
  );

  ipcMain.handle(
    "orbit:decks:list-card-types",
    (_event, deckId: string, input: PaginationInput | undefined) =>
      requireFound(deckRepo.listDeckCardTypes(db, deckId, input), "Deck not found."),
  );
}

function importAnkiDecks(
  db: OrbitDatabase,
  input: IpcImportAnkiDecksInput,
  options: IpcRuntimeOptions,
) {
  if (!isSupportedAnkiFileName(input.fileName)) {
    throw new Error("Unsupported Anki file format. Use .apkg, .colpkg, .anki2, or .anki21.");
  }

  const workdir = mkdtempSync(join(tmpdir(), "orbit-anki-upload-"));
  const filePath = join(workdir, `import${extname(input.fileName).toLowerCase()}`);

  try {
    writeFileSync(filePath, Buffer.from(input.data));

    if (!isAnkiPackagePath(filePath)) {
      throw new Error("Uploaded file is not a supported Anki deck format.");
    }

    const result = deckRepo.importAnkiDecks(
      db,
      loadAnkiPackage(filePath, { nativeBinding: options.nativeBinding }),
    );

    if (result.deckCount === 0) {
      throw new Error("No importable Anki cards were found in this file.");
    }

    return result;
  } finally {
    rmSync(workdir, { force: true, recursive: true });
  }
}

function isSupportedAnkiFileName(fileName: string) {
  return [".apkg", ".colpkg", ".anki2", ".anki21"].includes(extname(fileName).toLowerCase());
}
