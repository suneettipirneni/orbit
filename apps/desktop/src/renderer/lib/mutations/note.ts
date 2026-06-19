import {
  createNote,
  deleteNote,
  updateNote,
  type CreateNoteInput,
  type UpdateNoteInput,
} from "@orbit/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { cardQueryKeys } from "@/lib/queries/card";
import { deckQueryKeys } from "@/lib/queries/deck";
import { reviewQueryKeys } from "@/lib/queries/review";

export function useCreateNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(apiClient, input),
    onSuccess: (_note, { deckId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(deckId) }),
        queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all }),
      ]),
  });
}

export interface UpdateNoteMutationInput {
  input: UpdateNoteInput;
  noteId: string;
}

export function useUpdateNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, noteId }: UpdateNoteMutationInput) =>
      updateNote(apiClient, noteId, input),
    onSuccess: (note) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(note.deckId) }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.cardsLists(note.deckId) }),
        queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: cardQueryKeys.all }),
      ]),
  });
}

export function useDeleteNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId }: { deckId: string; noteId: string }) => deleteNote(apiClient, noteId),
    onSuccess: (_result, { deckId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(deckId) }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.cardsLists(deckId) }),
        queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: cardQueryKeys.all }),
      ]),
  });
}
