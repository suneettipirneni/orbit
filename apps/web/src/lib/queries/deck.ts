import { getDeck, listDecks } from "@orbit/api";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const deckQueryKeys = {
  all: ["decks"] as const,
  detail: (deckId: string) => [...deckQueryKeys.all, deckId] as const,
};

export function decksQueryOptions() {
  return queryOptions({
    queryFn: () => listDecks(apiClient),
    queryKey: deckQueryKeys.all,
  });
}

export function deckQueryOptions(deckId: string) {
  return queryOptions({
    enabled: Boolean(deckId),
    queryFn: () => getDeck(apiClient, deckId),
    queryKey: deckQueryKeys.detail(deckId),
  });
}
