import { ipcMain } from "electron";
import { createNoteInputSchema, updateNoteInputSchema } from "@orbit/api";
import type { Repositories } from "@orbit/db";
import { requireFound } from "./shared.js";

export function registerNoteIpcHandlers(repositories: Repositories) {
  ipcMain.handle("orbit:notes:create", (_event, input) =>
    repositories.createNote(createNoteInputSchema.parse(input)),
  );

  ipcMain.handle("orbit:notes:update", (_event, noteId: string, input) =>
    requireFound(
      repositories.updateNote(noteId, updateNoteInputSchema.parse(input)),
      "Note not found.",
    ),
  );

  ipcMain.handle("orbit:notes:delete", (_event, noteId: string) => {
    repositories.deleteNote(noteId);
  });
}
