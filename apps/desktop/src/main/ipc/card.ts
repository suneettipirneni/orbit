import { ipcMain } from "electron";
import { updateCardInputSchema } from "@orbit/api";
import type { OrbitDatabase } from "@orbit/db";
import * as cardRepo from "@orbit/db/card";
import { requireFound } from "./shared.js";

export function registerCardIpcHandlers(db: OrbitDatabase) {
  ipcMain.handle("orbit:cards:get", (_event, cardId: string) =>
    requireFound(cardRepo.getCard(db, cardId), "Card not found."),
  );

  ipcMain.handle("orbit:cards:update", (_event, cardId: string, input) =>
    requireFound(
      cardRepo.updateCard(db, cardId, updateCardInputSchema.parse(input)),
      "Card not found.",
    ),
  );
}
