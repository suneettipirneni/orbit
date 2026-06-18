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
    value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  })
  .strict();

export type ReviewRating = z.infer<typeof reviewRatingSchema>;

export interface ReviewResult {
  card: CardWithNote;
  nextDueAt: string;
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

export function submitReview(client: ApiClient, cardId: string, rating: ReviewRating) {
  return client.post<ReviewRating, ReviewResult>(`/reviews/${cardId}`, rating);
}
