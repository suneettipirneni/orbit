import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@orbit/ui/components/badge";
import { Button } from "@orbit/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orbit/ui/components/card";
import { useSubmitReviewMutation } from "@/lib/mutations/review";
import { dueCardsQueryOptions } from "@/lib/queries/review";
import { getRatingButtons, type ReviewSide } from "./review-flow";

export interface ReviewPanelProps {
  deckId?: string;
}

export function ReviewPanel({ deckId }: ReviewPanelProps) {
  const dueCards = useQuery(dueCardsQueryOptions({ deckId }));
  const currentCard = dueCards.data?.data[0];
  const review = useSubmitReviewMutation();
  const [answeredCardId, setAnsweredCardId] = useState<string>();
  const side: ReviewSide = currentCard?.id === answeredCardId ? "answer" : "question";

  function submitRating(value: 1 | 2 | 3 | 4 | 5) {
    if (!currentCard) {
      return;
    }

    review.mutate(
      {
        cardId: currentCard.id,
        rating: { value },
      },
      {
        onSuccess() {
          setAnsweredCardId(undefined);
        },
      },
    );
  }

  const ratingButtons = currentCard ? getRatingButtons(currentCard, side) : [];

  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Review</h2>
          <p className="text-sm text-muted-foreground">Practice due cards from the active deck.</p>
        </div>
        <Badge variant="outline">{dueCards.data?.pagination.total ?? 0} due</Badge>
      </div>

      {!currentCard ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          No cards are due.
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{currentCard.front}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {side === "answer" ? (
              <p className="min-h-24 rounded-md bg-muted p-3 leading-relaxed">{currentCard.back}</p>
            ) : null}
            {side === "question" ? (
              <Button onClick={() => setAnsweredCardId(currentCard.id)} type="button">
                Show Answer
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {ratingButtons.map((rating) => (
                  <Button
                    key={rating.value}
                    onClick={() => submitRating(rating.value)}
                    type="button"
                    variant={getRatingVariant(rating.label)}
                  >
                    {rating.label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function getRatingVariant(label: string) {
  switch (label) {
    case "Again":
      return "destructive";
    case "Hard":
      return "outline";
    case "Easy":
      return "secondary";
    default:
      return "default";
  }
}
