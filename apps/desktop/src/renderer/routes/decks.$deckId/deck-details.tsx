import type { Deck } from "@orbit/types";
import { Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@orbit/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@orbit/ui/components/dialog";
import { Input } from "@orbit/ui/components/input";
import { Textarea } from "@orbit/ui/components/textarea";
import { updateDeck } from "@/lib/repo/deck";

export interface DeckDetailsProps {
  deck: Deck;
}

export function DeckDetails({ deck }: DeckDetailsProps) {
  const [descriptionDraft, setDescriptionDraft] = useState(deck.description ?? "");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nameDraft, setNameDraft] = useState(deck.name);
  const normalizedName = nameDraft.trim();
  const normalizedDescription = descriptionDraft.trim() || null;
  const canSave =
    normalizedName.length > 0 &&
    (normalizedName !== deck.name || normalizedDescription !== deck.description);
  const openEditDialog = () => {
    setNameDraft(deck.name);
    setDescriptionDraft(deck.description ?? "");
    setIsEditOpen(true);
  };

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h1 className="truncate text-2xl font-semibold tracking-normal">{deck.name}</h1>
        <Button
          aria-label="Edit deck"
          onClick={openEditDialog}
          size="sm"
          type="button"
          variant="outline"
        >
          <Pencil className="size-4" />
          Edit
        </Button>
      </div>
      {deck.description ? (
        <div
          aria-label="Deck description"
          className="mt-2 grid max-w-3xl gap-1 whitespace-pre-wrap text-sm text-muted-foreground"
        >
          {renderDeckDescription(deck.description)}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No description.</p>
      )}
      {deck.isFiltered ? (
        <p className="mt-2 text-sm text-muted-foreground">
          This filtered deck temporarily gathers cards for study; cards return to their original
          decks after review or when emptied.
        </p>
      ) : null}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit deck</DialogTitle>
            <DialogDescription>Change the deck name and description.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();

              if (!canSave) {
                return;
              }

              setIsSaving(true);
              void updateDeck(deck.id, {
                description: normalizedDescription,
                name: normalizedName,
              })
                .then(() => setIsEditOpen(false))
                .finally(() => setIsSaving(false));
            }}
          >
            <label className="grid gap-1 text-sm font-medium" htmlFor="edit-deck-name">
              Deck name
              <Input
                id="edit-deck-name"
                onChange={(event) => setNameDraft(event.currentTarget.value)}
                value={nameDraft}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium" htmlFor="edit-deck-description">
              Description
              <Textarea
                id="edit-deck-description"
                onChange={(event) => setDescriptionDraft(event.currentTarget.value)}
                value={descriptionDraft}
              />
            </label>
            <DialogFooter className="-mx-4 -mb-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button disabled={isSaving || !canSave} type="submit">
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function renderDeckDescription(description: string) {
  return description
    .split(/\n{2,}/)
    .map((paragraph, index) => (
      <p key={`${paragraph}-${index}`}>{renderMarkdownInline(paragraph)}</p>
    ));
}

function renderMarkdownInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**") && segment.length > 4) {
      return <strong key={`${segment}-${index}`}>{segment.slice(2, -2)}</strong>;
    }

    return segment;
  });
}
