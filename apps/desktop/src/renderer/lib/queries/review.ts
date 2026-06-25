import type { DueCardsInput, SchedulerStatus } from "@orbit/types";
import { toCompilableQuery } from "@powersync/drizzle-driver";
import {
  useQuery as usePowerSyncQuery,
  useSuspenseQuery as usePowerSyncSuspenseQuery,
} from "@powersync/react";
import {
  dueCardsQuery,
  getSchedulerStatus,
  recentReviewActivityQuery,
  reviewHeatmapQuery,
  todayStudySummaryQuery,
  upcomingReviewDaysQuery,
} from "@/lib/repo/review";

export function useDueCardsQuery(input: DueCardsInput = {}) {
  return usePowerSyncQuery(toCompilableQuery(dueCardsQuery(input)));
}

export function useSuspenseDueCardsQuery(input: DueCardsInput = {}) {
  return usePowerSyncSuspenseQuery(toCompilableQuery(dueCardsQuery(input)));
}

export function useTodayStudySummaryQuery() {
  const {
    data: [summary],
    ...query
  } = usePowerSyncQuery(toCompilableQuery(todayStudySummaryQuery()));

  return { ...query, data: summary };
}

export function useSuspenseTodayStudySummaryQuery() {
  const {
    data: [summary],
    ...query
  } = usePowerSyncSuspenseQuery(toCompilableQuery(todayStudySummaryQuery()));

  return { ...query, data: summary };
}

export function useSuspenseRecentReviewActivityQuery(input: { limit?: number } = {}) {
  const {
    data: [activity],
    ...query
  } = usePowerSyncSuspenseQuery(toCompilableQuery(recentReviewActivityQuery(input)));

  return { ...query, data: activity ?? [] };
}

export function useSuspenseReviewHeatmapQuery(input: { days?: number } = {}) {
  const {
    data: [days],
    ...query
  } = usePowerSyncSuspenseQuery(toCompilableQuery(reviewHeatmapQuery(input)));

  return { ...query, data: days ?? [] };
}

export function useSuspenseUpcomingReviewDaysQuery(input: { days?: number } = {}) {
  const {
    data: [days],
    ...query
  } = usePowerSyncSuspenseQuery(toCompilableQuery(upcomingReviewDaysQuery(input)));

  return { ...query, data: days ?? [] };
}

export function useSchedulerStatusQuery() {
  return {
    data: getSchedulerStatus(),
    error: undefined,
    isFetching: false,
    isLoading: false,
  } satisfies {
    data: SchedulerStatus;
    error: undefined;
    isFetching: boolean;
    isLoading: boolean;
  };
}
