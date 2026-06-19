import { getCard } from "@orbit/api";
import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const cardQueryKeys = {
  all: ["cards"] as const,
  detail: (cardId: string) => [...cardQueryKeys.all, cardId] as const,
};

export function cardQueryOptions(cardId: string) {
  return queryOptions({
    enabled: Boolean(cardId),
    queryFn: () => getCard(apiClient, cardId),
    queryKey: cardQueryKeys.detail(cardId),
  });
}
