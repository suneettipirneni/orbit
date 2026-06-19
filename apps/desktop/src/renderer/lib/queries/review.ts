import {
  getSchedulerStatus,
  getTodayStudySummary,
  listDueCards,
  type DueCardsInput,
} from "@orbit/api";
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
  schedulerStatus: () => [...reviewQueryKeys.all, "scheduler-status"] as const,
  today: () => [...reviewQueryKeys.all, "today"] as const,
};

export function dueCardsQueryOptions(input: DueCardsInput = {}) {
  return queryOptions({
    queryFn: () => listDueCards(apiClient, input),
    queryKey: reviewQueryKeys.due(input),
  });
}

export function todayStudySummaryQueryOptions() {
  return queryOptions({
    queryFn: () => getTodayStudySummary(apiClient),
    queryKey: reviewQueryKeys.today(),
  });
}

export function schedulerStatusQueryOptions() {
  return queryOptions({
    queryFn: () => getSchedulerStatus(apiClient),
    queryKey: reviewQueryKeys.schedulerStatus(),
  });
}
