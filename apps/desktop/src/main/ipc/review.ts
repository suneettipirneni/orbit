import { ipcMain } from "electron";
import { reviewRatingSchema } from "@orbit/api";
import type { DueCardsInput } from "@orbit/api";
import type { OrbitDatabase } from "@orbit/db";
import * as cardRepo from "@orbit/db/card";
import { requireFound } from "./shared.js";

export function registerReviewIpcHandlers(db: OrbitDatabase) {
  ipcMain.handle("orbit:reviews:list-due", (_event, input: DueCardsInput | undefined) =>
    cardRepo.listDueCards(db, input),
  );

  ipcMain.handle("orbit:reviews:scheduler-status", () => cardRepo.getSchedulerStatus());

  ipcMain.handle("orbit:reviews:today", () => cardRepo.getTodayStudySummary(db));

  ipcMain.handle("orbit:reviews:submit", (_event, cardId: string, rating) => {
    const parsedRating = reviewRatingSchema.parse(rating);
    const card = requireFound(cardRepo.submitReview(db, cardId, parsedRating), "Card not found.");

    return {
      card,
      nextDueAt: card.dueAt,
    };
  });
}
