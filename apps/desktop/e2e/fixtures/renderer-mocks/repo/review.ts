import type { DueCardsInput, ReviewRating } from "@orbit/types";
import { getApi } from "../api";

export function listDueCards(input: DueCardsInput = {}) {
  return getApi().reviews.listDue(input);
}

export function getSchedulerStatus() {
  return getApi().reviews.schedulerStatus();
}

export function getTodayStudySummary() {
  return getApi().reviews.today();
}

export function submitReview(cardId: string, rating: ReviewRating) {
  return getApi().reviews.submit(cardId, rating);
}
