import {
  createDeck,
  deleteDeck,
  updateDeck,
  type CreateDeckInput,
  type UpdateDeckInput,
} from "@orbit/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { deckQueryKeys } from "@/lib/queries/deck";
import { reviewQueryKeys } from "@/lib/queries/review";

export function useCreateDeckMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeckInput) => createDeck(apiClient, input),
    onSuccess: () => queryClient.invalidateQueries({ exact: true, queryKey: deckQueryKeys.all }),
  });
}

export interface UpdateDeckMutationInput {
  deckId: string;
  input: UpdateDeckInput;
}

export function useUpdateDeckMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deckId, input }: UpdateDeckMutationInput) =>
      updateDeck(apiClient, deckId, input),
    onSuccess: (_deck, { deckId }) =>
      Promise.all([
        queryClient.invalidateQueries({ exact: true, queryKey: deckQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(deckId) }),
        queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all }),
      ]),
  });
}

export function useDeleteDeckMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deckId: string) => deleteDeck(apiClient, deckId),
    onSuccess: (_result, deckId) =>
      Promise.all([
        queryClient.invalidateQueries({ exact: true, queryKey: deckQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(deckId) }),
        queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all }),
      ]),
  });
}
