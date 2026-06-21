import { useEffect, useState } from "react";
import type {
  CardWithNote,
  DueCardsInput,
  PaginatedResponse,
  SchedulerStatus,
  TodayStudySummary,
} from "@orbit/types";
import { getApi } from "../api";

export function useDueCardsQuery(input: DueCardsInput = {}) {
  const [data, setData] = useState<Array<PaginatedResponse<CardWithNote>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const refresh = async () => {
    const response = await getApi().reviews.listDue(input);

    setData([response]);
    setIsLoading(false);
  };

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    void getApi()
      .reviews.listDue(input)
      .then((response) => {
        if (isCurrent) {
          setData([response]);
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [input.deckId, input.page, input.pageSize]);

  return { data, error: undefined, isFetching: isLoading, isLoading, refresh };
}

export function useTodayStudySummaryQuery() {
  const [data, setData] = useState<TodayStudySummary>();
  const [isLoading, setIsLoading] = useState(true);
  const refresh = async () => {
    const response = await getApi().reviews.today();

    setData(response);
    setIsLoading(false);
  };

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    void getApi()
      .reviews.today()
      .then((response) => {
        if (isCurrent) {
          setData(response);
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return { data, error: undefined, isFetching: isLoading, isLoading, refresh };
}

export function useSchedulerStatusQuery() {
  const [data, setData] = useState<SchedulerStatus>({ upgradeRequired: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    void getApi()
      .reviews.schedulerStatus()
      .then((response) => {
        if (isCurrent) {
          setData(response);
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return { data, error: undefined, isFetching: isLoading, isLoading };
}
