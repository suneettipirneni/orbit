import { ipcMain } from "electron";
import { createNoteInputSchema, updateNoteInputSchema } from "@orbit/api";
import type { OrbitDatabase } from "@orbit/db";
import * as noteRepo from "@orbit/db/note";
import { requireFound } from "./shared.js";

export function registerNoteIpcHandlers(db: OrbitDatabase) {
  ipcMain.handle("orbit:notes:create", (_event, input) =>
    noteRepo.createNote(db, createNoteInputSchema.parse(input)),
  );

  ipcMain.handle("orbit:notes:update", (_event, noteId: string, input) =>
    requireFound(
      noteRepo.updateNote(db, noteId, updateNoteInputSchema.parse(input)),
      "Note not found.",
    ),
  );

  ipcMain.handle("orbit:notes:delete", (_event, noteId: string) => {
    noteRepo.deleteNote(db, noteId);
  });
}
