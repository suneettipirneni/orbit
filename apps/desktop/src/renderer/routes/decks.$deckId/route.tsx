import { DeckDetailWorkspace } from "./deck-detail-workspace";
import type { Route } from "./+types/route";

export default function DeckDetailPage({ params }: Route.ComponentProps) {
  return <DeckDetailWorkspace key={params.deckId} deckId={params.deckId} />;
}
