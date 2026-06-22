import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useDeckQuery, useDecksQuery } from "@/lib/queries/deck";
import {
  AddNoteDraftProvider,
  AddNoteForm,
  useAddNoteDraft,
} from "../decks.$deckId/add-note-draft-context";
import { ReviewPanel } from "../decks.$deckId/review-panel";
import type { Route } from "./+types/route";

export default function DeckReviewPage({ params }: Route.ComponentProps) {
  const { deckId } = params;

  if (!deckId) {
    throw new Error("Deck id is required.");
  }

  return (
    <AddNoteDraftProvider>
      <DeckReviewContent deckId={deckId} />
    </AddNoteDraftProvider>
  );
}

function DeckReviewContent({ deckId }: { deckId: string }) {
  const { data: deck } = useDeckQuery(deckId);
  const { data: [decksPage] = [] } = useDecksQuery({ pageSize: 100 });
  const { seedAddNoteDraft } = useAddNoteDraft();
  const [isFinished, setIsFinished] = useState(false);

  return (
    <>
      {isFinished ? (
        <section className="rounded-lg border border-dashed border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold tracking-normal">Review complete</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">No cards are due.</p>
        </section>
      ) : null}
      <ReviewPanel
        deckId={deckId}
        onCreateCopy={(card) => {
          seedAddNoteDraft({
            back: card.back,
            front: card.front,
          });
        }}
        onFinished={() => setIsFinished(true)}
      />
      {deck ? (
        <AddNoteForm
          deckId={deckId}
          deckName={deck.deck.name}
          deckOptions={decksPage?.data ?? []}
        />
      ) : null}
    </>
  );
}
