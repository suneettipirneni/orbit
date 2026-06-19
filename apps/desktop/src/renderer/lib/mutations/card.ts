import { updateCard, type UpdateCardInput } from "@orbit/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { cardQueryKeys } from "@/lib/queries/card";
import { deckQueryKeys } from "@/lib/queries/deck";
import { reviewQueryKeys } from "@/lib/queries/review";

export interface UpdateCardMutationInput {
  cardId: string;
  deckId: string;
  input: UpdateCardInput;
}

export function useUpdateCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, input }: UpdateCardMutationInput) =>
      updateCard(apiClient, cardId, input),
    onSuccess: (card, { cardId, deckId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: cardQueryKeys.detail(cardId) }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(deckId) }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(card.deckId) }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.cardsLists(deckId) }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.cardsLists(card.deckId) }),
        queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all }),
      ]),
  });
}
