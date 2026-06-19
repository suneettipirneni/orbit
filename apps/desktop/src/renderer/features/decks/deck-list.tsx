import type { DeckSummary } from "@orbit/api";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  LibraryBig,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Trash,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@orbit/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@orbit/ui/components/dropdown-menu";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@orbit/ui/components/field";
import { Input } from "@orbit/ui/components/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@orbit/ui/components/sidebar";
import {
  useCreateDeckMutation,
  useDeleteDeckMutation,
  useImportAnkiDecksMutation,
  useUpdateDeckMutation,
} from "@/lib/mutations/deck";
import { decksQueryOptions } from "@/lib/queries/deck";
import { schedulerStatusQueryOptions, todayStudySummaryQueryOptions } from "@/lib/queries/review";

const ankiImportAccept = ".apkg,.colpkg,.anki2,.anki21,application/zip,application/octet-stream";

export interface DeckListProps {
  onSelectDeck: (deckId: string) => void;
  selectedDeckId?: string;
}

interface DeckFormValues {
  name: string;
}

interface DeckCountSummary {
  dueCards: number;
  learningCards: number;
  newCards: number;
  reviewCards: number;
  totalCards: number;
}

interface DeckTreeRow {
  aggregateCounts: DeckCountSummary;
  deck: DeckSummary;
  depth: number;
  displayName: string;
  hasChildren: boolean;
}

type DeckDialogState =
  | { deck: DeckSummary; type: "delete" | "export" | "options" | "rename" }
  | undefined;

export function DeckList({ onSelectDeck, selectedDeckId }: DeckListProps) {
  "use no memo";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [collapsedDeckIds, setCollapsedDeckIds] = useState<Set<string>>(() => new Set());
  const [deckDialog, setDeckDialog] = useState<DeckDialogState>();
  const [draggedDeckId, setDraggedDeckId] = useState<string>();
  const [deckMessage, setDeckMessage] = useState<string>();
  const [importError, setImportError] = useState<string>();
  const form = useForm<DeckFormValues>({
    defaultValues: {
      name: "",
    },
  });
  const decks = useQuery(decksQueryOptions());
  const schedulerStatus = useQuery(schedulerStatusQueryOptions());
  const todayStudySummary = useQuery(todayStudySummaryQueryOptions());
  const deckItems = decks.data?.data ?? [];
  const deckTreeRows = buildDeckTreeRows(deckItems, collapsedDeckIds);
  const registerName = form.register("name");
  const createDeck = useCreateDeckMutation();
  const deleteDeck = useDeleteDeckMutation();
  const importAnkiDecks = useImportAnkiDecksMutation();
  const updateDeck = useUpdateDeckMutation();
  const moveDeck = (deckId: string | undefined, targetDeck?: DeckSummary) => {
    const deck = deckItems.find((deckOption) => deckOption.id === deckId);

    if (!deck || deck.id === targetDeck?.id) {
      return;
    }

    if (targetDeck && targetDeck.name.startsWith(`${deck.name}::`)) {
      return;
    }

    const deckLeafName = getDeckLeafName(deck.name);
    const nextName = targetDeck ? `${targetDeck.name}::${deckLeafName}` : deckLeafName;

    if (nextName === deck.name) {
      return;
    }

    updateDeck.mutate({ deckId: deck.id, input: { name: nextName } });
  };
  const getDraggedDeckId = (event: React.DragEvent) =>
    event.dataTransfer.getData("application/x-orbit-deck-id") || draggedDeckId;
  const toggleDeckCollapsed = (deckId: string) => {
    setCollapsedDeckIds((current) => {
      const next = new Set(current);

      if (next.has(deckId)) {
        next.delete(deckId);
      } else {
        next.add(deckId);
      }

      return next;
    });
  };
  const submitDeckForm = form.handleSubmit((values) => {
    if (values.name.trim()) {
      createDeck.mutate(values, {
        onSuccess: (deck) => {
          form.reset();
          onSelectDeck(deck.id);
        },
      });
    }
  });
  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    setImportError(undefined);
    importAnkiDecks.mutate(
      { file },
      {
        onError(error) {
          setImportError(error instanceof Error ? error.message : "Anki import failed.");
        },
        onSuccess(result) {
          const firstDeck = result.decks[0];

          if (firstDeck) {
            onSelectDeck(firstDeck.id);
          }
        },
      },
    );
    event.currentTarget.value = "";
  };

  return (
    <Sidebar aria-label="Deck library" collapsible="icon" data-testid="deck-library">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Orbit">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LibraryBig className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Orbit</span>
                <span className="truncate text-xs text-muted-foreground">Decks and reviews</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Decks</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {deckItems.length > 0 ? (
                <SidebarMenuItem>
                  <div className="ml-8 grid grid-cols-3 gap-1 px-2 pb-1 text-[0.6875rem] font-medium text-muted-foreground">
                    <span>New</span>
                    <span>Learn</span>
                    <span>Review</span>
                  </div>
                </SidebarMenuItem>
              ) : null}
              {deckTreeRows.map((row) => (
                <DeckMenuItem
                  deck={{
                    ...row.deck,
                    ...row.aggregateCounts,
                  }}
                  depth={row.depth}
                  displayName={row.displayName}
                  hasChildren={row.hasChildren}
                  isActive={row.deck.id === selectedDeckId}
                  isCollapsed={collapsedDeckIds.has(row.deck.id)}
                  key={row.deck.id}
                  onDragEnd={() => setDraggedDeckId(undefined)}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("application/x-orbit-deck-id", row.deck.id);
                    setDraggedDeckId(row.deck.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    moveDeck(getDraggedDeckId(event), row.deck);
                    setDraggedDeckId(undefined);
                  }}
                  onOpenDialog={(type) => setDeckDialog({ deck: row.deck, type })}
                  onSelectDeck={onSelectDeck}
                  onToggleCollapsed={() => toggleDeckCollapsed(row.deck.id)}
                />
              ))}
              <SidebarMenuItem>
                <div
                  aria-label="Move deck to top level"
                  className="mx-2 mt-2 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground group-data-[collapsible=icon]:hidden"
                  data-testid="deck-top-level-drop-target"
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    moveDeck(getDraggedDeckId(event));
                    setDraggedDeckId(undefined);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  Top level
                </div>
              </SidebarMenuItem>
              {decks.data?.pagination.total === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2 py-3 text-sm text-muted-foreground">No decks yet.</div>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
            {schedulerStatus.data?.upgradeRequired ? <SchedulerUpgradeCallout /> : null}
            {todayStudySummary.data && todayStudySummary.data.studiedCards > 0 ? (
              <div
                className="mt-3 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden"
                data-testid="studied-today-summary"
              >
                <span className="font-medium text-foreground">
                  {formatStudiedCardCount(todayStudySummary.data.studiedCards)}
                </span>{" "}
                studied today · {formatElapsedReviewTime(todayStudySummary.data.elapsedSeconds)}{" "}
                review time
              </div>
            ) : null}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="grid gap-2 group-data-[collapsible=icon]:hidden">
          <input
            accept={ankiImportAccept}
            className="hidden"
            onChange={handleImportFileChange}
            ref={fileInputRef}
            type="file"
          />
          <Button
            disabled={importAnkiDecks.isPending}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Upload className="size-4" />
            {importAnkiDecks.isPending ? "Importing..." : "Import Anki"}
          </Button>
          {importError ? <p className="text-xs text-destructive">{importError}</p> : null}
          {deckMessage ? <p className="text-xs text-muted-foreground">{deckMessage}</p> : null}
        </div>
        <form
          className="grid gap-2 group-data-[collapsible=icon]:hidden"
          onSubmit={(event) => {
            void submitDeckForm(event);
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="deck-name">New deck</FieldLabel>
              <FieldContent className="flex flex-row gap-2">
                <Input id="deck-name" placeholder="Biology" {...registerName} />
                <Button aria-label="Create deck" size="icon" type="submit">
                  <Plus className="size-4" />
                </Button>
              </FieldContent>
            </Field>
          </FieldGroup>
        </form>
      </SidebarFooter>
      <SidebarRail />
      {deckDialog?.type === "rename" ? (
        <RenameDeckDialog
          deck={deckDialog.deck}
          isSaving={updateDeck.isPending}
          onClose={() => setDeckDialog(undefined)}
          onRename={(name) => {
            updateDeck.mutate(
              { deckId: deckDialog.deck.id, input: { name } },
              { onSuccess: () => setDeckDialog(undefined) },
            );
          }}
        />
      ) : null}
      {deckDialog?.type === "options" ? (
        <DeckOptionsDialog deck={deckDialog.deck} onClose={() => setDeckDialog(undefined)} />
      ) : null}
      {deckDialog?.type === "export" ? (
        <ExportDeckDialog deck={deckDialog.deck} onClose={() => setDeckDialog(undefined)} />
      ) : null}
      {deckDialog?.type === "delete" ? (
        <DeleteDeckDialog
          deck={deckDialog.deck}
          isDeleting={deleteDeck.isPending}
          onClose={() => setDeckDialog(undefined)}
          onDelete={() => {
            const deletedDeckName = deckDialog.deck.name;

            deleteDeck.mutate(deckDialog.deck.id, {
              onSuccess(result) {
                setDeckDialog(undefined);
                setDeckMessage(`Deleted ${result.deletedCards} cards with ${deletedDeckName}.`);
              },
            });
          }}
        />
      ) : null}
    </Sidebar>
  );
}

function buildDeckTreeRows(
  decks: DeckSummary[],
  collapsedDeckIds: ReadonlySet<string>,
): DeckTreeRow[] {
  const deckByName = new Map(decks.map((deck) => [deck.name, deck]));
  const childDecksByParentName = new Map<string, DeckSummary[]>();

  for (const deck of decks) {
    const parentName = getParentDeckName(deck.name);

    if (!parentName || !deckByName.has(parentName)) {
      continue;
    }

    const childDecks = childDecksByParentName.get(parentName) ?? [];
    childDecks.push(deck);
    childDecksByParentName.set(parentName, childDecks);
  }

  return decks
    .filter((deck) => !hasCollapsedAncestor(deck, deckByName, collapsedDeckIds))
    .map((deck) => {
      const depth = getDeckDepth(deck, deckByName);

      return {
        aggregateCounts: getAggregateCounts(deck, decks),
        deck,
        depth,
        displayName: depth > 0 ? getDeckLeafName(deck.name) : deck.name,
        hasChildren: (childDecksByParentName.get(deck.name)?.length ?? 0) > 0,
      };
    });
}

function getAggregateCounts(deck: DeckSummary, decks: DeckSummary[]): DeckCountSummary {
  const descendantPrefix = `${deck.name}::`;

  return decks.reduce(
    (counts, deckOption) => {
      if (deckOption.name !== deck.name && !deckOption.name.startsWith(descendantPrefix)) {
        return counts;
      }

      return {
        dueCards: counts.dueCards + deckOption.dueCards,
        learningCards: counts.learningCards + deckOption.learningCards,
        newCards: counts.newCards + deckOption.newCards,
        reviewCards: counts.reviewCards + deckOption.reviewCards,
        totalCards: counts.totalCards + deckOption.totalCards,
      };
    },
    {
      dueCards: 0,
      learningCards: 0,
      newCards: 0,
      reviewCards: 0,
      totalCards: 0,
    },
  );
}

function getDeckDepth(deck: DeckSummary, deckByName: ReadonlyMap<string, DeckSummary>) {
  const pathSegments = getDeckPathSegments(deck.name);
  let depth = 0;

  for (let index = 1; index < pathSegments.length; index += 1) {
    const ancestorName = pathSegments.slice(0, index).join("::");

    if (deckByName.has(ancestorName)) {
      depth += 1;
    }
  }

  return depth;
}

function hasCollapsedAncestor(
  deck: DeckSummary,
  deckByName: ReadonlyMap<string, DeckSummary>,
  collapsedDeckIds: ReadonlySet<string>,
) {
  const pathSegments = getDeckPathSegments(deck.name);

  for (let index = 1; index < pathSegments.length; index += 1) {
    const ancestorName = pathSegments.slice(0, index).join("::");
    const ancestorDeck = deckByName.get(ancestorName);

    if (ancestorDeck && collapsedDeckIds.has(ancestorDeck.id)) {
      return true;
    }
  }

  return false;
}

function getParentDeckName(deckName: string) {
  const pathSegments = getDeckPathSegments(deckName);

  if (pathSegments.length <= 1) {
    return undefined;
  }

  return pathSegments.slice(0, -1).join("::");
}

function getDeckLeafName(deckName: string) {
  const pathSegments = getDeckPathSegments(deckName);

  return pathSegments.at(-1) ?? deckName;
}

function getDeckPathSegments(deckName: string) {
  return deckName.split("::").filter(Boolean);
}

function formatStudiedCardCount(studiedCards: number) {
  return `${studiedCards} ${studiedCards === 1 ? "card" : "cards"}`;
}

function formatElapsedReviewTime(elapsedSeconds: number) {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  if (minutes > 0 && seconds > 0) {
    return `${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
}

function SchedulerUpgradeCallout() {
  return (
    <section
      aria-label="Scheduler upgrade required"
      className="mt-3 grid gap-2 rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-xs text-amber-950 group-data-[collapsible=icon]:hidden dark:bg-amber-950/30 dark:text-amber-100"
      data-testid="scheduler-upgrade-callout"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold tracking-normal">Scheduler upgrade required</h3>
          <p>Update this collection before studying with the current scheduler.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="button">
          Update scheduler
        </Button>
        <Button size="sm" type="button" variant="outline">
          More info
        </Button>
      </div>
    </section>
  );
}

function DeckMenuItem({
  deck,
  depth,
  displayName,
  hasChildren,
  isActive,
  isCollapsed,
  onDragEnd,
  onDragStart,
  onDrop,
  onOpenDialog,
  onSelectDeck,
  onToggleCollapsed,
}: {
  deck: DeckSummary;
  depth: number;
  displayName: string;
  hasChildren: boolean;
  isActive: boolean;
  isCollapsed: boolean;
  onDragEnd: () => void;
  onDragStart: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onOpenDialog: (type: "delete" | "export" | "options" | "rename") => void;
  onSelectDeck: (deckId: string) => void;
  onToggleCollapsed: () => void;
}) {
  const indent = depth * 16;

  return (
    <SidebarMenuItem
      data-testid={`deck-row-${deck.id}`}
      draggable
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-1" style={{ paddingLeft: `${indent}px` }}>
        {hasChildren ? (
          <Button
            aria-expanded={!isCollapsed}
            aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${displayName}`}
            className="group-data-[collapsible=icon]:hidden"
            onClick={onToggleCollapsed}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        ) : (
          <span
            aria-hidden="true"
            className="size-7 shrink-0 group-data-[collapsible=icon]:hidden"
          />
        )}
        <SidebarMenuButton
          isActive={isActive}
          aria-current={isActive ? "page" : undefined}
          onClick={() => onSelectDeck(deck.id)}
          tooltip={deck.name}
          type="button"
        >
          <BookOpen className="size-4" />
          <span className="truncate">{displayName}</span>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Deck actions for ${deck.name}`}
              className="group-data-[collapsible=icon]:hidden"
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onOpenDialog("rename")}>
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenDialog("options")}>
              <Settings className="size-4" />
              Options
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenDialog("export")}>
              <Download className="size-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenDialog("delete")}>
              <Trash className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SidebarMenuBadge className="tabular-nums">{deck.dueCards}</SidebarMenuBadge>
      <div className="ml-8 grid grid-cols-3 gap-1 px-2 pb-1 text-[0.6875rem] text-muted-foreground">
        <span className="tabular-nums">New {deck.newCards}</span>
        <span className="tabular-nums">Learn {deck.learningCards}</span>
        <span className="tabular-nums">Review {deck.reviewCards}</span>
      </div>
    </SidebarMenuItem>
  );
}

function RenameDeckDialog({
  deck,
  isSaving,
  onClose,
  onRename,
}: {
  deck: DeckSummary;
  isSaving: boolean;
  onClose: () => void;
  onRename: (name: string) => void;
}) {
  const [name, setName] = useState(deck.name);
  const normalizedName = name.trim();
  const canSave = normalizedName.length > 0 && normalizedName !== deck.name;

  return (
    <section
      aria-label="Rename Deck"
      className="fixed top-20 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-normal">Rename Deck</h2>
        <Button
          aria-label="Close rename deck"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();

          if (canSave) {
            onRename(normalizedName);
          }
        }}
      >
        <label className="grid gap-1 text-sm font-medium" htmlFor="rename-deck-name">
          Deck name
          <Input
            id="rename-deck-name"
            onChange={(event) => setName(event.currentTarget.value)}
            value={name}
          />
        </label>
        <div className="flex justify-end">
          <Button disabled={isSaving || !canSave} type="submit">
            Save rename
          </Button>
        </div>
      </form>
    </section>
  );
}

function DeckOptionsDialog({ deck, onClose }: { deck: DeckSummary; onClose: () => void }) {
  return (
    <section
      aria-label="Deck Options"
      className="fixed top-20 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Deck Options</h2>
          <p className="text-sm text-muted-foreground">{deck.name}</p>
        </div>
        <Button
          aria-label="Close deck options"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Deck-specific options open for this deck.</p>
    </section>
  );
}

function ExportDeckDialog({ deck, onClose }: { deck: DeckSummary; onClose: () => void }) {
  return (
    <section
      aria-label="Export Deck"
      className="fixed top-24 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Export Deck</h2>
          <p className="text-sm text-muted-foreground">{deck.name}</p>
        </div>
        <Button
          aria-label="Close export deck"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">The export scope is limited to this deck.</p>
    </section>
  );
}

function DeleteDeckDialog({
  deck,
  isDeleting,
  onClose,
  onDelete,
}: {
  deck: DeckSummary;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <section
      aria-label="Delete Deck"
      className="fixed top-28 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Delete Deck</h2>
          <p className="text-sm text-muted-foreground">{deck.name}</p>
        </div>
        <Button
          aria-label="Close delete deck"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Delete this deck and report how many cards were removed.
      </p>
      <div className="flex justify-end">
        <Button disabled={isDeleting} onClick={onDelete} type="button" variant="destructive">
          Delete deck
        </Button>
      </div>
    </section>
  );
}
