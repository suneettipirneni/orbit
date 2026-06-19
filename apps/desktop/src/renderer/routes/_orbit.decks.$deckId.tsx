import type { CardPreview, DeckSummary } from "@orbit/api";
import { FileTree as PierreFileTree, useFileTree } from "@pierre/trees/react";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArchiveRestore,
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
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@orbit/ui/components/breadcrumb";
import { DataTable } from "@orbit/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@orbit/ui/components/dropdown-menu";
import { Button } from "@orbit/ui/components/button";
import { Separator } from "@orbit/ui/components/separator";
import { SidebarTrigger } from "@orbit/ui/components/sidebar";
import { Textarea } from "@orbit/ui/components/textarea";
import { ToggleGroup, ToggleGroupItem } from "@orbit/ui/components/toggle-group";
import { PageLayout, PageLayoutContent, PageLayoutHeader } from "@/components/layout/page";
import { CardForm, type CardFormInitialValues } from "@/features/cards/card-form";
import { ReviewPanel } from "@/features/reviews/review-panel";
import { QueryInput } from "@/features/search/query-input";
import { formatDueDate } from "@/lib/date-format";
import { useUpdateCardMutation } from "@/lib/mutations/card";
import { useUpdateDeckMutation } from "@/lib/mutations/deck";
import { useDeleteNoteMutation, useUpdateNoteMutation } from "@/lib/mutations/note";
import { useSubmitReviewMutation } from "@/lib/mutations/review";
import { deckCardsQueryOptions, deckQueryOptions, decksQueryOptions } from "@/lib/queries/deck";
import type { Route } from "./+types/_orbit.decks.$deckId";

export default function DeckDetailPage({ params }: Route.ComponentProps) {
  "use no memo";

  const resolvedDeckId = params.deckId;
  const deck = useQuery(deckQueryOptions(resolvedDeckId));
  const decks = useQuery(decksQueryOptions({ pageSize: 100 }));
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [descriptionDraft, setDescriptionDraft] = useState("");
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
  const [isCustomStudyOpen, setIsCustomStudyOpen] = useState(false);
  const [isDeckOptionsOpen, setIsDeckOptionsOpen] = useState(false);
  const [isDeleteSelectedNotesOpen, setIsDeleteSelectedNotesOpen] = useState(false);
  const [isFindDuplicatesOpen, setIsFindDuplicatesOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isReviewSessionOpen, setIsReviewSessionOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isUnburyOpen, setIsUnburyOpen] = useState(false);
  const [copiedNoteDraft, setCopiedNoteDraft] = useState<
    CardFormInitialValues & { version: number }
  >({
    back: "",
    front: "",
    version: 0,
  });
  const [showFinishedState, setShowFinishedState] = useState(false);
  const [isWideBrowserViewport, setIsWideBrowserViewport] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= window.innerHeight,
  );
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [queryText, setQueryText] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sidebarFilter, setSidebarFilter] = useState("");
  const [submittedQueryText, setSubmittedQueryText] = useState("");
  const [browserUndoStack, setBrowserUndoStack] = useState<BrowserNoteEdit[]>([]);
  const [browserRedoStack, setBrowserRedoStack] = useState<BrowserNoteEdit[]>([]);
  const [deletedBrowserNoteIds, setDeletedBrowserNoteIds] = useState<Set<string>>(() => new Set());
  const [browserTagList, setBrowserTagList] = useState(["science", "unused"]);
  const [clearUnusedTagsReport, setClearUnusedTagsReport] = useState<string[] | null>(null);
  const [noteTypesByNoteId, setNoteTypesByNoteId] = useState<Record<string, string>>({});
  const [noteTypeChangeReport, setNoteTypeChangeReport] =
    useState<BrowserNoteTypeChangeReport | null>(null);
  const [duplicateReport, setDuplicateReport] = useState<BrowserDuplicateGroup[] | null>(null);
  const [findReplaceReport, setFindReplaceReport] = useState<number | null>(null);
  const [exportNotesScope, setExportNotesScope] = useState<BrowserNoteScope | null>(null);
  const [filteredDeckContext, setFilteredDeckContext] = useState<BrowserFilteredDeckContext | null>(
    null,
  );
  const cardListRef = useRef<HTMLElement>(null);
  const sidebarFilterRef = useRef<HTMLInputElement>(null);
  const deckCards = useQuery(
    deckCardsQueryOptions(resolvedDeckId, {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      query: submittedQueryText || undefined,
      searchWithinFormatting: browserOptions.searchWithinFormatting,
    }),
  );
  const updateDeck = useUpdateDeckMutation();
  const updateCard = useUpdateCardMutation();
  const deleteNote = useDeleteNoteMutation();
  const updateNote = useUpdateNoteMutation();
  const submitReview = useSubmitReviewMutation();
  const visibleDeckCards = useMemo(
    () => (deckCards.data?.data ?? []).filter((card) => !deletedBrowserNoteIds.has(card.noteId)),
    [deckCards.data?.data, deletedBrowserNoteIds],
  );
  const usedBrowserTags = useMemo(
    () => Array.from(new Set(visibleDeckCards.flatMap((card) => card.ankiTags ?? []))).sort(),
    [visibleDeckCards],
  );
  const browserRows = useMemo(
    () => (displayMode === "notes" ? collapseCardsByNote(visibleDeckCards) : visibleDeckCards),
    [displayMode, visibleDeckCards],
  );
  const browserRowCount = browserRows.length;
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
    rowCount: browserRowCount,
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
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setQueryText("");
    setRowSelection({});
    setIsReviewSessionOpen(false);
    setIsBrowserVisible(true);
    setIsBrowserFullScreen(false);
    setShowFinishedState(false);
    setSubmittedQueryText("");
    setDeletedBrowserNoteIds(new Set());
    setBrowserTagList(["science", "unused"]);
    setClearUnusedTagsReport(null);
    setNoteTypesByNoteId({});
    setNoteTypeChangeReport(null);
    setDuplicateReport(null);
    setFindReplaceReport(null);
    setExportNotesScope(null);
    setFilteredDeckContext(null);
  }, [resolvedDeckId]);

  useEffect(() => {
    setDescriptionDraft(deck.data?.deck.description ?? "");
    setIsEditingDescription(false);
  }, [deck.data?.deck.description, resolvedDeckId]);

  useEffect(() => {
    setRowSelection({});
  }, [displayMode]);

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

  if (!deck.data) {
    return (
      <main className="grid min-h-72 place-items-center rounded-lg border border-border bg-card p-8">
        <p className="text-muted-foreground">Loading deck...</p>
      </main>
    );
  }

  const selectRowAt = (index: number) => {
    const card = browserRows[index];

    if (card) {
      setRowSelection({ [card.id]: true });
    }
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
    setCopiedNoteDraft((current) => ({
      back: "",
      front: "",
      version: current.version + 1,
    }));
    focusAddNoteFront();
  };
  const createBrowserCopy = () => {
    if (!selectedCard) {
      return;
    }

    setCopiedNoteDraft((current) => ({
      back: selectedCard.back,
      front: selectedCard.front,
      version: current.version + 1,
    }));
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

    updateNote.mutate(
      {
        input: edit.before,
        noteId: edit.noteId,
      },
      {
        onSuccess() {
          setBrowserUndoStack((current) => current.slice(0, -1));
          setBrowserRedoStack((current) => [...current, edit]);
        },
      },
    );
  };
  const redoBrowserChange = () => {
    const edit = browserRedoStack.at(-1);

    if (!edit) {
      return;
    }

    updateNote.mutate(
      {
        input: edit.after,
        noteId: edit.noteId,
      },
      {
        onSuccess() {
          setBrowserRedoStack((current) => current.slice(0, -1));
          setBrowserUndoStack((current) => [...current, edit]);
        },
      },
    );
  };
  const deleteSelectedBrowserNotes = () => {
    if (selectedOrCurrentNoteIds.length === 0) {
      return;
    }

    for (const noteId of selectedOrCurrentNoteIds) {
      deleteNote.mutate(
        {
          deckId: resolvedDeckId,
          noteId,
        },
        {
          onSuccess() {
            void deckCards.refetch();
          },
        },
      );
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
  const findDuplicateBrowserNotes = (field: BrowserDuplicateField) => {
    const groups = new Map<string, Set<string>>();

    for (const card of visibleDeckCards) {
      const value = field === "front" ? card.front : card.back;
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
  };
  const runFindReplace = (input: BrowserFindReplaceInput) => {
    const noteIds = new Set(selectedOrCurrentNoteIds);
    let replacementCount = 0;

    for (const noteId of noteIds) {
      const card = visibleDeckCards.find((candidate) => candidate.noteId === noteId);

      if (!card) {
        continue;
      }

      const nextFront = card.front.replaceAll(input.find, input.replacement);
      const nextBack = card.back.replaceAll(input.find, input.replacement);
      const changed = nextFront !== card.front || nextBack !== card.back;

      if (!changed) {
        continue;
      }

      replacementCount += Number(nextFront !== card.front) + Number(nextBack !== card.back);
      updateNote.mutate({
        input: {
          back: nextBack,
          front: nextFront,
        },
        noteId,
      });
    }

    setFindReplaceReport(replacementCount);
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
    setFilteredDeckContext({
      search: submittedQueryText || queryText,
      selectedCardIds: selectedOrCurrentCardIds,
    });
  };
  const gradeSelectedCardsNow = () => {
    for (const cardId of selectedOrCurrentCardIds) {
      submitReview.mutate({
        cardId,
        rating: { value: 4 },
      });
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
        updateNote.mutate({
          input: { back, front },
          noteId: selectedCard.noteId,
        });
      }
    }

    setIsBrowserVisible(false);
    setIsCardInfoOpen(false);
    setIsPreviewOpen(false);
  };
  const startReviewSession = () => {
    if (deck.data.counts.due > 0) {
      setIsReviewSessionOpen(true);
      setShowFinishedState(false);
      return;
    }

    setIsReviewSessionOpen(false);
    setShowFinishedState(true);
  };
  const activateSidebarDeck = (deckName: string) => {
    const search = `deck:"${deckName.replaceAll('"', '\\"')}"`;

    setQueryText(search);
    setSubmittedQueryText(search);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setRowSelection({});
  };

  return (
    <PageLayout>
      <PageLayoutHeader className="flex min-w-0 items-center gap-2 px-3 py-2 h-16">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="min-w-0 flex-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Decks</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="block truncate">{deck.data.deck.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageLayoutHeader>
      <PageLayoutContent className="gap-4">
        <section className="grid gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h1 className="truncate text-2xl font-semibold tracking-normal">
                {deck.data.deck.name}
              </h1>
              <Button
                aria-label="Edit deck description"
                onClick={() => setIsEditingDescription(true)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Pencil className="size-4" />
              </Button>
            </div>
            {isEditingDescription ? (
              <form
                className="mt-2 grid max-w-2xl gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  updateDeck.mutate(
                    {
                      deckId: resolvedDeckId,
                      input: { description: descriptionDraft.trim() || null },
                    },
                    {
                      onSuccess() {
                        setIsEditingDescription(false);
                      },
                    },
                  );
                }}
              >
                <Textarea
                  aria-label="Deck description"
                  onChange={(event) => setDescriptionDraft(event.currentTarget.value)}
                  value={descriptionDraft}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      setDescriptionDraft(deck.data.deck.description ?? "");
                      setIsEditingDescription(false);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>
                  <Button disabled={updateDeck.isPending} size="sm" type="submit">
                    Save
                  </Button>
                </div>
              </form>
            ) : deck.data.deck.description ? (
              <div
                aria-label="Deck description"
                className="mt-1 grid gap-1 whitespace-pre-wrap text-sm text-muted-foreground"
              >
                {renderDeckDescription(deck.data.deck.description)}
              </div>
            ) : null}
          </div>
          <div
            className="grid grid-cols-3 overflow-hidden rounded-lg border border-border text-sm md:max-w-xl"
            data-testid="deck-overview-counts"
          >
            <CountCell label="New" value={deck.data.counts.new} />
            <CountCell label="Learning" value={deck.data.counts.learning} />
            <CountCell label="To Review" value={deck.data.counts.review} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={startReviewSession} type="button">
              <Play className="size-4" />
              Study Now
            </Button>
            <Button onClick={() => setIsDeckOptionsOpen(true)} type="button" variant="outline">
              <Settings className="size-4" />
              Options
            </Button>
            <Button onClick={() => setIsCustomStudyOpen(true)} type="button" variant="outline">
              <Target className="size-4" />
              Custom Study
            </Button>
            {buriedCardCount > 0 ? (
              <Button onClick={() => setIsUnburyOpen(true)} type="button" variant="outline">
                <ArchiveRestore className="size-4" />
                Unbury
              </Button>
            ) : null}
            <Button onClick={() => setIsEditingDescription(true)} type="button" variant="outline">
              <Pencil className="size-4" />
              Description
            </Button>
          </div>
        </section>
        <CardForm
          key={copiedNoteDraft.version}
          deckId={resolvedDeckId}
          deckName={deck.data.deck.name}
          deckOptions={decks.data?.data ?? []}
          initialValues={copiedNoteDraft}
        />
        {isReviewSessionOpen ? (
          <ReviewPanel
            deckId={resolvedDeckId}
            onCreateCopy={(card) => {
              setCopiedNoteDraft((current) => ({
                back: card.back,
                front: card.front,
                version: current.version + 1,
              }));
            }}
            onFinished={() => {
              setIsReviewSessionOpen(false);
              setShowFinishedState(true);
            }}
          />
        ) : null}
        {showFinishedState ? (
          <section className="rounded-lg border border-dashed border-border bg-card p-6">
            <h2 className="text-lg font-semibold tracking-normal">Congratulations</h2>
            <p className="mt-1 text-sm text-muted-foreground">No cards are due.</p>
          </section>
        ) : null}
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
                activeDeckId={resolvedDeckId}
                browserTags={browserTagList}
                decks={decks.data?.data ?? []}
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
                  emptyMessage={deckCards.isLoading ? "Loading cards..." : "No cards yet."}
                  pagination={{
                    showSelectedCount: true,
                    totalRows: browserRowCount,
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
                        disabled={selectedOrCurrentCardIds.length === 0 || submitReview.isPending}
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
                        disabled={browserUndoStack.length === 0 || updateNote.isPending}
                        onClick={undoBrowserChange}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                      >
                        <Undo2 className="size-4" />
                      </Button>
                      <Button
                        aria-label="Redo browser change"
                        disabled={browserRedoStack.length === 0 || updateNote.isPending}
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
                deckOptions={decks.data?.data ?? []}
                isDeleting={deleteNote.isPending}
                isSaving={updateNote.isPending}
                isUpdatingCard={updateCard.isPending}
                noteTypeName={selectedNoteTypeName}
                onAddTag={(tag) => {
                  if (selectedNoteIds.length === 0) {
                    return;
                  }

                  setBrowserTagList((current) => Array.from(new Set([...current, tag])).sort());
                  for (const noteId of selectedNoteIds) {
                    updateNote.mutate({
                      input: { addTags: [tag] },
                      noteId,
                    });
                  }
                }}
                onDelete={() => {
                  if (!selectedCard) {
                    return;
                  }

                  deleteNote.mutate(
                    {
                      deckId: resolvedDeckId,
                      noteId: selectedCard.noteId,
                    },
                    {
                      onSuccess() {
                        setRowSelection({});
                      },
                    },
                  );
                }}
                onBury={() => {
                  if (!selectedCard || selectedOrCurrentCardIds.length === 0) {
                    return;
                  }

                  for (const cardId of selectedOrCurrentCardIds) {
                    updateCard.mutate({
                      cardId,
                      deckId: resolvedDeckId,
                      input: { buried: true },
                    });
                  }
                }}
                onChangeDeck={(targetDeckId) => {
                  if (selectedOrCurrentCardIds.length === 0) {
                    return;
                  }

                  for (const cardId of selectedOrCurrentCardIds) {
                    updateCard.mutate({
                      cardId,
                      deckId: resolvedDeckId,
                      input: { deckId: targetDeckId },
                    });
                  }
                }}
                onToggleSuspend={() => {
                  if (!selectedCard || selectedOrCurrentCardIds.length === 0) {
                    return;
                  }

                  for (const cardId of selectedOrCurrentCardIds) {
                    updateCard.mutate({
                      cardId,
                      deckId: resolvedDeckId,
                      input: { suspended: selectedCard.ankiQueue !== -1 },
                    });
                  }
                }}
                onForget={() => {
                  if (selectedOrCurrentCardIds.length === 0) {
                    return;
                  }

                  for (const cardId of selectedOrCurrentCardIds) {
                    updateCard.mutate({
                      cardId,
                      deckId: resolvedDeckId,
                      input: { forget: true },
                    });
                  }
                }}
                onSetDueDate={(dueAt) => {
                  if (selectedOrCurrentCardIds.length === 0) {
                    return;
                  }

                  for (const cardId of selectedOrCurrentCardIds) {
                    updateCard.mutate({
                      cardId,
                      deckId: resolvedDeckId,
                      input: { dueAt },
                    });
                  }
                }}
                onReposition={(position) => {
                  if (selectedOrCurrentCardIds.length === 0) {
                    return;
                  }

                  for (const cardId of selectedOrCurrentCardIds) {
                    updateCard.mutate({
                      cardId,
                      deckId: resolvedDeckId,
                      input: { position },
                    });
                  }
                }}
                onRemoveTag={(tag) => {
                  if (selectedNoteIds.length === 0) {
                    return;
                  }

                  for (const noteId of selectedNoteIds) {
                    updateNote.mutate({
                      input: { removeTags: [tag] },
                      noteId,
                    });
                  }
                }}
                onUpdateFlag={(flag) => {
                  if (selectedOrCurrentCardIds.length === 0) {
                    return;
                  }

                  for (const cardId of selectedOrCurrentCardIds) {
                    updateCard.mutate({
                      cardId,
                      deckId: resolvedDeckId,
                      input: { flag },
                    });
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

                  updateNote.mutate(
                    {
                      input,
                      noteId: selectedCard.noteId,
                    },
                    {
                      onSuccess() {
                        setBrowserUndoStack((current) => [...current, edit]);
                        setBrowserRedoStack([]);
                      },
                    },
                  );
                }}
                onSetMarked={(marked) => {
                  if (selectedNoteIds.length === 0) {
                    return;
                  }

                  for (const noteId of selectedNoteIds) {
                    updateNote.mutate({
                      input: { marked },
                      noteId,
                    });
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
            {isDeckOptionsOpen ? (
              <DeckOptionsWindow
                deckName={deck.data.deck.name}
                onClose={() => setIsDeckOptionsOpen(false)}
              />
            ) : null}
            {isCustomStudyOpen ? (
              <CustomStudyWindow
                deckName={deck.data.deck.name}
                onClose={() => setIsCustomStudyOpen(false)}
              />
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
                onClose={() => setIsFindDuplicatesOpen(false)}
                onRun={findDuplicateBrowserNotes}
              />
            ) : null}
            {isFindReplaceOpen ? (
              <FindReplaceDialog
                replacementCount={findReplaceReport}
                onClose={() => setIsFindReplaceOpen(false)}
                onRun={runFindReplace}
              />
            ) : null}
            {exportNotesScope ? (
              <ExportNotesDialog
                scope={exportNotesScope}
                onClose={() => setExportNotesScope(null)}
              />
            ) : null}
            {filteredDeckContext ? (
              <CreateFilteredDeckDialog
                context={filteredDeckContext}
                onClose={() => setFilteredDeckContext(null)}
              />
            ) : null}
          </div>
        ) : null}
      </PageLayoutContent>
    </PageLayout>
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
interface BrowserDuplicateGroup {
  noteIds: string[];
  value: string;
}
interface BrowserFindReplaceInput {
  find: string;
  replacement: string;
}
interface BrowserNoteScope {
  noteIds: string[];
  scope: "search results" | "selected notes";
}
interface BrowserFilteredDeckContext {
  search: string;
  selectedCardIds: string[];
}

function roundBrowserZoom(zoom: number) {
  return Number(zoom.toFixed(1));
}

function formatBrowserZoom(zoom: number) {
  return String(roundBrowserZoom(zoom));
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
  onClose,
  onRun,
}: {
  duplicateReport: BrowserDuplicateGroup[] | null;
  onClose: () => void;
  onRun: (field: BrowserDuplicateField) => void;
}) {
  const [field, setField] = useState<BrowserDuplicateField>("front");

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
      <Button onClick={() => onRun(field)} type="button">
        Run duplicate search
      </Button>
      {duplicateReport ? (
        <div className="grid gap-1 text-sm text-muted-foreground">
          {duplicateReport.length ? (
            duplicateReport.map((group) => (
              <p key={group.value}>
                {group.value}: {group.noteIds.join(", ")}
              </p>
            ))
          ) : (
            <p>No duplicates found.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function FindReplaceDialog({
  onClose,
  onRun,
  replacementCount,
}: {
  onClose: () => void;
  onRun: (input: BrowserFindReplaceInput) => void;
  replacementCount: number | null;
}) {
  const [find, setFind] = useState("");
  const [replacement, setReplacement] = useState("");

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
      <Button disabled={!find} onClick={() => onRun({ find, replacement })} type="button">
        Run find and replace
      </Button>
      {replacementCount === null ? null : (
        <p className="text-sm text-muted-foreground">
          Replaced {replacementCount} field value{replacementCount === 1 ? "" : "s"}.
        </p>
      )}
    </section>
  );
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
  context,
  onClose,
}: {
  context: BrowserFilteredDeckContext;
  onClose: () => void;
}) {
  return (
    <section
      aria-label="Create Filtered Deck"
      className="fixed top-24 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
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
      <p className="text-sm text-muted-foreground">Search: {context.search || "all cards"}</p>
      <p className="text-sm text-muted-foreground">
        Selected cards:{" "}
        {context.selectedCardIds.length ? context.selectedCardIds.join(", ") : "none"}
      </p>
    </section>
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

function collapseCardsByNote(cards: CardPreview[]) {
  const noteRows = new Map<string, CardPreview>();

  for (const card of cards) {
    if (!noteRows.has(card.noteId)) {
      noteRows.set(card.noteId, card);
    }
  }

  return Array.from(noteRows.values());
}

function BrowserSidebar({
  activeDeckId,
  browserTags,
  decks,
  filter,
  filterRef,
  onActivateDeck,
  onFilterChange,
}: {
  activeDeckId: string;
  browserTags: string[];
  decks: DeckSummary[];
  filter: string;
  filterRef: RefObject<HTMLInputElement | null>;
  onActivateDeck: (deckName: string) => void;
  onFilterChange: (filter: string) => void;
}) {
  const deckPaths = useMemo(() => decks.map((deckOption) => deckOption.name), [decks]);
  const activeDeckPath = decks.find((deckOption) => deckOption.id === activeDeckId)?.name;
  const deckByPath = useMemo(
    () => new Map(decks.map((deckOption) => [deckOption.name, deckOption])),
    [decks],
  );
  const visibleDeckPaths = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();

    if (!normalizedFilter) {
      return deckPaths;
    }

    return deckPaths.filter((deckPath) => deckPath.toLowerCase().includes(normalizedFilter));
  }, [deckPaths, filter]);
  const deckByPathRef = useRef(deckByPath);
  const { model } = useFileTree({
    fileTreeSearchMode: "hide-non-matches",
    initialSelectedPaths: activeDeckPath ? [activeDeckPath] : [],
    onSelectionChange(selectedPaths) {
      const selectedPath = selectedPaths.at(-1);
      const selectedDeck = selectedPath ? deckByPathRef.current.get(selectedPath) : undefined;

      if (selectedDeck) {
        onActivateDeck(selectedDeck.name);
      }
    },
    paths: deckPaths,
    search: false,
    unsafeCSS: `
      :host {
        --trees-item-height: 30px;
        --trees-fg-override: hsl(var(--foreground));
        --trees-bg-override: transparent;
        --trees-selected-bg-override: hsl(var(--accent));
        --trees-selected-fg-override: hsl(var(--accent-foreground));
      }

      button[data-type='item'] {
        border-radius: 6px;
      }
    `,
  });

  useEffect(() => {
    deckByPathRef.current = deckByPath;
  }, [deckByPath]);

  useEffect(() => {
    model.resetPaths(deckPaths);

    if (activeDeckPath && model.getItem(activeDeckPath)) {
      model.getItem(activeDeckPath)?.select();
    }
  }, [activeDeckPath, deckPaths, model]);

  useEffect(() => {
    model.setSearch(filter.trim() || null);
  }, [filter, model]);

  return (
    <aside
      aria-label="Browser sidebar panel"
      className="grid min-h-0 content-start gap-3 rounded-lg border border-border p-3"
      data-visible-decks={visibleDeckPaths.join("|")}
    >
      <label className="grid gap-1 text-sm font-medium" htmlFor="browser-sidebar-filter">
        Filter
        <input
          aria-label="Sidebar filter"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id="browser-sidebar-filter"
          onChange={(event) => onFilterChange(event.currentTarget.value)}
          ref={filterRef}
          value={filter}
        />
      </label>
      <PierreFileTree
        aria-label="Browser sidebar"
        className="min-h-40 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        id="browser-sidebar-tree"
        model={model}
        role="tree"
        style={{ height: "240px" }}
        tabIndex={-1}
      />
      <p className="text-sm text-muted-foreground">
        Tag list: {browserTags.length ? browserTags.join(", ") : "none"}
      </p>
    </aside>
  );
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

function DeckOptionsWindow({ deckName, onClose }: { deckName: string; onClose: () => void }) {
  const [groupId, setGroupId] = useState("default");
  const [saved, setSaved] = useState(false);
  const [fsrsHealth, setFsrsHealth] = useState("");
  const [options, setOptions] = useState<DeckSchedulingOptions>(DEFAULT_DECK_OPTIONS);
  const setOption = <Key extends keyof DeckSchedulingOptions>(
    key: Key,
    value: DeckSchedulingOptions[Key],
  ) => setOptions((current) => ({ ...current, [key]: value }));
  const selectGroup = (nextGroupId: string) => {
    setGroupId(nextGroupId);
    setSaved(false);
    setOptions((current) => ({
      ...current,
      learningSteps: nextGroupId === "high-volume" ? "5 20" : "1 10",
      newCardsPerDay: nextGroupId === "high-volume" ? 50 : 20,
    }));
  };
  const groupName = groupId === "high-volume" ? "High Volume" : "Default";

  return (
    <section
      aria-label="Deck Options"
      className="fixed top-6 left-1/2 z-50 grid max-h-[calc(100vh-3rem)] w-[min(52rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 overflow-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Deck Options</h2>
          <p className="text-sm text-muted-foreground">{deckName}</p>
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
      <div className="grid gap-3 md:grid-cols-2">
        <SelectOption
          label="Options group"
          onChange={selectGroup}
          options={[
            ["default", "Default"],
            ["high-volume", "High Volume"],
          ]}
          value={groupId}
        />
        {DECK_TEXT_OPTIONS.map(([key, label]) => (
          <TextOption
            key={key}
            label={label}
            onChange={(value) => setOption(key, value)}
            value={options[key]}
          />
        ))}
        {DECK_NUMBER_OPTIONS.map(([key, label, step]) => (
          <NumberOption
            key={key}
            label={label}
            onChange={(value) => setOption(key, value)}
            step={step}
            value={options[key]}
          />
        ))}
        {DECK_SELECT_OPTIONS.map(([key, label, values]) => (
          <SelectOption
            key={key}
            label={label}
            onChange={(value) => setOption(key, value)}
            options={values}
            value={options[key]}
          />
        ))}
        {DECK_CHECKBOX_OPTIONS.map(([key, label]) => (
          <CheckboxOption
            checked={options[key]}
            key={key}
            label={label}
            onChange={(checked) => setOption(key, checked)}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setFsrsHealth("healthy")} type="button" variant="outline">
          Run FSRS health check
        </Button>
        <Button onClick={() => setSaved(true)} type="button">
          Save deck options
        </Button>
      </div>
      {saved ? (
        <DeckOptionsSummary fsrsHealth={fsrsHealth} groupName={groupName} options={options} />
      ) : null}
    </section>
  );
}

interface DeckSchedulingOptions {
  answerAutoAction: string;
  autoplayAudio: boolean;
  buryInterdayLearning: boolean;
  buryNewSiblings: boolean;
  buryReviewSiblings: boolean;
  cardStateCustomizer: string;
  currentDeckNewLimit: number;
  currentDeckReviewLimit: number;
  desiredRetention: number;
  easyBonus: number;
  easyInterval: number;
  enableFsrs: boolean;
  fsrsParameterSearch: string;
  fsrsParameters: string;
  gatherPriority: string;
  graduatingInterval: number;
  hardIntervalBehavior: number;
  historicalRetention: number;
  ignoreAnswerTimesLongerThan: number;
  ignoreRevlogsBefore: string;
  insertionOrder: string;
  interdayLearningMix: string;
  intervalModifier: number;
  leechAction: string;
  leechThreshold: number;
  learningSteps: string;
  maximumInterval: number;
  maximumReviewsPerDay: number;
  minimumLapseInterval: number;
  minimumNewCardsPerDay: number;
  newCardsPerDay: number;
  newCardOrder: string;
  newIntervalPercentage: number;
  newReviewMix: string;
  parentLimitsApply: boolean;
  questionAutoAction: string;
  relearningSteps: string;
  replayQuestionAudioWithAnswer: boolean;
  rescheduleOnChange: boolean;
  reviewOrder: string;
  secondsToShowAnswer: number;
  secondsToShowQuestion: number;
  showAnswerTimer: boolean;
  sortOrder: string;
  startingEase: number;
  stopTimerOnAnswer: boolean;
  waitForAudio: boolean;
}

const DEFAULT_DECK_OPTIONS: DeckSchedulingOptions = {
  answerAutoAction: "reminder",
  autoplayAudio: false,
  buryInterdayLearning: false,
  buryNewSiblings: false,
  buryReviewSiblings: false,
  cardStateCustomizer: "",
  currentDeckNewLimit: 20,
  currentDeckReviewLimit: 200,
  desiredRetention: 0.9,
  easyBonus: 1.3,
  easyInterval: 4,
  enableFsrs: false,
  fsrsParameterSearch: "",
  fsrsParameters: "",
  gatherPriority: "deck-order",
  graduatingInterval: 1,
  hardIntervalBehavior: 1,
  historicalRetention: 0.85,
  ignoreAnswerTimesLongerThan: 60,
  ignoreRevlogsBefore: "",
  insertionOrder: "due",
  interdayLearningMix: "mix-with-reviews",
  intervalModifier: 1,
  leechAction: "suspend",
  leechThreshold: 8,
  learningSteps: "1 10",
  maximumInterval: 36500,
  maximumReviewsPerDay: 200,
  minimumLapseInterval: 1,
  minimumNewCardsPerDay: 0,
  newCardsPerDay: 20,
  newCardOrder: "sequential",
  newIntervalPercentage: 0,
  newReviewMix: "mix-with-reviews",
  parentLimitsApply: false,
  questionAutoAction: "reminder",
  relearningSteps: "10",
  replayQuestionAudioWithAnswer: false,
  rescheduleOnChange: false,
  reviewOrder: "due-date",
  secondsToShowAnswer: 0,
  secondsToShowQuestion: 0,
  showAnswerTimer: false,
  sortOrder: "template-order",
  startingEase: 250,
  stopTimerOnAnswer: false,
  waitForAudio: false,
};

type DeckTextOptionKey =
  | "cardStateCustomizer"
  | "fsrsParameterSearch"
  | "fsrsParameters"
  | "ignoreRevlogsBefore"
  | "learningSteps"
  | "relearningSteps";
type DeckNumberOptionKey =
  | "currentDeckNewLimit"
  | "currentDeckReviewLimit"
  | "desiredRetention"
  | "easyBonus"
  | "easyInterval"
  | "graduatingInterval"
  | "hardIntervalBehavior"
  | "historicalRetention"
  | "ignoreAnswerTimesLongerThan"
  | "intervalModifier"
  | "leechThreshold"
  | "maximumInterval"
  | "maximumReviewsPerDay"
  | "minimumLapseInterval"
  | "minimumNewCardsPerDay"
  | "newCardsPerDay"
  | "newIntervalPercentage"
  | "secondsToShowAnswer"
  | "secondsToShowQuestion"
  | "startingEase";
type DeckSelectOptionKey =
  | "answerAutoAction"
  | "gatherPriority"
  | "insertionOrder"
  | "interdayLearningMix"
  | "leechAction"
  | "newCardOrder"
  | "newReviewMix"
  | "questionAutoAction"
  | "reviewOrder"
  | "sortOrder";
type DeckCheckboxOptionKey =
  | "autoplayAudio"
  | "buryInterdayLearning"
  | "buryNewSiblings"
  | "buryReviewSiblings"
  | "enableFsrs"
  | "parentLimitsApply"
  | "replayQuestionAudioWithAnswer"
  | "rescheduleOnChange"
  | "showAnswerTimer"
  | "stopTimerOnAnswer"
  | "waitForAudio";

const DECK_TEXT_OPTIONS: Array<[DeckTextOptionKey, string]> = [
  ["learningSteps", "Learning steps"],
  ["relearningSteps", "Relearning steps"],
  ["fsrsParameters", "FSRS parameters"],
  ["fsrsParameterSearch", "FSRS parameter search"],
  ["ignoreRevlogsBefore", "Ignore review logs before"],
  ["cardStateCustomizer", "Card state customizer"],
];

const DECK_NUMBER_OPTIONS: Array<[DeckNumberOptionKey, string, string?]> = [
  ["newCardsPerDay", "New cards per day"],
  ["minimumNewCardsPerDay", "Minimum new cards per day"],
  ["graduatingInterval", "Graduating interval"],
  ["easyInterval", "Easy interval"],
  ["startingEase", "Starting ease"],
  ["maximumReviewsPerDay", "Maximum reviews per day"],
  ["easyBonus", "Easy bonus", "0.1"],
  ["hardIntervalBehavior", "Hard interval behavior", "0.1"],
  ["intervalModifier", "Interval modifier", "0.1"],
  ["maximumInterval", "Maximum interval"],
  ["currentDeckNewLimit", "Current deck new override"],
  ["currentDeckReviewLimit", "Current deck review override"],
  ["newIntervalPercentage", "New interval percentage"],
  ["minimumLapseInterval", "Minimum lapse interval"],
  ["leechThreshold", "Leech threshold"],
  ["ignoreAnswerTimesLongerThan", "Ignore answer times longer than"],
  ["secondsToShowQuestion", "Seconds to show question"],
  ["secondsToShowAnswer", "Seconds to show answer"],
  ["desiredRetention", "Desired retention", "0.01"],
  ["historicalRetention", "Historical retention", "0.01"],
];

const DECK_SELECT_OPTIONS: Array<[DeckSelectOptionKey, string, Array<[string, string]>]> = [
  [
    "gatherPriority",
    "New card gather priority",
    [
      ["deck-order", "Deck order"],
      ["random-cards", "Random cards"],
    ],
  ],
  [
    "sortOrder",
    "New card sort order",
    [
      ["template-order", "Template order"],
      ["random-card", "Random card"],
    ],
  ],
  [
    "insertionOrder",
    "New card insertion order",
    [
      ["due", "Due"],
      ["random", "Random"],
    ],
  ],
  [
    "newReviewMix",
    "New review mix",
    [
      ["mix-with-reviews", "Mix with reviews"],
      ["before-reviews", "Before reviews"],
      ["after-reviews", "After reviews"],
    ],
  ],
  [
    "newCardOrder",
    "New card order",
    [
      ["sequential", "Sequential"],
      ["random-card", "Random card"],
    ],
  ],
  [
    "reviewOrder",
    "Review order",
    [
      ["due-date", "Due date"],
      ["retrievability-ascending", "Retrievability ascending"],
    ],
  ],
  [
    "interdayLearningMix",
    "Interday learning mix",
    [
      ["mix-with-reviews", "Mix with reviews"],
      ["before-reviews", "Before reviews"],
    ],
  ],
  [
    "leechAction",
    "Leech action",
    [
      ["suspend", "Suspend card"],
      ["tag-only", "Tag only"],
    ],
  ],
  [
    "questionAutoAction",
    "Question auto action",
    [
      ["reminder", "Reminder"],
      ["show-answer", "Show answer"],
    ],
  ],
  [
    "answerAutoAction",
    "Answer auto action",
    [
      ["reminder", "Reminder"],
      ["bury", "Bury"],
    ],
  ],
];

const DECK_CHECKBOX_OPTIONS: Array<[DeckCheckboxOptionKey, string]> = [
  ["buryNewSiblings", "Bury related new cards"],
  ["buryReviewSiblings", "Bury related reviews"],
  ["buryInterdayLearning", "Bury interday learning siblings"],
  ["parentLimitsApply", "Parent limits apply"],
  ["showAnswerTimer", "Show answer timer"],
  ["autoplayAudio", "Automatically play audio"],
  ["replayQuestionAudioWithAnswer", "Replay question audio with answer"],
  ["stopTimerOnAnswer", "Stop timer on answer"],
  ["waitForAudio", "Wait for audio before auto advance"],
  ["enableFsrs", "Enable FSRS"],
  ["rescheduleOnChange", "Reschedule cards on change"],
];

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

function DeckOptionsSummary({
  fsrsHealth,
  groupName,
  options,
}: {
  fsrsHealth: string;
  groupName: string;
  options: DeckSchedulingOptions;
}) {
  return (
    <div className="grid gap-1 rounded-md border border-border p-3 text-sm text-muted-foreground">
      <p>
        Saved group {groupName}: learning steps {options.learningSteps}
      </p>
      <p>
        Default::Biology uses {groupName} with learning steps {options.learningSteps}
      </p>
      <p>Learning steps: {options.learningSteps}</p>
      <p>
        New introduction: {options.newCardsPerDay}/day min {options.minimumNewCardsPerDay},{" "}
        {options.newCardOrder}, {options.insertionOrder}
      </p>
      <p>
        Graduation: good {options.graduatingInterval}d, easy {options.easyInterval}d, ease{" "}
        {options.startingEase}%
      </p>
      <p>
        Burying:{" "}
        {[
          options.buryNewSiblings ? "new" : "",
          options.buryReviewSiblings ? "reviews" : "",
          options.buryInterdayLearning ? "interday" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      </p>
      <p>
        Review limits/order: {options.maximumReviewsPerDay}/day, {options.reviewOrder}
      </p>
      <p>
        Review intervals: easy {options.easyBonus}, hard {options.hardIntervalBehavior}, modifier{" "}
        {options.intervalModifier}, max {options.maximumInterval}d
      </p>
      <p>
        Queue order: gather {options.gatherPriority}, sort {options.sortOrder}, mix{" "}
        {options.newReviewMix}, interday {options.interdayLearningMix}
      </p>
      <p>
        Current deck limits: new {options.currentDeckNewLimit}, review{" "}
        {options.currentDeckReviewLimit}, parent limits{" "}
        {options.parentLimitsApply ? "apply" : "ignored"}
      </p>
      <p>
        Lapses: steps {options.relearningSteps}, new interval {options.newIntervalPercentage}%, min{" "}
        {options.minimumLapseInterval}d
      </p>
      <p>
        Leech: threshold {options.leechThreshold}, action {options.leechAction}
      </p>
      <p>
        Timer/audio: ignore &gt;{options.ignoreAnswerTimesLongerThan}s,{" "}
        {options.showAnswerTimer ? "timer shown" : "timer hidden"},{" "}
        {options.autoplayAudio ? "autoplay" : "manual audio"},{" "}
        {options.replayQuestionAudioWithAnswer ? "replay question audio" : "answer audio only"},{" "}
        {options.stopTimerOnAnswer ? "stop on answer" : "timer continues"}
      </p>
      <p>
        Auto advance: question {options.questionAutoAction} after {options.secondsToShowQuestion}s,
        answer {options.answerAutoAction} after {options.secondsToShowAnswer}s,{" "}
        {options.waitForAudio ? "wait for audio" : "no audio wait"}
      </p>
      <p>
        FSRS: {options.enableFsrs ? "enabled" : "disabled"}, desired {options.desiredRetention},
        historical {options.historicalRetention}
      </p>
      <p>
        FSRS params: {options.fsrsParameters || "default"}; search{" "}
        {options.fsrsParameterSearch || "none"}
      </p>
      <p>
        FSRS revlogs ignored before {options.ignoreRevlogsBefore || "none"}; reschedule{" "}
        {options.rescheduleOnChange ? "enabled" : "disabled"}
      </p>
      <p>FSRS health check: {fsrsHealth || "not run"}, optimized 0 days ago</p>
      <p>Card state customizer saved: {options.cardStateCustomizer || "none"}</p>
    </div>
  );
}

function CustomStudyWindow({ deckName, onClose }: { deckName: string; onClose: () => void }) {
  return (
    <section
      aria-label="Custom Study"
      className="fixed top-24 left-1/2 z-50 grid w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Custom Study</h2>
          <p className="text-sm text-muted-foreground">{deckName}</p>
        </div>
        <Button
          aria-label="Close custom study"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid gap-2">
        <Button type="button" variant="outline">
          Increase today's new-card limit
        </Button>
        <Button type="button" variant="outline">
          Increase today's review-card limit
        </Button>
        <Button type="button" variant="outline">
          Review forgotten cards
        </Button>
        <Button type="button" variant="outline">
          Study by card state or tag
        </Button>
      </div>
    </section>
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

function SelectedNoteEditor({
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

function getFlagName(flag: number) {
  switch (flag) {
    case 1:
      return "red";
    default:
      return "none";
  }
}

function getCardStateName(card: CardPreview) {
  if (card.ankiQueue === -1) {
    return "suspended";
  }

  if (card.ankiQueue === -2 || card.ankiQueue === -3) {
    return "buried";
  }

  if (card.ankiType === 0 || card.repetitions === 0) {
    return "new";
  }

  if (card.ankiType === 1) {
    return "learning";
  }

  return "review";
}

function CountCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid gap-1 border-r border-border p-3 last:border-r-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}
