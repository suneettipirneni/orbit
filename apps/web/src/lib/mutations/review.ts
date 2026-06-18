import { submitReview, type ReviewRating } from "@orbit/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { cardQueryKeys } from "@/lib/queries/card";
import { deckQueryKeys } from "@/lib/queries/deck";
import { reviewQueryKeys } from "@/lib/queries/review";

export interface SubmitReviewMutationInput {
  cardId: string;
  rating: ReviewRating;
}

export function useSubmitReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, rating }: SubmitReviewMutationInput) =>
      submitReview(apiClient, cardId, rating),
    onSuccess: (result, { cardId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(result.card.deckId) }),
        queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: cardQueryKeys.detail(cardId) }),
      ]),
  });
}
