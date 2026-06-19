import { ipcMain } from "electron";
import { updateCardInputSchema } from "@orbit/api";
import type { Repositories } from "@orbit/db";
import { requireFound } from "./shared.js";

export function registerCardIpcHandlers(repositories: Repositories) {
  ipcMain.handle("orbit:cards:get", (_event, cardId: string) =>
    requireFound(repositories.getCard(cardId), "Card not found."),
  );

  ipcMain.handle("orbit:cards:update", (_event, cardId: string, input) =>
    requireFound(
      repositories.updateCard(cardId, updateCardInputSchema.parse(input)),
      "Card not found.",
    ),
  );
}
