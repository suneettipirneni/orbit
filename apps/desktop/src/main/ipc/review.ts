import { ipcMain } from "electron";
import { reviewRatingSchema } from "@orbit/api";
import type { DueCardsInput } from "@orbit/api";
import type { Repositories } from "@orbit/db";
import { requireFound } from "./shared.js";

export function registerReviewIpcHandlers(repositories: Repositories) {
  ipcMain.handle("orbit:reviews:list-due", (_event, input: DueCardsInput | undefined) =>
    repositories.listDueCards(input),
  );

  ipcMain.handle("orbit:reviews:submit", (_event, cardId: string, rating) => {
    const parsedRating = reviewRatingSchema.parse(rating);
    const card = requireFound(
      repositories.submitReview(cardId, parsedRating.value),
      "Card not found.",
    );

    return {
      card,
      nextDueAt: card.dueAt,
    };
  });
}
