import type { CardPreview, DeckSummary, UpdateCardInput, UpdateNoteInput } from "@orbit/types";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArchiveRestore,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Info,
  ListChecks,
  NotebookTabs,
  Pencil,
  Play,
  RotateCcw,
  Search,
  Settings,
  Shuffle,
  Table,
  Target,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Button } from "@orbit/ui/components/button";
import { DataTable } from "@orbit/ui/components/data-table";
import { Separator } from "@orbit/ui/components/separator";
import { ToggleGroup, ToggleGroupItem } from "@orbit/ui/components/toggle-group";
import { loadAnkiPreferences, normalizeTextForAccentPreference } from "@/lib/anki-preferences";
import { formatDueDate } from "@/lib/date-format";
import { updateCard } from "@/lib/repo/card";
import { deleteNote, updateNote } from "@/lib/repo/note";
import { submitReview } from "@/lib/repo/review";
import { allDecksCardScope, useDeckCardsQuery, useDecksQuery } from "@/lib/queries/deck";
import { useAddNoteDraft } from "./add-note-draft-context";
import { getCardStateName } from "./browser-card-state";
import { BrowserSidebar } from "./browser-sidebar";
import { QueryInput } from "./query-input";
import { SelectedNoteEditor } from "./selected-note-editor";

export interface DeckCardBrowserProps {
  deckId?: string;
}

export function DeckCardBrowser({ deckId }: DeckCardBrowserProps) {
  "use no memo";

  const isCollectionScope = !deckId;
  const resolvedDeckId = deckId ?? allDecksCardScope;
  const { data: [decksPage] = [] } = useDecksQuery({ pageSize: 100 });
  const deckItems = decksPage?.data ?? [];
  const { seedAddNoteDraft } = useAddNoteDraft();
  const [preferences, setPreferences] = useState(() => loadAnkiPreferences());
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [browserLayoutMode, setBrowserLayoutMode] = useState<BrowserLayoutMode>("auto");
  const [browserZoom, setBrowserZoom] = useState(1);
  const [browserOptions, setBrowserOptions] = useState<BrowserOptions>({
    font: "sans",
    fontSize: 14,
    lineSize: 1.4,
    searchWithinFormatting: false,
  });
  const [browserOptionsDraft, setBrowserOptionsDraft] = useState<BrowserOptions>(browserOptions);
  const [displayMode, setDisplayMode] = useState<BrowserDisplayMode>("cards");
  const [isBrowserFullScreen, setIsBrowserFullScreen] = useState(false);
  const [isBrowserOptionsOpen, setIsBrowserOptionsOpen] = useState(false);
  const [isBrowserVisible, setIsBrowserVisible] = useState(true);
  const [isCardInfoOpen, setIsCardInfoOpen] = useState(false);
  const [isChangeNoteTypeOpen, setIsChangeNoteTypeOpen] = useState(false);
  const [isDeleteSelectedNotesOpen, setIsDeleteSelectedNotesOpen] = useState(false);
  const [isFindDuplicatesOpen, setIsFindDuplicatesOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isUnburyOpen, setIsUnburyOpen] = useState(false);
  const [isWideBrowserViewport, setIsWideBrowserViewport] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= window.innerHeight,
  );
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [queryText, setQueryText] = useState(() => preferences.defaultSearchText);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sidebarFilter, setSidebarFilter] = useState("");
  const [submittedQueryText, setSubmittedQueryText] = useState(() => preferences.defaultSearchText);
  const [browserUndoStack, setBrowserUndoStack] = useState<BrowserNoteEdit[]>([]);
  const [browserRedoStack, setBrowserRedoStack] = useState<BrowserNoteEdit[]>([]);
  const [deletedBrowserNoteIds, setDeletedBrowserNoteIds] = useState<Set<string>>(() => new Set());
  const [browserTagList, setBrowserTagList] = useState(["science", "unused"]);
  const [clearUnusedTagsReport, setClearUnusedTagsReport] = useState<string[] | null>(null);
  const [noteTypesByNoteId, setNoteTypesByNoteId] = useState<Record<string, string>>({});
  const [noteTypeChangeReport, setNoteTypeChangeReport] =
    useState<BrowserNoteTypeChangeReport | null>(null);
  const [duplicateReport, setDuplicateReport] = useState<BrowserDuplicateGroup[] | null>(null);
  const [duplicateTagReport, setDuplicateTagReport] = useState("");
  const [findReplaceReport, setFindReplaceReport] = useState<number | null>(null);
  const [findReplaceSummary, setFindReplaceSummary] = useState("");
  const [exportNotesScope, setExportNotesScope] = useState<BrowserNoteScope | null>(null);
  const [filteredDeckContext, setFilteredDeckContext] = useState<BrowserFilteredDeckContext | null>(
    null,
  );
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const cardListRef = useRef<HTMLElement>(null);
  const sidebarFilterRef = useRef<HTMLInputElement>(null);
  const {
    data: [deckCardsPage] = [],
    isLoading: isDeckCardsLoading,
    refresh: refreshDeckCards,
  } = useDeckCardsQuery(resolvedDeckId, {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    query: preferences.ignoreAccentsInSearch ? undefined : submittedQueryText || undefined,
    searchWithinFormatting: browserOptions.searchWithinFormatting,
  });
  const visibleDeckCards = useMemo(() => {
    const normalizedQuery = normalizeTextForAccentPreference(
      submittedQueryText.trim(),
      preferences.ignoreAccentsInSearch,
    );

    return (deckCardsPage?.data ?? []).filter((card) => {
      if (deletedBrowserNoteIds.has(card.noteId)) {
        return false;
      }

      if (!preferences.ignoreAccentsInSearch || !normalizedQuery) {
        return true;
      }

      const searchableText = normalizeTextForAccentPreference(`${card.front} ${card.back}`, true);

      return searchableText.includes(normalizedQuery);
    });
  }, [
    deckCardsPage?.data,
    deletedBrowserNoteIds,
    preferences.ignoreAccentsInSearch,
    submittedQueryText,
  ]);
  const usedBrowserTags = useMemo(
    () => Array.from(new Set(visibleDeckCards.flatMap((card) => card.ankiTags ?? []))).sort(),
    [visibleDeckCards],
  );
  const browserRows = useMemo(
    () => (displayMode === "notes" ? collapseCardsByNote(visibleDeckCards) : visibleDeckCards),
    [displayMode, visibleDeckCards],
  );
  const browserRowCount = browserRows.length;
  const browserTotalRowCount =
    displayMode === "cards"
      ? (deckCardsPage?.pagination.total ?? browserRowCount)
      : browserRowCount;
  const columns = useMemo<ColumnDef<CardPreview>[]>(
    () => [
      {
        accessorKey: "front",
        cell: ({ row }) => (
          <div className="min-w-0 max-w-full">
            <p className="wrap-anywhere font-medium">{row.original.front}</p>
          </div>
        ),
        header: "Card",
      },
      {
        accessorKey: "dueAt",
        cell: ({ row }) => formatDueDate(row.original.dueAt),
        header: "Due",
      },
      {
        accessorKey: "ankiSortField",
        cell: ({ row }) =>
          row.original.ankiSortField || <span className="text-muted-foreground">-</span>,
        header: "Sort field",
      },
      {
        accessorKey: "ankiCardType",
        cell: ({ row }) =>
          row.original.ankiCardType === null ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            row.original.ankiCardType
          ),
        header: "Card type",
      },
      {
        accessorKey: "intervalDays",
        cell: ({ row }) => `${row.original.intervalDays} days`,
        header: "Interval",
      },
    ],
    [],
  );
  const table = useReactTable({
    columns,
    data: browserRows,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    rowCount: browserTotalRowCount,
    state: {
      columnVisibility,
      pagination,
      rowSelection,
    },
  });
  const selectedCardId = Object.keys(rowSelection)
    .filter((cardId) => rowSelection[cardId])
    .at(-1);
  const selectedCard = selectedCardId
    ? browserRows.find((card) => card.id === selectedCardId)
    : undefined;
  const selectedRowIndex = selectedCardId
    ? browserRows.findIndex((card) => card.id === selectedCardId)
    : -1;
  const selectedCardIds = browserRows
    .filter((card) => rowSelection[card.id])
    .map((card) => card.id);
  const selectedOrCurrentCardIds =
    selectedCardIds.length > 0 ? selectedCardIds : selectedCard ? [selectedCard.id] : [];
  const selectedNoteIds = Array.from(
    new Set(browserRows.filter((card) => rowSelection[card.id]).map((card) => card.noteId)),
  );
  const selectedOrCurrentNoteIds =
    selectedNoteIds.length > 0 ? selectedNoteIds : selectedCard ? [selectedCard.noteId] : [];
  const currentDeckSummary = deckId
    ? deckItems.find((deckOption) => deckOption.id === deckId)
    : undefined;
  const selectedNoteTypeName = selectedCard
    ? (noteTypesByNoteId[selectedCard.noteId] ?? "Basic")
    : "Basic";
  const deckCardRows = visibleDeckCards;
  const manuallyBuriedCardCount = deckCardRows.filter((card) => card.ankiQueue === -2).length;
  const schedulerBuriedCardCount = deckCardRows.filter((card) => card.ankiQueue === -3).length;
  const buriedCardCount = manuallyBuriedCardCount + schedulerBuriedCardCount;
  const hasSelectedRows = Object.keys(rowSelection).length > 0;
  const effectiveBrowserLayout =
    browserLayoutMode === "auto"
      ? isWideBrowserViewport
        ? "horizontal"
        : "vertical"
      : browserLayoutMode;
  const browserZoomText = formatBrowserZoom(browserZoom);
  const browserZoomStyle = {
    fontFamily: getBrowserFontFamily(browserOptions.font),
    fontSize: `${browserOptions.fontSize}px`,
    lineHeight: browserOptions.lineSize,
    zoom: browserZoomText,
  } as CSSProperties & { zoom: string };

  useEffect(() => {
    const handlePreferenceChange = () => {
      const nextPreferences = loadAnkiPreferences();

      setPreferences(nextPreferences);
      setQueryText(nextPreferences.defaultSearchText);
      setSubmittedQueryText(nextPreferences.defaultSearchText);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    };

    handlePreferenceChange();
    window.addEventListener("orbit:anki-preferences-changed", handlePreferenceChange);

    return () =>
      window.removeEventListener("orbit:anki-preferences-changed", handlePreferenceChange);
  }, []);

  useEffect(() => {
    if (selectedCard) {
      return;
    }

    setIsCardInfoOpen(false);
    setIsPreviewOpen(false);
  }, [selectedCard]);

  useEffect(() => {
    const closeBrowserWindows = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isCardInfoOpen) {
        setIsCardInfoOpen(false);
      } else if (isPreviewOpen) {
        setIsPreviewOpen(false);
      }
    };

    window.addEventListener("keydown", closeBrowserWindows);

    return () => window.removeEventListener("keydown", closeBrowserWindows);
  }, [isCardInfoOpen, isPreviewOpen]);

  useEffect(() => {
    const updateViewportShape = () => {
      setIsWideBrowserViewport(window.innerWidth >= window.innerHeight);
    };

    updateViewportShape();
    window.addEventListener("resize", updateViewportShape);

    return () => window.removeEventListener("resize", updateViewportShape);
  }, []);

  if (!isCollectionScope && !currentDeckSummary) {
    return null;
  }

  const selectRowAt = (index: number) => {
    const card = browserRows[index];

    if (card) {
      setRowSelection({ [card.id]: true });
    }
  };
  const runUpdateCard = (cardId: string, input: UpdateCardInput, onSuccess?: () => void) => {
    setIsUpdatingCard(true);
    void updateCard(cardId, input)
      .then(() => {
        onSuccess?.();
        void refreshDeckCards?.();
      })
      .finally(() => setIsUpdatingCard(false));
  };
  const runUpdateNote = (noteId: string, input: UpdateNoteInput, onSuccess?: () => void) => {
    setIsUpdatingNote(true);
    void updateNote(noteId, input)
      .then(() => {
        onSuccess?.();
        void refreshDeckCards?.();
      })
      .finally(() => setIsUpdatingNote(false));
  };
  const runDeleteNote = (noteId: string, onSuccess?: () => void) => {
    setIsDeletingNote(true);
    void deleteNote(noteId)
      .then(() => {
        onSuccess?.();
        void refreshDeckCards?.();
      })
      .finally(() => setIsDeletingNote(false));
  };
  const runSubmitReview = (cardId: string) => {
    setIsReviewing(true);
    void submitReview(cardId, { value: 4 })
      .then(() => void refreshDeckCards?.())
      .finally(() => setIsReviewing(false));
  };
  const focusCardList = () => cardListRef.current?.focus();
  const focusNoteEditor = () =>
    document.querySelector<HTMLTextAreaElement>('[aria-label="Selected note front"]')?.focus();
  const focusSearch = () =>
    document
      .querySelector<HTMLInputElement>(
        'input[aria-label="Search cards"], input[aria-label="Search condition value"]',
      )
      ?.focus();
  const focusSidebarFilter = () => {
    setIsSidebarVisible(true);
    window.requestAnimationFrame(() => sidebarFilterRef.current?.focus());
  };
  const focusSidebar = () => {
    setIsSidebarVisible(true);
    window.requestAnimationFrame(() => document.getElementById("browser-sidebar-tree")?.focus());
  };
  const zoomBrowserIn = () =>
    setBrowserZoom((currentZoom) => Math.min(1.4, roundBrowserZoom(currentZoom + 0.1)));
  const zoomBrowserOut = () =>
    setBrowserZoom((currentZoom) => Math.max(0.8, roundBrowserZoom(currentZoom - 0.1)));
  const resetBrowserZoom = () => setBrowserZoom(1);
  const focusAddNoteFront = () => {
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLTextAreaElement>('[aria-label="Add note"] [aria-label="Front"]')
        ?.focus();
    });
  };
  const openBrowserAddNote = () => {
    seedAddNoteDraft({ back: "", front: "" });
    focusAddNoteFront();
  };
  const createBrowserCopy = () => {
    if (!selectedCard) {
      return;
    }

    seedAddNoteDraft({ back: selectedCard.back, front: selectedCard.front });
    focusAddNoteFront();
  };
  const openBrowserOptions = () => {
    setBrowserOptionsDraft(browserOptions);
    setIsBrowserOptionsOpen(true);
  };
  const saveBrowserOptions = () => {
    setBrowserOptions(browserOptionsDraft);
    setIsBrowserOptionsOpen(false);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };
  const undoBrowserChange = () => {
    const edit = browserUndoStack.at(-1);

    if (!edit) {
      return;
    }

    runUpdateNote(edit.noteId, edit.before, () => {
      setBrowserUndoStack((current) => current.slice(0, -1));
      setBrowserRedoStack((current) => [...current, edit]);
    });
  };
  const redoBrowserChange = () => {
    const edit = browserRedoStack.at(-1);

    if (!edit) {
      return;
    }

    runUpdateNote(edit.noteId, edit.after, () => {
      setBrowserRedoStack((current) => current.slice(0, -1));
      setBrowserUndoStack((current) => [...current, edit]);
    });
  };
  const deleteSelectedBrowserNotes = () => {
    if (selectedOrCurrentNoteIds.length === 0) {
      return;
    }

    for (const noteId of selectedOrCurrentNoteIds) {
      runDeleteNote(noteId);
    }

    setDeletedBrowserNoteIds((current) => new Set([...current, ...selectedOrCurrentNoteIds]));
    setIsDeleteSelectedNotesOpen(false);
    setRowSelection({});
  };
  const clearUnusedBrowserTags = () => {
    const usedTags = new Set(usedBrowserTags);
    const removedTags = browserTagList.filter((tag) => !usedTags.has(tag));

    setBrowserTagList(browserTagList.filter((tag) => usedTags.has(tag)));
    setClearUnusedTagsReport(removedTags);
  };
  const changeSelectedNoteType = (input: BrowserNoteTypeChangeInput) => {
    const noteIds = selectedOrCurrentNoteIds;

    setNoteTypesByNoteId((current) => ({
      ...current,
      ...Object.fromEntries(noteIds.map((noteId) => [noteId, input.targetName])),
    }));
    setNoteTypeChangeReport({ ...input, noteIds });
    setIsChangeNoteTypeOpen(false);
  };
  const findDuplicateBrowserNotes = (input: BrowserDuplicateSearchInput) => {
    const groups = new Map<string, Set<string>>();
    const constraint = input.constraint.trim().toLowerCase();

    for (const card of visibleDeckCards) {
      const searchableText = `${card.front} ${card.back} ${(card.ankiTags ?? []).join(" ")}`;

      if (constraint && !searchableText.toLowerCase().includes(constraint)) {
        continue;
      }

      const value = input.field === "front" ? card.front : card.back;
      const normalizedValue = value.trim();

      if (!normalizedValue) {
        continue;
      }

      const noteIds = groups.get(normalizedValue) ?? new Set<string>();
      noteIds.add(card.noteId);
      groups.set(normalizedValue, noteIds);
    }

    setDuplicateReport(
      Array.from(groups.entries())
        .map(([value, noteIds]) => ({ noteIds: Array.from(noteIds), value }))
        .filter((group) => group.noteIds.length > 1),
    );
    setDuplicateTagReport("");
  };
  const runFindReplace = (input: BrowserFindReplaceInput) => {
    const noteIds = new Set(
      input.selectedOnly ? selectedOrCurrentNoteIds : visibleDeckCards.map((card) => card.noteId),
    );
    let replacementCount = 0;

    for (const noteId of noteIds) {
      const card = visibleDeckCards.find((candidate) => candidate.noteId === noteId);

      if (!card) {
        continue;
      }

      if (input.field === "tags") {
        const tags = card.ankiTags ?? [];
        const nextTags = tags.map((tag) =>
          matchesFindReplaceValue(tag, input) ? replaceFindReplaceValue(tag, input) : tag,
        );
        const changed = nextTags.join("\u0000") !== tags.join("\u0000");

        if (!changed) {
          continue;
        }

        replacementCount += 1;
        runUpdateNote(noteId, {
          addTags: nextTags.filter((tag) => !tags.includes(tag)),
          removeTags: tags.filter((tag) => !nextTags.includes(tag)),
        });
        continue;
      }

      const nextFront =
        input.field === "front" || input.field === "all"
          ? replaceFindReplaceValue(card.front, input)
          : card.front;
      const nextBack =
        input.field === "back" || input.field === "all"
          ? replaceFindReplaceValue(card.back, input)
          : card.back;
      const changed = nextFront !== card.front || nextBack !== card.back;

      if (!changed) {
        continue;
      }

      replacementCount += Number(nextFront !== card.front) + Number(nextBack !== card.back);
      runUpdateNote(noteId, {
        back: nextBack,
        front: nextFront,
      });
    }

    setFindReplaceReport(replacementCount);
    setFindReplaceSummary(
      [
        `Scope: ${input.selectedOnly ? "selected notes" : "all notes"}`,
        `Field: ${getFindReplaceFieldLabel(input.field)}`,
        input.field === "tags" ? `Renamed tag ${input.find} to ${input.replacement}.` : "",
        input.regex ? "Regex enabled" : "",
        input.ignoreCase ? "Ignore case enabled" : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  };
  const openDuplicateGroup = (noteIds: string[]) => {
    setQueryText(`nid:${noteIds.join(",")}`);
    setSubmittedQueryText(`nid:${noteIds.join(",")}`);
    setDisplayMode("notes");
    setIsFindDuplicatesOpen(false);
    setRowSelection({});
  };
  const tagDuplicateNotes = () => {
    const noteIds = Array.from(new Set((duplicateReport ?? []).flatMap((group) => group.noteIds)));

    for (const noteId of noteIds) {
      runUpdateNote(noteId, { addTags: ["duplicate"] });
    }

    setDuplicateTagReport(`Tagged duplicates: ${noteIds.join(", ")}`);
  };
  const openExportNotesWorkflow = () => {
    const noteIds =
      selectedOrCurrentNoteIds.length > 0
        ? selectedOrCurrentNoteIds
        : Array.from(new Set(browserRows.map((card) => card.noteId)));

    setExportNotesScope({
      noteIds,
      scope: selectedOrCurrentNoteIds.length > 0 ? "selected notes" : "search results",
    });
  };
  const openCreateFilteredDeckWorkflow = () => {
    const selectedSearch =
      selectedOrCurrentCardIds.length > 0 ? `cid:${selectedOrCurrentCardIds.join(",")}` : "";

    setFilteredDeckContext({
      search: selectedSearch || submittedQueryText || queryText,
      sourceSearch: submittedQueryText || queryText,
      selectedCardIds: selectedOrCurrentCardIds,
    });
  };
  const gradeSelectedCardsNow = () => {
    for (const cardId of selectedOrCurrentCardIds) {
      runSubmitReview(cardId);
    }
  };
  const closeBrowser = () => {
    if (selectedCard) {
      const front = document
        .querySelector<HTMLTextAreaElement>('[aria-label="Selected note front"]')
        ?.value.trim();
      const back = document
        .querySelector<HTMLTextAreaElement>('[aria-label="Selected note back"]')
        ?.value.trim();

      if (front && back && (front !== selectedCard.front || back !== selectedCard.back)) {
        runUpdateNote(selectedCard.noteId, { back, front });
      }
    }

    setIsBrowserVisible(false);
    setIsCardInfoOpen(false);
    setIsPreviewOpen(false);
  };
  const activateSidebarDeck = (deckName: string) => {
    const search = `deck:"${deckName.replaceAll('"', '\\"')}"`;

    setQueryText(search);
    setSubmittedQueryText(search);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setRowSelection({});
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setIsStatisticsOpen(true)} type="button" variant="outline">
          <BarChart3 className="size-4" />
          Stats
        </Button>
        {buriedCardCount > 0 ? (
          <Button onClick={() => setIsUnburyOpen(true)} type="button" variant="outline">
            <ArchiveRestore className="size-4" />
            Unbury
          </Button>
        ) : null}
      </div>
      {isBrowserVisible ? (
        <QueryInput
          onSubmit={(nextQueryText) => {
            setSubmittedQueryText(nextQueryText);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
            setRowSelection({});
          }}
          onValueChange={setQueryText}
          placeholder="Search cards with Anki syntax..."
          value={queryText}
        />
      ) : null}
      {isBrowserVisible ? (
        <div
          className={
            isSidebarVisible
              ? "grid min-h-0 gap-4 lg:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]"
              : "grid min-h-0 gap-4"
          }
        >
          {isSidebarVisible ? (
            <BrowserSidebar
              activeDeckId={deckId ?? ""}
              browserTags={browserTagList}
              decks={deckItems}
              filter={sidebarFilter}
              filterRef={sidebarFilterRef}
              onActivateDeck={activateSidebarDeck}
              onFilterChange={setSidebarFilter}
            />
          ) : null}
          <div
            className={
              effectiveBrowserLayout === "horizontal"
                ? "grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]"
                : "grid min-h-0 gap-4"
            }
            data-browser-layout={effectiveBrowserLayout}
            data-browser-font={browserOptions.font}
            data-browser-font-size={String(browserOptions.fontSize)}
            data-browser-full-screen={String(isBrowserFullScreen)}
            data-browser-line-size={String(browserOptions.lineSize)}
            data-browser-zoom={browserZoomText}
            data-testid="browser-work-area"
            style={browserZoomStyle}
          >
            <section
              aria-label="Card list"
              className="min-h-96 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              ref={cardListRef}
              tabIndex={-1}
            >
              <DataTable
                className="min-h-full min-w-0 [&_td:nth-child(2)]:whitespace-normal"
                columnVisibility
                emptyMessage={isDeckCardsLoading ? "Loading cards..." : "No cards yet."}
                pagination={{
                  showSelectedCount: true,
                  totalRows: browserTotalRowCount,
                }}
                selection
                table={table}
                toolbar={
                  <>
                    <ToggleGroup
                      aria-label="Browser display mode"
                      onValueChange={(value) => {
                        if (value === "cards" || value === "notes") {
                          setDisplayMode(value);
                          setRowSelection({});
                        }
                      }}
                      size="sm"
                      spacing={0}
                      type="single"
                      value={displayMode}
                      variant="outline"
                    >
                      <ToggleGroupItem aria-label="Card rows" value="cards">
                        <CreditCard className="size-4" />
                        Cards
                      </ToggleGroupItem>
                      <ToggleGroupItem aria-label="Note rows" value="notes">
                        <NotebookTabs className="size-4" />
                        Notes
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <ToggleGroup
                      aria-label="Browser layout"
                      onValueChange={(value) => {
                        if (value === "auto" || value === "vertical" || value === "horizontal") {
                          setBrowserLayoutMode(value);
                        }
                      }}
                      size="sm"
                      spacing={0}
                      type="single"
                      value={browserLayoutMode}
                      variant="outline"
                    >
                      <ToggleGroupItem aria-label="Layout auto" value="auto">
                        <Table className="size-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem aria-label="Layout vertical" value="vertical">
                        <ListChecks className="size-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem aria-label="Layout horizontal" value="horizontal">
                        <NotebookTabs className="size-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <Button
                      aria-label="Add note from browser"
                      onClick={openBrowserAddNote}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <FileText className="size-4" />
                    </Button>
                    <Button
                      aria-label="Create copy from browser"
                      disabled={!selectedCard}
                      onClick={createBrowserCopy}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      aria-label="Delete selected notes"
                      disabled={selectedOrCurrentNoteIds.length === 0}
                      onClick={() => setIsDeleteSelectedNotesOpen(true)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <X className="size-4" />
                    </Button>
                    <Button
                      aria-label="Grade now"
                      disabled={selectedOrCurrentCardIds.length === 0 || isReviewing}
                      onClick={gradeSelectedCardsNow}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Play className="size-4" />
                    </Button>
                    <Button
                      aria-label="Clear unused tags"
                      onClick={clearUnusedBrowserTags}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <ArchiveRestore className="size-4" />
                    </Button>
                    <Button
                      aria-label="Change note type"
                      disabled={selectedOrCurrentNoteIds.length === 0}
                      onClick={() => setIsChangeNoteTypeOpen(true)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <NotebookTabs className="size-4" />
                    </Button>
                    <Button
                      aria-label="Find duplicates"
                      onClick={() => setIsFindDuplicatesOpen(true)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Search className="size-4" />
                    </Button>
                    <Button
                      aria-label="Find and replace"
                      disabled={selectedOrCurrentNoteIds.length === 0}
                      onClick={() => setIsFindReplaceOpen(true)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      aria-label="Export notes"
                      onClick={openExportNotesWorkflow}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <FileText className="size-4" />
                    </Button>
                    <Button
                      aria-label="Create filtered deck"
                      onClick={openCreateFilteredDeckWorkflow}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Target className="size-4" />
                    </Button>
                    <Button
                      aria-label="Browser settings"
                      onClick={openBrowserOptions}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Settings className="size-4" />
                    </Button>
                    <Button
                      aria-label="Undo browser change"
                      disabled={browserUndoStack.length === 0 || isUpdatingNote}
                      onClick={undoBrowserChange}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Undo2 className="size-4" />
                    </Button>
                    <Button
                      aria-label="Redo browser change"
                      disabled={browserRedoStack.length === 0 || isUpdatingNote}
                      onClick={redoBrowserChange}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                    <Button
                      aria-label="Full screen browser"
                      onClick={() => setIsBrowserFullScreen((current) => !current)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Table className="size-4" />
                    </Button>
                    <Button
                      aria-label="Close browser"
                      onClick={closeBrowser}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <X className="size-4" />
                    </Button>
                    <Button
                      aria-label="Zoom out"
                      disabled={browserZoom <= 0.8}
                      onClick={zoomBrowserOut}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <ZoomOut className="size-4" />
                    </Button>
                    <Button
                      aria-label="Reset zoom"
                      disabled={browserZoom === 1}
                      onClick={resetBrowserZoom}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                    <Button
                      aria-label="Zoom in"
                      disabled={browserZoom >= 1.4}
                      onClick={zoomBrowserIn}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <ZoomIn className="size-4" />
                    </Button>
                    <Button
                      disabled={browserRows.length === 0}
                      onClick={() => {
                        setRowSelection(
                          Object.fromEntries(
                            browserRows
                              .filter((card) => !rowSelection[card.id])
                              .map((card) => [card.id, true]),
                          ),
                        );
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Shuffle className="size-4" />
                      Invert selection
                    </Button>
                    <Button
                      disabled={!hasSelectedRows}
                      onClick={() => {
                        const selectedNoteIds = new Set(
                          browserRows
                            .filter((card) => rowSelection[card.id])
                            .map((card) => card.noteId),
                        );

                        setRowSelection(
                          Object.fromEntries(
                            browserRows
                              .filter((card) => selectedNoteIds.has(card.noteId))
                              .map((card) => [card.id, true]),
                          ),
                        );
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <ListChecks className="size-4" />
                      Select notes
                    </Button>
                    <Button
                      aria-label="Find/search focus"
                      onClick={focusSearch}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Search className="size-4" />
                    </Button>
                    <Button
                      aria-label="Filter focus"
                      onClick={focusSidebarFilter}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Search className="size-4" />
                    </Button>
                    <Button
                      aria-label="Sidebar focus"
                      onClick={focusSidebar}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <ListChecks className="size-4" />
                    </Button>
                    <Button
                      aria-label="Toggle sidebar"
                      onClick={() => setIsSidebarVisible((visible) => !visible)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <NotebookTabs className="size-4" />
                    </Button>
                    <Button
                      aria-label="Note focus"
                      disabled={!selectedCard}
                      onClick={focusNoteEditor}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <FileText className="size-4" />
                    </Button>
                    <Button
                      aria-label="Card list focus"
                      onClick={focusCardList}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Table className="size-4" />
                    </Button>
                    <Button
                      aria-label="Preview selected card"
                      disabled={!selectedCard}
                      onClick={() => setIsPreviewOpen(true)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      aria-label="Card info"
                      disabled={!selectedCard}
                      onClick={() => setIsCardInfoOpen(true)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <Info className="size-4" />
                    </Button>
                    <Button
                      aria-label="First card"
                      disabled={browserRows.length === 0 || selectedRowIndex <= 0}
                      onClick={() => selectRowAt(0)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                      aria-label="Previous card"
                      disabled={browserRows.length === 0 || selectedRowIndex <= 0}
                      onClick={() => selectRowAt(Math.max(0, selectedRowIndex - 1))}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      aria-label="Next card"
                      disabled={
                        browserRows.length === 0 ||
                        selectedRowIndex === -1 ||
                        selectedRowIndex >= browserRows.length - 1
                      }
                      onClick={() =>
                        selectRowAt(Math.min(browserRows.length - 1, selectedRowIndex + 1))
                      }
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      aria-label="Last card"
                      disabled={
                        browserRows.length === 0 ||
                        selectedRowIndex === -1 ||
                        selectedRowIndex >= browserRows.length - 1
                      }
                      onClick={() => selectRowAt(browserRows.length - 1)}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <ChevronsRight className="size-4" />
                    </Button>
                  </>
                }
              />
            </section>
            <SelectedNoteEditor
              key={selectedCard?.id ?? "empty"}
              card={selectedCard}
              deckOptions={deckItems}
              isDeleting={isDeletingNote}
              isSaving={isUpdatingNote}
              isUpdatingCard={isUpdatingCard}
              noteTypeName={selectedNoteTypeName}
              onAddTag={(tag) => {
                if (selectedNoteIds.length === 0) {
                  return;
                }

                setBrowserTagList((current) => Array.from(new Set([...current, tag])).sort());
                for (const noteId of selectedNoteIds) {
                  runUpdateNote(noteId, { addTags: [tag] });
                }
              }}
              onDelete={() => {
                if (!selectedCard) {
                  return;
                }

                runDeleteNote(selectedCard.noteId, () => setRowSelection({}));
              }}
              onBury={() => {
                if (!selectedCard || selectedOrCurrentCardIds.length === 0) {
                  return;
                }

                for (const cardId of selectedOrCurrentCardIds) {
                  runUpdateCard(cardId, { buried: true });
                }
              }}
              onChangeDeck={(targetDeckId) => {
                if (selectedOrCurrentCardIds.length === 0) {
                  return;
                }

                for (const cardId of selectedOrCurrentCardIds) {
                  runUpdateCard(cardId, { deckId: targetDeckId });
                }
              }}
              onToggleSuspend={() => {
                if (!selectedCard || selectedOrCurrentCardIds.length === 0) {
                  return;
                }

                for (const cardId of selectedOrCurrentCardIds) {
                  runUpdateCard(cardId, { suspended: selectedCard.ankiQueue !== -1 });
                }
              }}
              onForget={() => {
                if (selectedOrCurrentCardIds.length === 0) {
                  return;
                }

                for (const cardId of selectedOrCurrentCardIds) {
                  runUpdateCard(cardId, { forget: true });
                }
              }}
              onSetDueDate={(dueAt) => {
                if (selectedOrCurrentCardIds.length === 0) {
                  return;
                }

                for (const cardId of selectedOrCurrentCardIds) {
                  runUpdateCard(cardId, { dueAt });
                }
              }}
              onReposition={(position) => {
                if (selectedOrCurrentCardIds.length === 0) {
                  return;
                }

                for (const cardId of selectedOrCurrentCardIds) {
                  runUpdateCard(cardId, { position });
                }
              }}
              onRemoveTag={(tag) => {
                if (selectedNoteIds.length === 0) {
                  return;
                }

                for (const noteId of selectedNoteIds) {
                  runUpdateNote(noteId, { removeTags: [tag] });
                }
              }}
              onUpdateFlag={(flag) => {
                if (selectedOrCurrentCardIds.length === 0) {
                  return;
                }

                for (const cardId of selectedOrCurrentCardIds) {
                  runUpdateCard(cardId, { flag });
                }
              }}
              onSave={(input) => {
                if (!selectedCard) {
                  return;
                }

                const edit = {
                  after: input,
                  before: {
                    back: selectedCard.back,
                    front: selectedCard.front,
                  },
                  noteId: selectedCard.noteId,
                };

                runUpdateNote(selectedCard.noteId, input, () => {
                  setBrowserUndoStack((current) => [...current, edit]);
                  setBrowserRedoStack([]);
                });
              }}
              onSetMarked={(marked) => {
                if (selectedNoteIds.length === 0) {
                  return;
                }

                for (const noteId of selectedNoteIds) {
                  runUpdateNote(noteId, { marked });
                }
              }}
            />
          </div>
          {isPreviewOpen && selectedCard ? (
            <CardPreviewWindow card={selectedCard} onClose={() => setIsPreviewOpen(false)} />
          ) : null}
          {isCardInfoOpen && selectedCard ? (
            <CardInfoWindow card={selectedCard} onClose={() => setIsCardInfoOpen(false)} />
          ) : null}
          {isUnburyOpen ? (
            <UnburyCardsWindow
              manuallyBuriedCardCount={manuallyBuriedCardCount}
              onClose={() => setIsUnburyOpen(false)}
              schedulerBuriedCardCount={schedulerBuriedCardCount}
            />
          ) : null}
          {isBrowserOptionsOpen ? (
            <BrowserOptionsWindow
              draft={browserOptionsDraft}
              onChange={setBrowserOptionsDraft}
              onClose={() => setIsBrowserOptionsOpen(false)}
              onSave={saveBrowserOptions}
            />
          ) : null}
          {isDeleteSelectedNotesOpen ? (
            <DeleteSelectedNotesDialog
              count={selectedOrCurrentNoteIds.length}
              onClose={() => setIsDeleteSelectedNotesOpen(false)}
              onConfirm={deleteSelectedBrowserNotes}
            />
          ) : null}
          {clearUnusedTagsReport ? (
            <ClearUnusedTagsDialog
              removedTags={clearUnusedTagsReport}
              onClose={() => setClearUnusedTagsReport(null)}
            />
          ) : null}
          {isChangeNoteTypeOpen ? (
            <ChangeNoteTypeDialog
              noteCount={selectedOrCurrentNoteIds.length}
              onClose={() => setIsChangeNoteTypeOpen(false)}
              onConfirm={changeSelectedNoteType}
            />
          ) : null}
          {noteTypeChangeReport ? (
            <NoteTypeChangeReportDialog
              report={noteTypeChangeReport}
              onClose={() => setNoteTypeChangeReport(null)}
            />
          ) : null}
          {isFindDuplicatesOpen ? (
            <FindDuplicatesDialog
              duplicateReport={duplicateReport}
              duplicateTagReport={duplicateTagReport}
              onClose={() => setIsFindDuplicatesOpen(false)}
              onOpenGroup={openDuplicateGroup}
              onRun={findDuplicateBrowserNotes}
              onTagDuplicates={tagDuplicateNotes}
            />
          ) : null}
          {isFindReplaceOpen ? (
            <FindReplaceDialog
              defaultSelectedOnly={selectedOrCurrentNoteIds.length > 0}
              findReplaceSummary={findReplaceSummary}
              replacementCount={findReplaceReport}
              onClose={() => setIsFindReplaceOpen(false)}
              onRun={runFindReplace}
            />
          ) : null}
          {exportNotesScope ? (
            <ExportNotesDialog scope={exportNotesScope} onClose={() => setExportNotesScope(null)} />
          ) : null}
          {filteredDeckContext ? (
            <CreateFilteredDeckDialog
              cards={visibleDeckCards}
              context={filteredDeckContext}
              onClose={() => setFilteredDeckContext(null)}
            />
          ) : null}
        </div>
      ) : null}
      {isStatisticsOpen ? (
        <StatisticsWindow
          cards={visibleDeckCards}
          currentDeckCounts={
            currentDeckSummary
              ? {
                  due: currentDeckSummary.dueCards,
                  learning: currentDeckSummary.learningCards,
                  new: currentDeckSummary.newCards,
                  review: currentDeckSummary.reviewCards,
                  total: currentDeckSummary.totalCards,
                }
              : getCollectionStatisticsCounts(deckItems)
          }
          currentDeckId={deckId ?? deckItems[0]?.id ?? resolvedDeckId}
          defaultScope={isCollectionScope ? "collection" : "deck"}
          decks={deckItems}
          onClose={() => setIsStatisticsOpen(false)}
        />
      ) : null}
    </>
  );
}

type BrowserDisplayMode = "cards" | "notes";
interface BrowserNoteEdit {
  after: { back: string; front: string };
  before: { back: string; front: string };
  noteId: string;
}
interface BrowserOptions {
  font: "mono" | "sans" | "serif";
  fontSize: number;
  lineSize: number;
  searchWithinFormatting: boolean;
}
type BrowserLayoutMode = "auto" | "horizontal" | "vertical";
interface BrowserNoteTypeChangeInput {
  backMapping: string;
  frontMapping: string;
  targetName: string;
}
interface BrowserNoteTypeChangeReport extends BrowserNoteTypeChangeInput {
  noteIds: string[];
}
type BrowserDuplicateField = "back" | "front";
interface BrowserDuplicateSearchInput {
  constraint: string;
  field: BrowserDuplicateField;
}
interface BrowserDuplicateGroup {
  noteIds: string[];
  value: string;
}
type BrowserFindReplaceField = "all" | "back" | "front" | "tags";
interface BrowserFindReplaceInput {
  field: BrowserFindReplaceField;
  find: string;
  ignoreCase: boolean;
  regex: boolean;
  replacement: string;
  selectedOnly: boolean;
}
interface BrowserNoteScope {
  noteIds: string[];
  scope: "search results" | "selected notes";
}
interface BrowserFilteredDeckContext {
  search: string;
  sourceSearch: string;
  selectedCardIds: string[];
}

function roundBrowserZoom(zoom: number) {
  return Number(zoom.toFixed(1));
}

function formatBrowserZoom(zoom: number) {
  return String(roundBrowserZoom(zoom));
}

function getCollectionStatisticsCounts(decks: DeckSummary[]): StatisticsCounts {
  return decks.reduce<StatisticsCounts>(
    (totals, deckOption) => ({
      due: totals.due + deckOption.dueCards,
      learning: totals.learning + deckOption.learningCards,
      new: totals.new + deckOption.newCards,
      review: totals.review + deckOption.reviewCards,
      total: totals.total + deckOption.totalCards,
    }),
    { due: 0, learning: 0, new: 0, review: 0, total: 0 },
  );
}

function getBrowserFontFamily(font: BrowserOptions["font"]) {
  switch (font) {
    case "mono":
      return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    case "serif":
      return "Georgia, Cambria, Times New Roman, Times, serif";
    default:
      return "Inter, ui-sans-serif, system-ui, sans-serif";
  }
}

function BrowserOptionsWindow({
  draft,
  onChange,
  onClose,
  onSave,
}: {
  draft: BrowserOptions;
  onChange: (draft: BrowserOptions) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <section
      aria-label="Browser Options"
      className="fixed top-24 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Browser Options</h2>
          <p className="mt-1 text-sm text-muted-foreground">Display and search settings.</p>
        </div>
        <Button
          aria-label="Close browser options"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <label className="grid gap-1 text-sm font-medium" htmlFor="browser-font">
        Font
        <select
          aria-label="Browser font"
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id="browser-font"
          onChange={(event) =>
            onChange({ ...draft, font: event.currentTarget.value as BrowserOptions["font"] })
          }
          value={draft.font}
        >
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="mono">Mono</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium" htmlFor="browser-font-size">
        Font size
        <input
          aria-label="Browser font size"
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id="browser-font-size"
          max={28}
          min={10}
          onChange={(event) =>
            onChange({
              ...draft,
              fontSize: Math.max(10, Math.min(28, Number(event.currentTarget.value) || 14)),
            })
          }
          type="number"
          value={draft.fontSize}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium" htmlFor="browser-line-size">
        Line size
        <input
          aria-label="Browser line size"
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id="browser-line-size"
          max={2.4}
          min={1}
          onChange={(event) =>
            onChange({
              ...draft,
              lineSize: Math.max(1, Math.min(2.4, Number(event.currentTarget.value) || 1.4)),
            })
          }
          step={0.1}
          type="number"
          value={draft.lineSize}
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium" htmlFor="browser-formatting">
        <input
          aria-label="Search within formatting"
          checked={draft.searchWithinFormatting}
          id="browser-formatting"
          onChange={(event) =>
            onChange({ ...draft, searchWithinFormatting: event.currentTarget.checked })
          }
          type="checkbox"
        />
        Search within formatting
      </label>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancel
        </Button>
        <Button onClick={onSave} type="button">
          Save browser options
        </Button>
      </div>
    </section>
  );
}

function DeleteSelectedNotesDialog({
  count,
  onClose,
  onConfirm,
}: {
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <section
      aria-label="Delete Selected Notes"
      className="fixed top-28 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Delete Selected Notes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Delete {count} selected note{count === 1 ? "" : "s"} and their cards.
          </p>
        </div>
        <Button
          aria-label="Close delete selected notes"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancel
        </Button>
        <Button onClick={onConfirm} type="button" variant="destructive">
          Confirm delete selected notes
        </Button>
      </div>
    </section>
  );
}

function ClearUnusedTagsDialog({
  onClose,
  removedTags,
}: {
  onClose: () => void;
  removedTags: string[];
}) {
  return (
    <section
      aria-label="Clear Unused Tags"
      className="fixed top-28 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Clear Unused Tags</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Removed: {removedTags.length ? removedTags.join(", ") : "none"}
          </p>
        </div>
        <Button
          aria-label="Close clear unused tags"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
    </section>
  );
}

function ChangeNoteTypeDialog({
  noteCount,
  onClose,
  onConfirm,
}: {
  noteCount: number;
  onClose: () => void;
  onConfirm: (input: BrowserNoteTypeChangeInput) => void;
}) {
  const [targetType, setTargetType] = useState("basic");
  const [frontMapping, setFrontMapping] = useState("Front");
  const [backMapping, setBackMapping] = useState("Back");
  const targetName = targetType === "cloze" ? "Cloze" : "Basic";

  return (
    <section
      aria-label="Change Note Type"
      className="fixed top-20 left-1/2 z-50 grid w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Change Note Type</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Map fields for {noteCount} selected note{noteCount === 1 ? "" : "s"}.
          </p>
        </div>
        <Button
          aria-label="Close change note type"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <label className="grid gap-1 text-sm font-medium" htmlFor="browser-target-note-type">
        Target note type
        <select
          aria-label="Target note type"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id="browser-target-note-type"
          onChange={(event) => setTargetType(event.currentTarget.value)}
          value={targetType}
        >
          <option value="basic">Basic</option>
          <option value="cloze">Cloze</option>
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium" htmlFor="browser-front-field-mapping">
          Front field
          <select
            aria-label="Front field mapping"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            id="browser-front-field-mapping"
            onChange={(event) => setFrontMapping(event.currentTarget.value)}
            value={frontMapping}
          >
            <option value="Front">Front</option>
            <option value="Text">Text</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium" htmlFor="browser-back-field-mapping">
          Back field
          <select
            aria-label="Back field mapping"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            id="browser-back-field-mapping"
            onChange={(event) => setBackMapping(event.currentTarget.value)}
            value={backMapping}
          >
            <option value="Back">Back</option>
            <option value="Extra">Extra</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancel
        </Button>
        <Button onClick={() => onConfirm({ backMapping, frontMapping, targetName })} type="button">
          Confirm note type change
        </Button>
      </div>
    </section>
  );
}

function NoteTypeChangeReportDialog({
  onClose,
  report,
}: {
  onClose: () => void;
  report: BrowserNoteTypeChangeReport;
}) {
  return (
    <section
      aria-label="Note Type Change Report"
      className="fixed top-24 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-normal">Note Type Change Report</h2>
        <Button
          aria-label="Close note type change report"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid gap-1 text-sm text-muted-foreground">
        {report.noteIds.map((noteId) => (
          <p key={noteId}>
            {noteId} -&gt; {report.targetName}
          </p>
        ))}
        <p>Front -&gt; {report.frontMapping}</p>
        <p>Back -&gt; {report.backMapping}</p>
      </div>
    </section>
  );
}

function FindDuplicatesDialog({
  duplicateReport,
  duplicateTagReport,
  onClose,
  onOpenGroup,
  onRun,
  onTagDuplicates,
}: {
  duplicateReport: BrowserDuplicateGroup[] | null;
  duplicateTagReport: string;
  onClose: () => void;
  onOpenGroup: (noteIds: string[]) => void;
  onRun: (input: BrowserDuplicateSearchInput) => void;
  onTagDuplicates: () => void;
}) {
  const [field, setField] = useState<BrowserDuplicateField>("front");
  const [constraint, setConstraint] = useState("");

  return (
    <section
      aria-label="Find Duplicates"
      className="fixed top-20 left-1/2 z-50 grid w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Find Duplicates</h2>
          <p className="mt-1 text-sm text-muted-foreground">Group notes by matching field value.</p>
        </div>
        <Button
          aria-label="Close find duplicates"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <label className="grid gap-1 text-sm font-medium" htmlFor="browser-duplicate-field">
        Duplicate field
        <select
          aria-label="Duplicate field"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id="browser-duplicate-field"
          onChange={(event) => setField(event.currentTarget.value as BrowserDuplicateField)}
          value={field}
        >
          <option value="front">Front</option>
          <option value="back">Back</option>
        </select>
      </label>
      <TextOption label="Duplicate search constraint" onChange={setConstraint} value={constraint} />
      <Button onClick={() => onRun({ constraint, field })} type="button">
        Run duplicate search
      </Button>
      {duplicateReport ? (
        <div className="grid gap-1 text-sm text-muted-foreground">
          {duplicateReport.length ? (
            <>
              {duplicateReport.map((group) => (
                <div className="flex flex-wrap items-center gap-2" key={group.value}>
                  <p>
                    {group.value}: {group.noteIds.length} notes
                  </p>
                  <p>
                    {group.value}: {group.noteIds.join(", ")}
                  </p>
                  <Button
                    onClick={() => onOpenGroup(group.noteIds)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Search duplicate group {group.value}
                  </Button>
                </div>
              ))}
              <Button onClick={onTagDuplicates} size="sm" type="button" variant="outline">
                Tag duplicates
              </Button>
            </>
          ) : (
            <p>No duplicates found.</p>
          )}
        </div>
      ) : null}
      {duplicateTagReport ? (
        <p className="text-sm text-muted-foreground">{duplicateTagReport}</p>
      ) : null}
    </section>
  );
}

function FindReplaceDialog({
  defaultSelectedOnly,
  findReplaceSummary,
  onClose,
  onRun,
  replacementCount,
}: {
  defaultSelectedOnly: boolean;
  findReplaceSummary: string;
  onClose: () => void;
  onRun: (input: BrowserFindReplaceInput) => void;
  replacementCount: number | null;
}) {
  const [field, setField] = useState<BrowserFindReplaceField>("all");
  const [find, setFind] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [replacement, setReplacement] = useState("");
  const [regex, setRegex] = useState(false);
  const [selectedOnly, setSelectedOnly] = useState(defaultSelectedOnly);

  return (
    <section
      aria-label="Find and Replace"
      className="fixed top-20 left-1/2 z-50 grid w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Find and Replace</h2>
          <p className="mt-1 text-sm text-muted-foreground">Run replacement on selected notes.</p>
        </div>
        <Button
          aria-label="Close find and replace"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <SelectOption
        label="Find and replace field"
        onChange={(value) => setField(value as BrowserFindReplaceField)}
        options={FIND_REPLACE_FIELD_OPTIONS}
        value={field}
      />
      <label className="grid gap-1 text-sm font-medium" htmlFor="browser-find-text">
        Find
        <input
          aria-label="Find text"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id="browser-find-text"
          onChange={(event) => setFind(event.currentTarget.value)}
          value={find}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium" htmlFor="browser-replacement-text">
        Replace with
        <input
          aria-label="Replacement text"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id="browser-replacement-text"
          onChange={(event) => setReplacement(event.currentTarget.value)}
          value={replacement}
        />
      </label>
      <div className="grid gap-2">
        <CheckboxOption
          checked={selectedOnly}
          label="Selected notes only"
          onChange={setSelectedOnly}
        />
        <CheckboxOption checked={regex} label="Use regex" onChange={setRegex} />
        <CheckboxOption checked={ignoreCase} label="Ignore case" onChange={setIgnoreCase} />
      </div>
      <Button
        disabled={!find}
        onClick={() =>
          onRun({
            field,
            find,
            ignoreCase,
            regex,
            replacement,
            selectedOnly,
          })
        }
        type="button"
      >
        Run find and replace
      </Button>
      {replacementCount === null ? null : (
        <p className="text-sm text-muted-foreground">
          Replaced {replacementCount} field value{replacementCount === 1 ? "" : "s"}.
        </p>
      )}
      {findReplaceSummary ? (
        <p className="text-sm text-muted-foreground">{findReplaceSummary}</p>
      ) : null}
    </section>
  );
}

const FIND_REPLACE_FIELD_OPTIONS: Array<[BrowserFindReplaceField, string]> = [
  ["all", "All fields"],
  ["front", "Front"],
  ["back", "Back"],
  ["tags", "Tags"],
];

function getFindReplaceFieldLabel(field: BrowserFindReplaceField) {
  return FIND_REPLACE_FIELD_OPTIONS.find(([value]) => value === field)?.[1] ?? field;
}

function matchesFindReplaceValue(value: string, input: BrowserFindReplaceInput) {
  if (input.regex) {
    return createFindReplaceRegex(input).test(value);
  }

  return input.ignoreCase
    ? value.toLowerCase().includes(input.find.toLowerCase())
    : value.includes(input.find);
}

function replaceFindReplaceValue(value: string, input: BrowserFindReplaceInput) {
  if (input.regex) {
    return value.replace(createFindReplaceRegex(input), input.replacement);
  }

  if (input.ignoreCase) {
    return value.replace(new RegExp(escapeRegExp(input.find), "gi"), input.replacement);
  }

  return value.replaceAll(input.find, input.replacement);
}

function createFindReplaceRegex(input: BrowserFindReplaceInput) {
  return new RegExp(input.find, input.ignoreCase ? "gi" : "g");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ExportNotesDialog({ onClose, scope }: { onClose: () => void; scope: BrowserNoteScope }) {
  return (
    <section
      aria-label="Export Notes"
      className="fixed top-24 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-normal">Export Notes</h2>
        <Button
          aria-label="Close export notes"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Scope: {scope.scope}</p>
      <p className="text-sm text-muted-foreground">{scope.noteIds.join(", ")}</p>
    </section>
  );
}

function CreateFilteredDeckDialog({
  cards,
  context,
  onClose,
}: {
  cards: CardPreview[];
  context: BrowserFilteredDeckContext;
  onClose: () => void;
}) {
  const [deckName, setDeckName] = useState("Filtered Deck");
  const [firstQuery, setFirstQuery] = useState(context.search || "all cards");
  const [firstLimit, setFirstLimit] = useState(100);
  const [firstOrder, setFirstOrder] = useState<FilteredDeckOrder>("due");
  const [secondEnabled, setSecondEnabled] = useState(false);
  const [secondQuery, setSecondQuery] = useState("");
  const [secondLimit, setSecondLimit] = useState(100);
  const [secondOrder, setSecondOrder] = useState<FilteredDeckOrder>("due");
  const [reschedule, setReschedule] = useState(true);
  const [againDelay, setAgainDelay] = useState(1);
  const [hardDelay, setHardDelay] = useState(5);
  const [goodDelay, setGoodDelay] = useState(10);
  const [createEmpty, setCreateEmpty] = useState(false);
  const [report, setReport] = useState("");
  const buildFilteredDeck = () => {
    const filters = [
      { limit: firstLimit, order: firstOrder, query: firstQuery, slot: 1 },
      ...(secondEnabled
        ? [{ limit: secondLimit, order: secondOrder, query: secondQuery, slot: 2 }]
        : []),
    ];
    const selectedCards = new Map<string, CardPreview>();
    const unmovableCards = new Map<string, CardPreview>();
    const filterSummaries: string[] = [];

    for (const filter of filters) {
      const matches = orderFilteredDeckCards(
        cards.filter((card) => matchesFilteredDeckQuery(card, filter.query)),
        filter.order,
      );
      const movable = matches.filter((card) => isMovableFilteredDeckCard(card));

      for (const card of matches.filter((card) => !isMovableFilteredDeckCard(card))) {
        unmovableCards.set(card.id, card);
      }

      for (const card of movable.slice(0, filter.limit)) {
        selectedCards.set(card.id, card);
      }

      filterSummaries.push(
        `Filter ${filter.slot}: ${filter.query || "all cards"}, limit ${filter.limit}, order ${getFilteredDeckOrderLabel(filter.order)}`,
      );
    }

    if (selectedCards.size === 0 && !createEmpty) {
      setReport(
        [
          "No matching movable cards; deck was not created.",
          unmovableCards.size
            ? `Unmovable cards skipped: ${Array.from(unmovableCards.keys()).join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
      return;
    }

    setReport(
      [
        selectedCards.size === 0
          ? "Created empty filtered deck."
          : `Built ${deckName} with ${selectedCards.size} movable cards.`,
        ...filterSummaries,
        reschedule
          ? "Answers will update original card scheduling."
          : `Cards return without normal schedule advancement; preview delays Again ${againDelay}, Hard ${hardDelay}, Good ${goodDelay}.`,
        unmovableCards.size
          ? `Unmovable cards skipped: ${Array.from(unmovableCards.keys()).join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  };

  return (
    <section
      aria-label="Create Filtered Deck"
      className="fixed top-6 left-1/2 z-50 grid max-h-[calc(100vh-3rem)] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 gap-3 overflow-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-normal">Create Filtered Deck</h2>
        <Button
          aria-label="Close create filtered deck"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Filtered deck name
        <input
          aria-label="Filtered deck name"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => setDeckName(event.currentTarget.value)}
          value={deckName}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <TextOption label="Filter 1 search query" onChange={setFirstQuery} value={firstQuery} />
        <NumberOption label="Filter 1 limit" onChange={setFirstLimit} value={firstLimit} />
        <SelectOption
          label="Filter 1 order"
          onChange={(value) => setFirstOrder(value as FilteredDeckOrder)}
          options={FILTERED_DECK_ORDER_OPTIONS}
          value={firstOrder}
        />
      </div>
      <CheckboxOption
        checked={secondEnabled}
        label="Enable second filter"
        onChange={setSecondEnabled}
      />
      {secondEnabled ? (
        <div className="grid gap-3 md:grid-cols-3">
          <TextOption label="Filter 2 search query" onChange={setSecondQuery} value={secondQuery} />
          <NumberOption label="Filter 2 limit" onChange={setSecondLimit} value={secondLimit} />
          <SelectOption
            label="Filter 2 order"
            onChange={(value) => setSecondOrder(value as FilteredDeckOrder)}
            options={FILTERED_DECK_ORDER_OPTIONS}
            value={secondOrder}
          />
        </div>
      ) : null}
      <div className="grid gap-2 md:grid-cols-2">
        <CheckboxOption
          checked={reschedule}
          label="Reschedule based on answers"
          onChange={setReschedule}
        />
        <CheckboxOption
          checked={createEmpty}
          label="Create even if empty"
          onChange={setCreateEmpty}
        />
      </div>
      {!reschedule ? (
        <div className="grid gap-3 md:grid-cols-3">
          <NumberOption label="Again preview delay" onChange={setAgainDelay} value={againDelay} />
          <NumberOption label="Hard preview delay" onChange={setHardDelay} value={hardDelay} />
          <NumberOption label="Good preview delay" onChange={setGoodDelay} value={goodDelay} />
        </div>
      ) : null}
      <p className="text-sm text-muted-foreground">Search: {context.sourceSearch || "all cards"}</p>
      <p className="text-sm text-muted-foreground">
        Selected cards:{" "}
        {context.selectedCardIds.length ? context.selectedCardIds.join(", ") : "none"}
      </p>
      <p className="text-sm text-muted-foreground">
        Cards that are suspended, buried, or already in another filtered deck will not be moved.
      </p>
      <Button onClick={buildFilteredDeck} type="button">
        Build filtered deck
      </Button>
      {report ? <p className="text-sm text-muted-foreground">{report}</p> : null}
    </section>
  );
}

type FilteredDeckOrder = "due" | "oldest" | "random";

const FILTERED_DECK_ORDER_OPTIONS: Array<[FilteredDeckOrder, string]> = [
  ["due", "Due order"],
  ["oldest", "Oldest seen first"],
  ["random", "Random"],
];

function matchesFilteredDeckQuery(card: CardPreview, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery || normalizedQuery === "all cards") {
    return true;
  }

  if (normalizedQuery.startsWith("cid:")) {
    const cardIds = normalizedQuery
      .slice(4)
      .split(",")
      .map((cardId) => cardId.trim());

    return cardIds.includes(card.id.toLowerCase());
  }

  return `${card.front} ${card.back} ${card.ankiSortField ?? ""}`
    .toLowerCase()
    .includes(normalizedQuery);
}

function isMovableFilteredDeckCard(card: CardPreview) {
  return (card.ankiQueue ?? 0) >= 0;
}

function orderFilteredDeckCards(cards: CardPreview[], order: FilteredDeckOrder) {
  switch (order) {
    case "oldest":
      return [...cards].sort((first, second) => first.repetitions - second.repetitions);
    case "random":
      return [...cards].sort((first, second) => first.id.localeCompare(second.id)).reverse();
    case "due":
      return [...cards].sort((first, second) => (first.ankiDue ?? 0) - (second.ankiDue ?? 0));
  }
}

function getFilteredDeckOrderLabel(order: FilteredDeckOrder) {
  return FILTERED_DECK_ORDER_OPTIONS.find(([value]) => value === order)?.[1] ?? order;
}

function collapseCardsByNote(cards: CardPreview[]) {
  const noteRows = new Map<string, CardPreview>();

  for (const card of cards) {
    if (!noteRows.has(card.noteId)) {
      noteRows.set(card.noteId, card);
    }
  }

  return Array.from(noteRows.values());
}

function CardPreviewWindow({ card, onClose }: { card: CardPreview; onClose: () => void }) {
  return (
    <section
      aria-label="Card Preview"
      className="fixed right-4 bottom-4 z-50 grid w-[min(26rem,calc(100vw-2rem))] gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-normal">Card Preview</h2>
        <Button
          aria-label="Close preview"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid gap-3 rounded-md border border-border p-3">
        <div>
          <p className="text-xs text-muted-foreground">Question</p>
          <p className="wrap-anywhere font-medium">{card.front}</p>
        </div>
        <Separator />
        <div>
          <p className="text-xs text-muted-foreground">Answer</p>
          <p className="wrap-anywhere">{card.back}</p>
        </div>
      </div>
    </section>
  );
}

function CardInfoWindow({ card, onClose }: { card: CardPreview; onClose: () => void }) {
  const cardInfo = {
    cardId: card.id,
    cardType: card.ankiCardType,
    deckId: card.deckId,
    deckName: card.deckName,
    dueAt: card.dueAt,
    front: card.front,
    intervalDays: card.intervalDays,
    noteId: card.noteId,
    queue: card.ankiQueue,
    repetitions: card.repetitions,
    state: getCardStateName(card),
  };

  const copyCardInfo = () => {
    const serializedCardInfo = JSON.stringify(cardInfo, null, 2);

    (
      window as unknown as {
        __orbitClipboardText?: string;
      }
    ).__orbitClipboardText = serializedCardInfo;

    void navigator.clipboard.writeText(serializedCardInfo).catch(() => undefined);
  };

  return (
    <section
      aria-label="Card Info"
      className="fixed top-20 right-4 z-50 grid w-[min(28rem,calc(100vw-2rem))] gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
      tabIndex={-1}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Card Info</h2>
          <p className="text-sm text-muted-foreground">Review log and scheduling metadata.</p>
        </div>
        <Button
          aria-label="Close card info"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Card ID</dt>
        <dd className="wrap-anywhere">{card.id}</dd>
        <dt className="text-muted-foreground">Note ID</dt>
        <dd className="wrap-anywhere">{card.noteId}</dd>
        <dt className="text-muted-foreground">Deck</dt>
        <dd>{card.deckName}</dd>
        <dt className="text-muted-foreground">State</dt>
        <dd>{cardInfo.state}</dd>
        <dt className="text-muted-foreground">Due</dt>
        <dd>{formatDueDate(card.dueAt)}</dd>
        <dt className="text-muted-foreground">Interval</dt>
        <dd>{card.intervalDays} days</dd>
        <dt className="text-muted-foreground">Reviews</dt>
        <dd>{card.repetitions}</dd>
      </dl>
      <section className="grid gap-1 rounded-md border border-border p-3">
        <h3 className="text-sm font-medium">Review log</h3>
        <p className="text-sm text-muted-foreground">
          {card.repetitions > 0
            ? `${card.repetitions} review(s) recorded for this card.`
            : "No reviews recorded for this card."}
        </p>
      </section>
      <div className="flex justify-end">
        <Button onClick={copyCardInfo} size="sm" type="button" variant="outline">
          <Copy className="size-4" />
          Copy card info
        </Button>
      </div>
    </section>
  );
}

type StatisticsScope = "collection" | "deck";
type StatisticsRange = "1-month" | "1-year" | "deck-life";

interface StatisticsCounts {
  due: number;
  learning: number;
  new: number;
  review: number;
  total: number;
}

function StatisticsWindow({
  cards,
  currentDeckCounts,
  currentDeckId,
  defaultScope = "deck",
  decks,
  onClose,
}: {
  cards: CardPreview[];
  currentDeckCounts: StatisticsCounts;
  currentDeckId: string;
  defaultScope?: StatisticsScope;
  decks: DeckSummary[];
  onClose: () => void;
}) {
  const [scope, setScope] = useState<StatisticsScope>(defaultScope);
  const [range, setRange] = useState<StatisticsRange>("1-month");
  const [selectedDeckId, setSelectedDeckId] = useState(currentDeckId);
  const selectedDeck = decks.find((deckOption) => deckOption.id === selectedDeckId);
  const selectedDeckName = selectedDeck?.name ?? "Default";
  const selectedDeckCounts =
    selectedDeckId === currentDeckId
      ? currentDeckCounts
      : {
          due: selectedDeck?.dueCards ?? 0,
          learning: selectedDeck?.learningCards ?? 0,
          new: selectedDeck?.newCards ?? 0,
          review: selectedDeck?.reviewCards ?? 0,
          total: selectedDeck?.totalCards ?? 0,
        };
  const collectionCounts = decks.reduce<StatisticsCounts>(
    (totals, deckOption) => ({
      due: totals.due + deckOption.dueCards,
      learning: totals.learning + deckOption.learningCards,
      new: totals.new + deckOption.newCards,
      review: totals.review + deckOption.reviewCards,
      total: totals.total + deckOption.totalCards,
    }),
    { due: 0, learning: 0, new: 0, review: 0, total: 0 },
  );
  const reportCounts = scope === "deck" ? selectedDeckCounts : collectionCounts;
  const reportDeckName = scope === "deck" ? selectedDeckName : "All decks";
  const reviewedCards = cards.filter((card) => card.repetitions > 0);
  const retention =
    reviewedCards.length === 0
      ? "100%"
      : `${Math.round((reviewedCards.filter((card) => card.intervalDays > 0).length / reviewedCards.length) * 100)}%`;
  const workload = reportCounts.new + reportCounts.learning + reportCounts.review;

  return (
    <section
      aria-label="Statistics"
      className="fixed top-8 left-1/2 z-50 grid max-h-[calc(100vh-4rem)] w-[min(50rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 overflow-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Statistics</h2>
          <p className="text-sm text-muted-foreground">
            Review history, workload, retention, and deck progress.
          </p>
        </div>
        <Button
          aria-label="Close statistics"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Scope</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={scope === "deck"}
                name="statistics-scope"
                onChange={() => setScope("deck")}
                type="radio"
              />
              Deck
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={scope === "collection"}
                name="statistics-scope"
                onChange={() => setScope("collection")}
                type="radio"
              />
              Collection
            </label>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Time range</legend>
            {STATISTICS_RANGE_OPTIONS.map(([value, label]) => (
              <label className="flex items-center gap-2 text-sm" key={value}>
                <input
                  checked={range === value}
                  name="statistics-range"
                  onChange={() => setRange(value)}
                  type="radio"
                />
                {label}
              </label>
            ))}
          </fieldset>
          <label className="grid gap-1 text-sm font-medium">
            Statistics deck
            <select
              aria-label="Statistics deck"
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              disabled={scope === "collection"}
              onChange={(event) => setSelectedDeckId(event.currentTarget.value)}
              value={selectedDeckId}
            >
              {decks.map((deckOption) => (
                <option key={deckOption.id} value={deckOption.id}>
                  {deckOption.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <section
          aria-label="Statistics report web view"
          className="grid gap-3 rounded-md border border-border bg-card p-4 text-sm"
        >
          <div>
            <h3 className="text-base font-semibold tracking-normal">Statistics report</h3>
            <p className="text-muted-foreground">
              Scope: {scope === "deck" ? "Deck" : "Collection"}
            </p>
            <p className="text-muted-foreground">Deck: {reportDeckName}</p>
            <p className="text-muted-foreground">Window: {getStatisticsRangeLabel(range)}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <StatisticMetric label="Cards" value={reportCounts.total} />
            <StatisticMetric label="Due workload" value={workload} />
            <StatisticMetric label="New" value={reportCounts.new} />
            <StatisticMetric label="Learning" value={reportCounts.learning} />
            <StatisticMetric label="Reviews" value={reportCounts.review} />
            <StatisticMetric label="Retention" value={retention} />
          </div>
          <div className="grid gap-1 text-muted-foreground">
            <p>Review history chart: {reviewedCards.length} reviewed card(s)</p>
            <p>Forecast chart: {reportCounts.due} due card(s)</p>
            <p>Workload chart: {workload} queued card(s)</p>
          </div>
        </section>
      </div>
    </section>
  );
}

const STATISTICS_RANGE_OPTIONS: Array<[StatisticsRange, string]> = [
  ["1-month", "1 month"],
  ["1-year", "1 year"],
  ["deck-life", "Deck life"],
];

function StatisticMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tracking-normal">{value}</p>
    </div>
  );
}

function getStatisticsRangeLabel(range: StatisticsRange) {
  switch (range) {
    case "1-month":
      return "1 month";
    case "1-year":
      return "1 year";
    case "deck-life":
      return "deck life";
  }
}

function TextOption({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input
        aria-label={label}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      />
    </label>
  );
}

function NumberOption({
  label,
  onChange,
  step,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  step?: string;
  value: number;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input
        aria-label={label}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectOption({
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
      <select
        aria-label={label}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxOption({
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
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function UnburyCardsWindow({
  manuallyBuriedCardCount,
  onClose,
  schedulerBuriedCardCount,
}: {
  manuallyBuriedCardCount: number;
  onClose: () => void;
  schedulerBuriedCardCount: number;
}) {
  return (
    <section
      aria-label="Unbury Cards"
      className="fixed top-28 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-normal">Unbury Cards</h2>
        <Button
          aria-label="Close unbury cards"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid gap-2">
        {manuallyBuriedCardCount > 0 ? (
          <Button type="button" variant="outline">
            Manually buried cards
          </Button>
        ) : null}
        {schedulerBuriedCardCount > 0 ? (
          <Button type="button" variant="outline">
            Scheduler-buried siblings
          </Button>
        ) : null}
      </div>
    </section>
  );
}
