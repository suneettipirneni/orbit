import type { ListDeckCardsInput, PaginationInput } from "@orbit/types";
import { toCompilableQuery } from "@powersync/drizzle-driver";
import { useQuery as usePowerSyncQuery } from "@powersync/react";
import {
  allDecksCardScope,
  deckCardsQuery,
  deckDetailQuery,
  decksListQuery,
} from "@/lib/repo/deck";

export { allDecksCardScope };

export function useDecksQuery(input: PaginationInput = {}) {
  return usePowerSyncQuery(toCompilableQuery(decksListQuery(input)));
}

export function useDeckQuery(deckId: string) {
  const {
    data: [deck],
    ...query
  } = usePowerSyncQuery(toCompilableQuery(deckDetailQuery(deckId)));

  return { ...query, data: deck };
}

export function useDeckCardsQuery(deckId: string, input: ListDeckCardsInput = {}) {
  return usePowerSyncQuery(toCompilableQuery(deckCardsQuery(deckId, input)));
}

export function useCollectionCardsQuery(input: ListDeckCardsInput = {}) {
  return useDeckCardsQuery(allDecksCardScope, input);
}
