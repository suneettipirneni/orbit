import { useEffect, useState } from "react";
import type {
  CardPreview,
  DeckDetail,
  DeckSummary,
  ListDeckCardsInput,
  PaginatedResponse,
  PaginationInput,
} from "@orbit/types";
import { allDecksCardScope, getApi } from "../api";

export { allDecksCardScope };

export function useDecksQuery(input: PaginationInput = {}) {
  const [data, setData] = useState<Array<PaginatedResponse<DeckSummary>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const refresh = async () => {
    const response = await getApi().decks.list(input);

    setData([response]);
    setIsLoading(false);
  };

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    void getApi()
      .decks.list(input)
      .then((response) => {
        if (isCurrent) {
          setData([response]);
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [input.page, input.pageSize]);

  return { data, error: undefined, isFetching: isLoading, isLoading, refresh };
}

export function useDeckQuery(deckId: string) {
  const [data, setData] = useState<DeckDetail>();
  const [isLoading, setIsLoading] = useState(true);
  const refresh = async () => {
    const response = await getApi().decks.get(deckId);

    setData(response);
    setIsLoading(false);
  };

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    void getApi()
      .decks.get(deckId)
      .then((response) => {
        if (isCurrent) {
          setData(response);
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [deckId]);

  return { data, error: undefined, isFetching: isLoading, isLoading, refresh };
}

export function useDeckCardsQuery(deckId: string, input: ListDeckCardsInput = {}) {
  const [data, setData] = useState<Array<PaginatedResponse<CardPreview>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const refresh = async () => {
    const response = await getApi().decks.listCards(deckId, input);

    setData([response]);
    setIsLoading(false);
  };

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    void getApi()
      .decks.listCards(deckId, input)
      .then((response) => {
        if (isCurrent) {
          setData([response]);
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [deckId, input.page, input.pageSize, input.query, input.searchWithinFormatting]);

  return { data, error: undefined, isFetching: isLoading, isLoading, refresh };
}

export function useCollectionCardsQuery(input: ListDeckCardsInput = {}) {
  return useDeckCardsQuery(allDecksCardScope, input);
}
