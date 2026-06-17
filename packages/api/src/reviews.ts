import type { ApiClient } from "./api-client.js";
import type { CardWithNote } from "./cards.js";

export interface ReviewRating {
  value: 1 | 2 | 3 | 4 | 5;
}

export interface ReviewResult {
  card: CardWithNote;
  nextDueAt: string;
}

export interface DueCardsInput {
  deckId?: string;
}

export function listDueCards(client: ApiClient, input: DueCardsInput = {}) {
  const search = input.deckId ? `?deckId=${encodeURIComponent(input.deckId)}` : "";
  return client.get<CardWithNote[]>(`/reviews/due${search}`);
}

export function submitReview(client: ApiClient, cardId: string, rating: ReviewRating) {
  return client.post<ReviewRating, ReviewResult>(`/reviews/${cardId}`, rating);
}
