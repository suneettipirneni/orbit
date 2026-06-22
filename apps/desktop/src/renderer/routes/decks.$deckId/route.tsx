import { Outlet, useMatch } from "react-router";
import { DeckDetailWorkspace } from "./deck-detail-workspace";
import type { Route } from "./+types/route";

export default function DeckRoute({ params }: Route.ComponentProps) {
  const { deckId } = params;
  const reviewRoute = useMatch("/decks/:deckId/review");

  if (!deckId) {
    throw new Error("Deck id is required.");
  }

  if (reviewRoute) {
    return <Outlet key={deckId} />;
  }

  return <DeckDetailWorkspace key={deckId} deckId={deckId} />;
}
