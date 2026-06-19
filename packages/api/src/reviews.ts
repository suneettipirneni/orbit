import type { ApiClient } from "./api-client.js";
import type { CardWithNote } from "./cards.js";
import * as z from "zod/v4";
import {
  buildPaginationSearchParams,
  formatSearchParams,
  type PaginatedResponse,
  type PaginationInput,
} from "./pagination.js";

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

export function listDueCards(client: ApiClient, input: DueCardsInput = {}) {
  const searchParams = buildPaginationSearchParams(input);

  if (input.deckId) {
    searchParams.set("deckId", input.deckId);
  }

  return client.get<PaginatedResponse<CardWithNote>>(
    `/reviews/due${formatSearchParams(searchParams)}`,
  );
}

export function getTodayStudySummary(client: ApiClient) {
  return client.get<TodayStudySummary>("/reviews/today");
}

export function getSchedulerStatus(client: ApiClient) {
  return client.get<SchedulerStatus>("/reviews/scheduler-status");
}

export function submitReview(client: ApiClient, cardId: string, rating: ReviewRating) {
  return client.post<ReviewRating, ReviewResult>(`/reviews/${cardId}`, rating);
}
