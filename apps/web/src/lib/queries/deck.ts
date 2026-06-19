import {
  getDeck,
  listDeckCards,
  listDecks,
  type ListDeckCardsInput,
  type PaginationInput,
} from "@orbit/api";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const deckQueryKeys = {
  all: ["decks"] as const,
  cards: (deckId: string, input: ListDeckCardsInput = {}) =>
    [
      ...deckQueryKeys.cardsLists(deckId),
      input.page ?? 1,
      input.pageSize ?? 50,
      input.query ?? "",
    ] as const,
  cardsLists: (deckId: string) => [...deckQueryKeys.detail(deckId), "cards"] as const,
  detail: (deckId: string) => [...deckQueryKeys.all, deckId] as const,
  list: (input: PaginationInput = {}) =>
    [...deckQueryKeys.lists(), input.page ?? 1, input.pageSize ?? 50] as const,
  lists: () => [...deckQueryKeys.all, "list"] as const,
};

export function decksQueryOptions(input: PaginationInput = {}) {
  return queryOptions({
    queryFn: () => listDecks(apiClient, input),
    queryKey: deckQueryKeys.list(input),
  });
}

export function deckCardsQueryOptions(deckId: string, input: ListDeckCardsInput = {}) {
  return queryOptions({
    enabled: Boolean(deckId),
    placeholderData: keepPreviousData,
    queryFn: () => listDeckCards(apiClient, deckId, input),
    queryKey: deckQueryKeys.cards(deckId, input),
  });
}

export function deckQueryOptions(deckId: string) {
  return queryOptions({
    enabled: Boolean(deckId),
    queryFn: () => getDeck(apiClient, deckId),
    queryKey: deckQueryKeys.detail(deckId),
  });
}
