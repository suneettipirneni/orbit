import { type ReactNode } from "react";
import { Play } from "lucide-react";
import { Link } from "react-router";
import type { DeckDetail } from "@orbit/types";
import { Button } from "@orbit/ui/components/button";
import { useSuspenseDeckQuery } from "@/lib/queries/deck";
import { DeckDetails } from "./deck-details";
import { DeckCards } from "./deck-cards";

export function DeckDetailWorkspace({ deckId }: { deckId: string }) {
  const { data: deck } = useSuspenseDeckQuery(deckId);

  if (!deck) {
    return (
      <section className="grid min-h-72 place-items-center rounded-lg border border-border bg-card p-8">
        <p className="text-muted-foreground">Deck not found.</p>
      </section>
    );
  }

  return (
    <DeckDetailContent cards={<DeckCards deckId={deckId} />} deckDetail={deck} deckId={deckId} />
  );
}

function DeckDetailContent({
  cards,
  deckDetail,
  deckId,
}: {
  cards: ReactNode;
  deckDetail: DeckDetail;
  deckId: string;
}) {
  return (
    <>
      <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <DeckDetails key={`${deckId}:${deckDetail.deck.updatedAt}`} deck={deckDetail.deck} />
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link to={`/decks/${deckId}/review`}>
              <Play className="size-4" />
              Review
            </Link>
          </Button>
        </div>
      </section>
      {cards}
    </>
  );
}
