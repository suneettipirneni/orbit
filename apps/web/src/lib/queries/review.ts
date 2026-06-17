import { listDueCards, type DueCardsInput } from "@orbit/api";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const reviewQueryKeys = {
  all: ["reviews"] as const,
  due: (deckId?: string) => [...reviewQueryKeys.all, "due", deckId ?? "all"] as const,
};

export function dueCardsQueryOptions(input: DueCardsInput = {}) {
  return queryOptions({
    queryFn: () => listDueCards(apiClient, input),
    queryKey: reviewQueryKeys.due(input.deckId),
  });
}
