import type { CardPreview, DeckSummary } from "@orbit/types";
import { useState } from "react";
import { Button } from "@orbit/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@orbit/ui/components/dropdown-menu";
import { Textarea } from "@orbit/ui/components/textarea";
import { formatDueDate } from "@/lib/date-format";
import { getCardStateName, getFlagName } from "./browser-card-state";

export function SelectedNoteEditor({
  card,
  deckOptions,
  isDeleting,
  isSaving,
  isUpdatingCard,
  noteTypeName,
  onAddTag,
  onBury,
  onChangeDeck,
  onDelete,
  onForget,
  onRemoveTag,
  onReposition,
  onSave,
  onSetDueDate,
  onSetMarked,
  onToggleSuspend,
  onUpdateFlag,
}: {
  card: CardPreview | undefined;
  deckOptions: DeckSummary[];
  isDeleting: boolean;
  isSaving: boolean;
  isUpdatingCard: boolean;
  noteTypeName: string;
  onAddTag: (tag: string) => void;
  onBury: () => void;
  onChangeDeck: (deckId: string) => void;
  onDelete: () => void;
  onForget: () => void;
  onRemoveTag: (tag: string) => void;
  onReposition: (position: number) => void;
  onSave: (input: { back: string; front: string }) => void;
  onSetDueDate: (dueAt: string) => void;
  onSetMarked: (marked: boolean) => void;
  onToggleSuspend: () => void;
  onUpdateFlag: (flag: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
}) {
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [dueDate, setDueDate] = useState(card?.dueAt.slice(0, 10) ?? "");
  const [position, setPosition] = useState(card?.ankiDue?.toString() ?? "");
  const [targetDeckId, setTargetDeckId] = useState(card?.deckId ?? "");
  const [tagDraft, setTagDraft] = useState("");
  const isSuspended = card?.ankiQueue === -1;
  const noteTags = card?.ankiTags ?? [];
  const isMarked = noteTags.includes("marked");
  const normalizedTagDraft = tagDraft.trim();
  const userFlag = (card?.ankiFlags ?? 0) & 7;

  return (
    <section
      aria-label="Selected note editor"
      className="grid gap-3 rounded-lg border border-border p-4"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-normal">Editor</h2>
        <p className="text-sm text-muted-foreground">
          {card ? "Edit the selected note fields." : "Select a row to edit its note."}
        </p>
      </div>
      {card ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSave({ back, front });
          }}
        >
          <label className="grid gap-1 text-sm font-medium" htmlFor="selected-note-front">
            Front
            <Textarea
              aria-label="Selected note front"
              id="selected-note-front"
              onChange={(event) => setFront(event.currentTarget.value)}
              value={front}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium" htmlFor="selected-note-back">
            Back
            <Textarea
              aria-label="Selected note back"
              id="selected-note-back"
              onChange={(event) => setBack(event.currentTarget.value)}
              value={back}
            />
          </label>
          <p className="text-sm text-muted-foreground">Flag: {getFlagName(userFlag)}</p>
          <p className="text-sm text-muted-foreground">Note type: {noteTypeName}</p>
          <p className="text-sm text-muted-foreground">
            Tags: {noteTags.length ? noteTags.join(" ") : "none"}
          </p>
          <p className="text-sm text-muted-foreground">Deck: {card.deckName}</p>
          <p className="text-sm text-muted-foreground">
            Position: {card.ankiDue ?? <span className="text-muted-foreground">-</span>}
          </p>
          <p className="text-sm text-muted-foreground">State: {getCardStateName(card)}</p>
          <p className="text-sm text-muted-foreground">Due: {formatDueDate(card.dueAt)}</p>
          <div className="grid gap-2">
            <label className="grid gap-1 text-sm font-medium" htmlFor="selected-card-position">
              Position
              <input
                aria-label="Selected card position"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="selected-card-position"
                min={0}
                onChange={(event) => setPosition(event.currentTarget.value)}
                type="number"
                value={position}
              />
            </label>
            <div>
              <Button
                disabled={isUpdatingCard || !position}
                onClick={() => onReposition(Number(position))}
                size="sm"
                type="button"
                variant="outline"
              >
                Reposition card
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="grid gap-1 text-sm font-medium" htmlFor="selected-cards-target-deck">
              Target deck
              <select
                aria-label="Selected cards target deck"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="selected-cards-target-deck"
                onChange={(event) => setTargetDeckId(event.currentTarget.value)}
                value={targetDeckId}
              >
                {deckOptions.map((deckOption) => (
                  <option key={deckOption.id} value={deckOption.id}>
                    {deckOption.name}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <Button
                disabled={isUpdatingCard || !targetDeckId || targetDeckId === card.deckId}
                onClick={() => onChangeDeck(targetDeckId)}
                size="sm"
                type="button"
                variant="outline"
              >
                Change deck
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="grid gap-1 text-sm font-medium" htmlFor="selected-note-tag">
              Tag
              <input
                aria-label="Selected note tag"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="selected-note-tag"
                onChange={(event) => setTagDraft(event.currentTarget.value)}
                value={tagDraft}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={isSaving || !normalizedTagDraft}
                onClick={() => {
                  onAddTag(normalizedTagDraft);
                  setTagDraft("");
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                Add tag
              </Button>
              <Button
                disabled={isSaving || !normalizedTagDraft}
                onClick={() => {
                  onRemoveTag(normalizedTagDraft);
                  setTagDraft("");
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                Remove tag
              </Button>
              <Button
                disabled={isSaving}
                onClick={() => onSetMarked(!isMarked)}
                size="sm"
                type="button"
                variant="outline"
              >
                {isMarked ? "Unmark note" : "Mark note"}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="grid gap-1 text-sm font-medium" htmlFor="selected-card-due-date">
              Due date
              <input
                aria-label="Selected card due date"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="selected-card-due-date"
                onChange={(event) => setDueDate(event.currentTarget.value)}
                type="date"
                value={dueDate}
              />
            </label>
            <div>
              <Button
                disabled={isUpdatingCard || !dueDate}
                onClick={() => onSetDueDate(`${dueDate}T10:00:00.000Z`)}
                size="sm"
                type="button"
                variant="outline"
              >
                Set due date
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <Button disabled={isDeleting} onClick={onDelete} type="button" variant="destructive">
              Delete note
            </Button>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline">
                    Flag card
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => onUpdateFlag(1)}>Red</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onUpdateFlag(0)}>Clear flag</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                disabled={isUpdatingCard}
                onClick={onToggleSuspend}
                type="button"
                variant="outline"
              >
                {isSuspended ? "Unsuspend card" : "Suspend card"}
              </Button>
              <Button disabled={isUpdatingCard} onClick={onForget} type="button" variant="outline">
                Forget card
              </Button>
              <Button disabled={isUpdatingCard} onClick={onBury} type="button" variant="outline">
                Bury card
              </Button>
              <Button disabled={isSaving || !front.trim() || !back.trim()} type="submit">
                Save note
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  );
}
