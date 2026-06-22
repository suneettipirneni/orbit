import { useDecksQuery } from "@/lib/queries/deck";
import { AddNoteDraftProvider, AddNoteForm } from "../decks.$deckId/add-note-draft-context";
import { DeckCardBrowser } from "../decks.$deckId/deck-card-browser";

export default function BrowsePage() {
  const { data: [decksPage] = [] } = useDecksQuery({ pageSize: 100 });
  const deckItems = decksPage?.data ?? [];
  const defaultDeck = deckItems[0];

  return (
    <AddNoteDraftProvider>
      {defaultDeck ? (
        <AddNoteForm deckId={defaultDeck.id} deckName={defaultDeck.name} deckOptions={deckItems} />
      ) : null}
      <DeckCardBrowser />
    </AddNoteDraftProvider>
  );
}
