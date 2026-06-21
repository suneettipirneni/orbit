import type { CardWithNote } from "./cards.js";
import * as z from "zod/v4";
import type { PaginationInput } from "./pagination.js";

export const reviewRatingSchema = z
  .object({
    elapsedMilliseconds: z.int().min(0).optional(),
    value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  })
  .strict();

export type ReviewRating = z.infer<typeof reviewRatingSchema>;

export interface ReviewResult {
  card: CardWithNote;
  nextDueAt: string;
}

export interface TodayStudySummary {
  elapsedSeconds: number;
  studiedCards: number;
}

export interface SchedulerStatus {
  upgradeRequired: boolean;
}

export interface DueCardsInput extends PaginationInput {
  deckId?: string;
}
