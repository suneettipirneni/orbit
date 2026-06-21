import type { DeckSummary } from "@orbit/types";
import { createContext, useContext, useState, type ReactNode } from "react";
import { CardForm, type CardFormInitialValues } from "./card-form";

interface AddNoteDraft extends CardFormInitialValues {
  version: number;
}

interface AddNoteDraftContextValue {
  draft: AddNoteDraft;
  seedAddNoteDraft: (draft: CardFormInitialValues) => void;
}

const AddNoteDraftContext = createContext<AddNoteDraftContextValue | null>(null);

export function AddNoteDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<AddNoteDraft>({
    back: "",
    front: "",
    version: 0,
  });

  const seedAddNoteDraft = (nextDraft: CardFormInitialValues) => {
    setDraft((current) => ({
      ...nextDraft,
      version: current.version + 1,
    }));
  };

  return (
    <AddNoteDraftContext.Provider value={{ draft, seedAddNoteDraft }}>
      {children}
    </AddNoteDraftContext.Provider>
  );
}

export function AddNoteForm({
  deckId,
  deckName,
  deckOptions,
}: {
  deckId: string;
  deckName: string;
  deckOptions: DeckSummary[];
}) {
  const { draft } = useAddNoteDraft();

  return (
    <CardForm
      key={draft.version}
      deckId={deckId}
      deckName={deckName}
      deckOptions={deckOptions}
      initialValues={draft}
    />
  );
}

export function useAddNoteDraft() {
  const context = useContext(AddNoteDraftContext);

  if (!context) {
    throw new Error("useAddNoteDraft must be used within AddNoteDraftProvider");
  }

  return context;
}
