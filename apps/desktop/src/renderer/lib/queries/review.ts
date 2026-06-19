import { listDueCards, type DueCardsInput } from "@orbit/api";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const reviewQueryKeys = {
  all: ["reviews"] as const,
  due: (input: DueCardsInput = {}) =>
    [
      ...reviewQueryKeys.dueLists(),
      input.deckId ?? "all",
      input.page ?? 1,
      input.pageSize ?? 50,
    ] as const,
  dueLists: () => [...reviewQueryKeys.all, "due"] as const,
};

export function dueCardsQueryOptions(input: DueCardsInput = {}) {
  return queryOptions({
    queryFn: () => listDueCards(apiClient, input),
    queryKey: reviewQueryKeys.due(input),
  });
}
