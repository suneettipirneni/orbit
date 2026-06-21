import type { DeckSummary } from "@orbit/types";
import { usePowerSync, useStatus } from "@powersync/react";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Cloud,
  CloudOff,
  Download,
  LibraryBig,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { NavLink, useMatch } from "react-router";
import { Button } from "@orbit/ui/components/button";
import { Badge } from "@orbit/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@orbit/ui/components/dropdown-menu";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@orbit/ui/components/field";
import { Input } from "@orbit/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@orbit/ui/components/native-select";
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
import { createDeck, deleteDeck, importAnkiDecks, updateDeck } from "@/lib/repo/deck";
import {
  applyAnkiAppearancePreferences,
  loadAnkiPreferences,
  saveAnkiPreferences,
  type AnkiPreferences,
} from "@/lib/anki-preferences";
import { useDecksQuery } from "@/lib/queries/deck";
import { useSchedulerStatusQuery, useTodayStudySummaryQuery } from "@/lib/queries/review";
import { connectPowerSync, isPowerSyncLocalOnly, powerSyncStorageMode } from "@/lib/powersync";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [collapsedDeckIds, setCollapsedDeckIds] = useState<Set<string>>(() => new Set());
  const [deckDialog, setDeckDialog] = useState<DeckDialogState>();
  const [draggedDeckId, setDraggedDeckId] = useState<string>();
  const [deckMessage, setDeckMessage] = useState<string>();
  const [importError, setImportError] = useState<string>();
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [isImportingAnkiDecks, setIsImportingAnkiDecks] = useState(false);
  const [isUpdatingDeck, setIsUpdatingDeck] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    const loadedPreferences = loadAnkiPreferences();
    applyAnkiAppearancePreferences(loadedPreferences);
    return loadedPreferences;
  });
  const form = useForm<DeckFormValues>({
    defaultValues: {
      name: "",
    },
  });
  const { data: [decksPage] = [] } = useDecksQuery();
  const { data: schedulerStatus } = useSchedulerStatusQuery();
  const { data: todayStudySummary } = useTodayStudySummaryQuery();
  const isBrowseActive = Boolean(useMatch("/browse"));
  const deckItems = decksPage?.data ?? [];
  const deckTreeRows = buildDeckTreeRows(deckItems, collapsedDeckIds);
  const registerName = form.register("name");
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

    void updateDeck(deck.id, { name: nextName });
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
  const submitDeckForm = form.handleSubmit(async (values) => {
    if (values.name.trim()) {
      setIsCreatingDeck(true);

      try {
        const deck = await createDeck(values);
        form.reset();
        onSelectDeck(deck.id);
      } finally {
        setIsCreatingDeck(false);
      }
    }
  });
  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    setImportError(undefined);
    setIsImportingAnkiDecks(true);
    void importAnkiDecks({ file })
      .then((result) => {
        const firstDeck = result.decks[0];

        if (firstDeck) {
          onSelectDeck(firstDeck.id);
        }
      })
      .catch((error: unknown) => {
        setImportError(error instanceof Error ? error.message : "Anki import failed.");
      })
      .finally(() => setIsImportingAnkiDecks(false));
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
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={!isBrowseActive} tooltip="Decks">
                  <NavLink to="/">
                    <LibraryBig className="size-4" />
                    <span>Decks</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isBrowseActive} tooltip="Browse">
                  <NavLink to="/browse">
                    <Search className="size-4" />
                    <span>Browse</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
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
              {decksPage?.pagination.total === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2 py-3 text-sm text-muted-foreground">No decks yet.</div>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
            {schedulerStatus.upgradeRequired ? <SchedulerUpgradeCallout /> : null}
            {todayStudySummary && todayStudySummary.studiedCards > 0 ? (
              <div
                className="mt-3 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden"
                data-testid="studied-today-summary"
              >
                <span className="font-medium text-foreground">
                  {formatStudiedCardCount(todayStudySummary.studiedCards)}
                </span>{" "}
                studied today · {formatElapsedReviewTime(todayStudySummary.elapsedSeconds)} review
                time
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
            disabled={isImportingAnkiDecks}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Upload className="size-4" />
            {isImportingAnkiDecks ? "Importing..." : "Import Anki"}
          </Button>
          {importError ? <p className="text-xs text-destructive">{importError}</p> : null}
          {deckMessage ? <p className="text-xs text-muted-foreground">{deckMessage}</p> : null}
          <SyncStatusPanel />
          <Button onClick={() => setIsPreferencesOpen(true)} type="button" variant="outline">
            <Settings className="size-4" />
            Preferences
          </Button>
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
                <Button
                  aria-label="Create deck"
                  disabled={isCreatingDeck}
                  size="icon"
                  type="submit"
                >
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
          isSaving={isUpdatingDeck}
          onClose={() => setDeckDialog(undefined)}
          onRename={(name) => {
            setIsUpdatingDeck(true);
            void updateDeck(deckDialog.deck.id, { name })
              .then(() => setDeckDialog(undefined))
              .finally(() => setIsUpdatingDeck(false));
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
          isDeleting={isDeletingDeck}
          onClose={() => setDeckDialog(undefined)}
          onDelete={() => {
            const deletedDeckName = deckDialog.deck.name;

            setIsDeletingDeck(true);
            void deleteDeck(deckDialog.deck.id)
              .then((result) => {
                setDeckDialog(undefined);
                setDeckMessage(`Deleted ${result.deletedCards} cards with ${deletedDeckName}.`);
              })
              .finally(() => setIsDeletingDeck(false));
          }}
        />
      ) : null}
      {isPreferencesOpen ? (
        <PreferencesDialog
          initialPreferences={preferences}
          onClose={() => setIsPreferencesOpen(false)}
          onSave={(nextPreferences) => {
            const shouldReload =
              nextPreferences.powerSyncStorageMode !== preferences.powerSyncStorageMode;

            saveAnkiPreferences(nextPreferences);
            setPreferences(nextPreferences);
            setIsPreferencesOpen(false);

            if (shouldReload) {
              window.location.reload();
            }
          }}
        />
      ) : null}
    </Sidebar>
  );
}

function SyncStatusPanel() {
  const powerSync = usePowerSync();
  const status = useStatus();
  const [pendingChanges, setPendingChanges] = useState(0);
  const dataFlowStatus = status.dataFlowStatus;
  const lastError = dataFlowStatus.uploadError ?? dataFlowStatus.downloadError;
  const isSyncing = dataFlowStatus.uploading === true || dataFlowStatus.downloading === true;
  const statusText = isPowerSyncLocalOnly
    ? "Local only"
    : lastError !== undefined
      ? "Sync error"
      : status.connecting
        ? "Connecting"
        : isSyncing
          ? "Syncing"
          : status.connected
            ? "Connected"
            : "Local first";

  useEffect(() => {
    let isMounted = true;

    const refreshUploadQueue = async () => {
      const stats = await powerSync.getUploadQueueStats();

      if (isMounted) {
        setPendingChanges(stats.count);
      }
    };

    void refreshUploadQueue();
    const intervalId = window.setInterval(() => void refreshUploadQueue(), 2500);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [powerSync]);

  return (
    <div className="grid gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {status.connected || status.connecting ? (
            <Cloud className="size-4 shrink-0" />
          ) : (
            <CloudOff className="size-4 shrink-0" />
          )}
          <span className="truncate font-medium text-foreground">{statusText}</span>
        </div>
        <Button
          aria-label="Reconnect sync"
          disabled={isPowerSyncLocalOnly || status.connecting}
          onClick={() => {
            void connectPowerSync();
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          <RefreshCw
            className={status.connecting || isSyncing ? "size-4 animate-spin" : "size-4"}
          />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">{powerSyncStorageMode}</Badge>
        <Badge variant="secondary">
          {isPowerSyncLocalOnly ? "0 pending" : `${pendingChanges} pending`}
        </Badge>
        <Badge variant="secondary">
          {isPowerSyncLocalOnly ? "sync off" : status.hasSynced ? "synced" : "not synced"}
        </Badge>
      </div>
      {isPowerSyncLocalOnly ? null : (
        <p className="truncate">
          {status.lastSyncedAt
            ? `Last synced ${formatSyncTime(status.lastSyncedAt)}`
            : "Not synced yet"}
        </p>
      )}
      {lastError ? (
        <p className="flex items-center gap-1 text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="truncate">{lastError.message}</span>
        </p>
      ) : null}
    </div>
  );
}

function formatSyncTime(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
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

type PreferenceSection = "appearance" | "backups" | "editing" | "network" | "review";

function PreferencesDialog({
  initialPreferences,
  onClose,
  onSave,
}: {
  initialPreferences: AnkiPreferences;
  onClose: () => void;
  onSave: (preferences: AnkiPreferences) => void;
}) {
  const [activeSection, setActiveSection] = useState<PreferenceSection>("appearance");
  const [draft, setDraft] = useState(initialPreferences);
  const patchDraft = (patch: Partial<AnkiPreferences>) =>
    setDraft((current) => ({ ...current, ...patch }));

  return (
    <section
      aria-label="Preferences"
      className="fixed top-10 left-1/2 z-50 grid max-h-[calc(100vh-5rem)] w-[min(46rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 overflow-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Preferences</h2>
          <p className="mt-1 text-sm text-muted-foreground">Local app behavior settings.</p>
        </div>
        <Button
          aria-label="Close preferences"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {[
          ["appearance", "Appearance"],
          ["review", "Review"],
          ["editing", "Editing"],
          ["backups", "Backups"],
          ["network", "Network"],
        ].map(([section, label]) => (
          <Button
            aria-selected={activeSection === section}
            key={section}
            onClick={() => setActiveSection(section as PreferenceSection)}
            size="sm"
            type="button"
            variant={activeSection === section ? "default" : "outline"}
          >
            {label}
          </Button>
        ))}
      </div>
      {activeSection === "appearance" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <SelectPreference
            label="Language"
            onChange={(language) => patchDraft({ language })}
            options={[
              ["en", "English"],
              ["es", "Spanish"],
              ["fr", "French"],
            ]}
            value={draft.language}
          />
          <SelectPreference
            label="Video driver"
            onChange={(videoDriver) => patchDraft({ videoDriver })}
            options={[
              ["auto", "Automatic"],
              ["metal", "Metal"],
              ["software", "Software"],
            ]}
            value={draft.videoDriver}
          />
          <CheckboxPreference
            checked={draft.checkForUpdates}
            label="Check for updates"
            onChange={(checkForUpdates) => patchDraft({ checkForUpdates })}
          />
          <SelectPreference
            label="Theme"
            onChange={(theme) => patchDraft({ theme: theme as AnkiPreferences["theme"] })}
            options={[
              ["auto", "Auto"],
              ["light", "Light"],
              ["dark", "Dark"],
            ]}
            value={draft.theme}
          />
          <SelectPreference
            label="Style"
            onChange={(style) => patchDraft({ style })}
            options={[
              ["native", "Native"],
              ["fusion", "Fusion"],
              ["classic", "Classic"],
            ]}
            value={draft.style}
          />
          <NumberPreference
            label="User interface size"
            onChange={(uiSizePercent) => patchDraft({ uiSizePercent })}
            value={draft.uiSizePercent}
          />
          <div className="md:col-span-2">
            <Button
              onClick={() => patchDraft({ windowSizesReset: true })}
              type="button"
              variant="outline"
            >
              Reset window sizes
            </Button>
            {draft.windowSizesReset ? (
              <p className="mt-2 text-sm text-muted-foreground">Window sizes reset to defaults.</p>
            ) : null}
          </div>
          <CheckboxPreference
            checked={draft.hideTopBarDuringReview}
            label="Hide top bar during review"
            onChange={(hideTopBarDuringReview) => patchDraft({ hideTopBarDuringReview })}
          />
          <CheckboxPreference
            checked={draft.hideBottomBarDuringReview}
            label="Hide bottom bar during review"
            onChange={(hideBottomBarDuringReview) => patchDraft({ hideBottomBarDuringReview })}
          />
          <CheckboxPreference
            checked={draft.reduceMotion}
            label="Reduce motion"
            onChange={(reduceMotion) => patchDraft({ reduceMotion })}
          />
          <CheckboxPreference
            checked={draft.minimalistMode}
            label="Minimalist mode"
            onChange={(minimalistMode) => patchDraft({ minimalistMode })}
          />
        </div>
      ) : null}
      {activeSection === "review" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <NumberPreference
            label="Next day starts at"
            onChange={(nextDayStartsAt) => patchDraft({ nextDayStartsAt })}
            value={draft.nextDayStartsAt}
          />
          <NumberPreference
            label="Learn-ahead limit"
            onChange={(learnAheadMinutes) => patchDraft({ learnAheadMinutes })}
            value={draft.learnAheadMinutes}
          />
          <NumberPreference
            label="Timebox time limit"
            onChange={(timeboxMinutes) => patchDraft({ timeboxMinutes })}
            value={draft.timeboxMinutes}
          />
          <CheckboxPreference
            checked={draft.showAudioPlayButtons}
            label="Show play buttons on cards with audio"
            onChange={(showAudioPlayButtons) => patchDraft({ showAudioPlayButtons })}
          />
          <CheckboxPreference
            checked={draft.interruptAudioOnAnswer}
            label="Interrupt current audio when answering"
            onChange={(interruptAudioOnAnswer) => patchDraft({ interruptAudioOnAnswer })}
          />
          <CheckboxPreference
            checked={draft.showRemainingCardCount}
            label="Show remaining card count"
            onChange={(showRemainingCardCount) => patchDraft({ showRemainingCardCount })}
          />
          <CheckboxPreference
            checked={draft.showNextReviewTime}
            label="Show next review time"
            onChange={(showNextReviewTime) => patchDraft({ showNextReviewTime })}
          />
          <CheckboxPreference
            checked={draft.spacebarRatesCard}
            label="Spacebar rates card"
            onChange={(spacebarRatesCard) => patchDraft({ spacebarRatesCard })}
          />
          <CheckboxPreference
            checked={draft.generateLatexImages}
            label="Generate LaTeX images automatically"
            onChange={(generateLatexImages) => patchDraft({ generateLatexImages })}
          />
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            Answer keys
            <Input
              aria-label="Answer keys"
              onChange={(event) => patchDraft({ answerKeys: event.currentTarget.value })}
              value={draft.answerKeys}
            />
          </label>
        </div>
      ) : null}
      {activeSection === "editing" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxPreference
            checked={draft.pasteImagesAsPng}
            label="Paste clipboard images as PNG"
            onChange={(pasteImagesAsPng) => patchDraft({ pasteImagesAsPng })}
          />
          <CheckboxPreference
            checked={draft.pasteWithoutShiftStripsFormatting}
            label="Paste without shift strips formatting"
            onChange={(pasteWithoutShiftStripsFormatting) =>
              patchDraft({ pasteWithoutShiftStripsFormatting })
            }
          />
          <SelectPreference
            label="Default deck behavior when adding"
            onChange={(defaultDeckBehavior) =>
              patchDraft({
                defaultDeckBehavior: defaultDeckBehavior as AnkiPreferences["defaultDeckBehavior"],
              })
            }
            options={[
              ["current", "Current deck"],
              ["note-type", "Change deck depending on note type"],
            ]}
            value={draft.defaultDeckBehavior}
          />
          <label className="grid gap-1 text-sm font-medium">
            Default search text
            <Input
              aria-label="Default search text"
              onChange={(event) => patchDraft({ defaultSearchText: event.currentTarget.value })}
              value={draft.defaultSearchText}
            />
          </label>
          <CheckboxPreference
            checked={draft.ignoreAccentsInSearch}
            label="Ignore accents in search"
            onChange={(ignoreAccentsInSearch) => patchDraft({ ignoreAccentsInSearch })}
          />
        </div>
      ) : null}
      {activeSection === "backups" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <NumberPreference
            label="Minutes between backups"
            onChange={(minutesBetweenBackups) => patchDraft({ minutesBetweenBackups })}
            value={draft.minutesBetweenBackups}
          />
          <NumberPreference
            label="Daily backups"
            onChange={(dailyBackups) => patchDraft({ dailyBackups })}
            value={draft.dailyBackups}
          />
          <NumberPreference
            label="Weekly backups"
            onChange={(weeklyBackups) => patchDraft({ weeklyBackups })}
            value={draft.weeklyBackups}
          />
          <NumberPreference
            label="Monthly backups"
            onChange={(monthlyBackups) => patchDraft({ monthlyBackups })}
            value={draft.monthlyBackups}
          />
          <p className="text-sm text-muted-foreground md:col-span-2">
            Restore from the backup folder when needed.
          </p>
        </div>
      ) : null}
      {activeSection === "network" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <SelectPreference
            label="Storage mode"
            onChange={(powerSyncStorageMode) =>
              patchDraft({
                powerSyncStorageMode:
                  powerSyncStorageMode as AnkiPreferences["powerSyncStorageMode"],
              })
            }
            options={[
              ["auto", "Automatic"],
              ["local-only", "Local only"],
              ["synced", "Sync-enabled"],
            ]}
            value={draft.powerSyncStorageMode}
          />
          <p className="text-sm text-muted-foreground md:col-span-2">
            Storage mode changes apply after restart.
          </p>
        </div>
      ) : null}
      <div className="grid gap-1 rounded-md border border-border p-3 text-sm text-muted-foreground">
        <p>Sync and account controls are excluded.</p>
        <p>Third-party account behavior is excluded.</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancel
        </Button>
        <Button
          onClick={(event) => {
            const dialog = event.currentTarget.closest('[role="dialog"]');
            onSave(dialog ? readVisiblePreferenceControls(draft, dialog) : draft);
          }}
          type="button"
        >
          Save preferences
        </Button>
      </div>
    </section>
  );
}

function readVisiblePreferenceControls(draft: AnkiPreferences, dialog: Element): AnkiPreferences {
  return {
    ...draft,
    answerKeys: readTextControl(dialog, "Answer keys", draft.answerKeys),
    checkForUpdates: readCheckboxControl(dialog, "Check for updates", draft.checkForUpdates),
    dailyBackups: readNumberControl(dialog, "Daily backups", draft.dailyBackups),
    defaultDeckBehavior: readTextControl(
      dialog,
      "Default deck behavior when adding",
      draft.defaultDeckBehavior,
    ) as AnkiPreferences["defaultDeckBehavior"],
    defaultSearchText: readTextControl(dialog, "Default search text", draft.defaultSearchText),
    generateLatexImages: readCheckboxControl(
      dialog,
      "Generate LaTeX images automatically",
      draft.generateLatexImages,
    ),
    hideBottomBarDuringReview: readCheckboxControl(
      dialog,
      "Hide bottom bar during review",
      draft.hideBottomBarDuringReview,
    ),
    hideTopBarDuringReview: readCheckboxControl(
      dialog,
      "Hide top bar during review",
      draft.hideTopBarDuringReview,
    ),
    ignoreAccentsInSearch: readCheckboxControl(
      dialog,
      "Ignore accents in search",
      draft.ignoreAccentsInSearch,
    ),
    interruptAudioOnAnswer: readCheckboxControl(
      dialog,
      "Interrupt current audio when answering",
      draft.interruptAudioOnAnswer,
    ),
    language: readTextControl(dialog, "Language", draft.language),
    learnAheadMinutes: readNumberControl(dialog, "Learn-ahead limit", draft.learnAheadMinutes),
    minimalistMode: readCheckboxControl(dialog, "Minimalist mode", draft.minimalistMode),
    minutesBetweenBackups: readNumberControl(
      dialog,
      "Minutes between backups",
      draft.minutesBetweenBackups,
    ),
    monthlyBackups: readNumberControl(dialog, "Monthly backups", draft.monthlyBackups),
    nextDayStartsAt: readNumberControl(dialog, "Next day starts at", draft.nextDayStartsAt),
    pasteImagesAsPng: readCheckboxControl(
      dialog,
      "Paste clipboard images as PNG",
      draft.pasteImagesAsPng,
    ),
    pasteWithoutShiftStripsFormatting: readCheckboxControl(
      dialog,
      "Paste without shift strips formatting",
      draft.pasteWithoutShiftStripsFormatting,
    ),
    powerSyncStorageMode: readTextControl(
      dialog,
      "Storage mode",
      draft.powerSyncStorageMode,
    ) as AnkiPreferences["powerSyncStorageMode"],
    reduceMotion: readCheckboxControl(dialog, "Reduce motion", draft.reduceMotion),
    showAudioPlayButtons: readCheckboxControl(
      dialog,
      "Show play buttons on cards with audio",
      draft.showAudioPlayButtons,
    ),
    showNextReviewTime: readCheckboxControl(
      dialog,
      "Show next review time",
      draft.showNextReviewTime,
    ),
    showRemainingCardCount: readCheckboxControl(
      dialog,
      "Show remaining card count",
      draft.showRemainingCardCount,
    ),
    spacebarRatesCard: readCheckboxControl(dialog, "Spacebar rates card", draft.spacebarRatesCard),
    style: readTextControl(dialog, "Style", draft.style),
    theme: readTextControl(dialog, "Theme", draft.theme) as AnkiPreferences["theme"],
    timeboxMinutes: readNumberControl(dialog, "Timebox time limit", draft.timeboxMinutes),
    uiSizePercent: readNumberControl(dialog, "User interface size", draft.uiSizePercent),
    videoDriver: readTextControl(dialog, "Video driver", draft.videoDriver),
    weeklyBackups: readNumberControl(dialog, "Weekly backups", draft.weeklyBackups),
  };
}

function findPreferenceControl(dialog: Element, label: string) {
  return Array.from(
    dialog.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select"),
  ).find((element) => element.getAttribute("aria-label") === label);
}

function readCheckboxControl(dialog: Element, label: string, fallback: boolean) {
  const control = findPreferenceControl(dialog, label);

  return control instanceof HTMLInputElement && control.type === "checkbox"
    ? control.checked
    : fallback;
}

function readNumberControl(dialog: Element, label: string, fallback: number) {
  const control = findPreferenceControl(dialog, label);
  const value = Number(control?.value);

  return Number.isFinite(value) ? value : fallback;
}

function readTextControl(dialog: Element, label: string, fallback: string) {
  return findPreferenceControl(dialog, label)?.value ?? fallback;
}

function CheckboxPreference({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        aria-label={label}
        checked={checked}
        className="size-4 rounded border border-input"
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function NumberPreference({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <Input
        aria-label={label}
        min={0}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectPreference({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <NativeSelect
        aria-label={label}
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <NativeSelectOption key={optionValue} value={optionValue}>
            {optionLabel}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
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
