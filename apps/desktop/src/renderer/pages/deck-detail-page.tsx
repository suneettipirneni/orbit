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
  Search,
  Shuffle,
  Table,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link, useParams } from "react-router";
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
import { CardForm } from "@/features/cards/card-form";
import { ReviewPanel } from "@/features/reviews/review-panel";
import { QueryInput } from "@/features/search/query-input";
import { formatDueDate } from "@/lib/date-format";
import { useUpdateCardMutation } from "@/lib/mutations/card";
import { useUpdateDeckMutation } from "@/lib/mutations/deck";
import { useDeleteNoteMutation, useUpdateNoteMutation } from "@/lib/mutations/note";
import { deckCardsQueryOptions, deckQueryOptions, decksQueryOptions } from "@/lib/queries/deck";

export function DeckDetailPage() {
  "use no memo";

  const { deckId } = useParams();
  const resolvedDeckId = getDeckId(deckId);
  const deck = useQuery(deckQueryOptions(resolvedDeckId));
  const decks = useQuery(decksQueryOptions({ pageSize: 100 }));
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [browserLayoutMode, setBrowserLayoutMode] = useState<BrowserLayoutMode>("auto");
  const [displayMode, setDisplayMode] = useState<BrowserDisplayMode>("cards");
  const [isCardInfoOpen, setIsCardInfoOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isWideBrowserViewport, setIsWideBrowserViewport] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= window.innerHeight,
  );
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [queryText, setQueryText] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sidebarFilter, setSidebarFilter] = useState("");
  const [submittedQueryText, setSubmittedQueryText] = useState("");
  const cardListRef = useRef<HTMLElement>(null);
  const sidebarFilterRef = useRef<HTMLInputElement>(null);
  const deckCards = useQuery(
    deckCardsQueryOptions(resolvedDeckId, {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      query: submittedQueryText || undefined,
    }),
  );
  const updateDeck = useUpdateDeckMutation();
  const updateCard = useUpdateCardMutation();
  const deleteNote = useDeleteNoteMutation();
  const updateNote = useUpdateNoteMutation();
  const browserRows = useMemo(
    () =>
      displayMode === "notes"
        ? collapseCardsByNote(deckCards.data?.data ?? [])
        : (deckCards.data?.data ?? []),
    [deckCards.data?.data, displayMode],
  );
  const browserRowCount =
    displayMode === "notes" ? browserRows.length : (deckCards.data?.pagination.total ?? 0);
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
  const selectedCardId = Object.keys(rowSelection)[0];
  const selectedCard = selectedCardId
    ? browserRows.find((card) => card.id === selectedCardId)
    : undefined;
  const selectedRowIndex = selectedCardId
    ? browserRows.findIndex((card) => card.id === selectedCardId)
    : -1;
  const selectedCardIds = browserRows
    .filter((card) => rowSelection[card.id])
    .map((card) => card.id);
  const selectedNoteIds = Array.from(
    new Set(browserRows.filter((card) => rowSelection[card.id]).map((card) => card.noteId)),
  );
  const hasSelectedRows = Object.keys(rowSelection).length > 0;
  const effectiveBrowserLayout =
    browserLayoutMode === "auto"
      ? isWideBrowserViewport
        ? "horizontal"
        : "vertical"
      : browserLayoutMode;

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setQueryText("");
    setRowSelection({});
    setSubmittedQueryText("");
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
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {deck.data.deck.description}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border text-sm md:max-w-xl">
            <CountCell label="New" value={deck.data.counts.new} />
            <CountCell label="Learning" value={deck.data.counts.learning} />
            <CountCell label="To Review" value={deck.data.counts.review} />
          </div>
        </section>
        <CardForm deckId={resolvedDeckId} deckName={deck.data.deck.name} />
        <ReviewPanel deckId={resolvedDeckId} />
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
              onAddTag={(tag) => {
                if (selectedNoteIds.length === 0) {
                  return;
                }

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
                if (!selectedCard) {
                  return;
                }

                updateCard.mutate({
                  cardId: selectedCard.id,
                  deckId: resolvedDeckId,
                  input: { buried: true },
                });
              }}
              onChangeDeck={(targetDeckId) => {
                if (selectedCardIds.length === 0) {
                  return;
                }

                for (const cardId of selectedCardIds) {
                  updateCard.mutate({
                    cardId,
                    deckId: resolvedDeckId,
                    input: { deckId: targetDeckId },
                  });
                }
              }}
              onToggleSuspend={() => {
                if (!selectedCard) {
                  return;
                }

                updateCard.mutate({
                  cardId: selectedCard.id,
                  deckId: resolvedDeckId,
                  input: { suspended: selectedCard.ankiQueue !== -1 },
                });
              }}
              onForget={() => {
                if (!selectedCard) {
                  return;
                }

                updateCard.mutate({
                  cardId: selectedCard.id,
                  deckId: resolvedDeckId,
                  input: { forget: true },
                });
              }}
              onSetDueDate={(dueAt) => {
                if (!selectedCard) {
                  return;
                }

                updateCard.mutate({
                  cardId: selectedCard.id,
                  deckId: resolvedDeckId,
                  input: { dueAt },
                });
              }}
              onReposition={(position) => {
                if (selectedCardIds.length === 0) {
                  return;
                }

                for (const cardId of selectedCardIds) {
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
                if (!selectedCard) {
                  return;
                }

                updateCard.mutate({
                  cardId: selectedCard.id,
                  deckId: resolvedDeckId,
                  input: { flag },
                });
              }}
              onSave={(input) => {
                if (!selectedCard) {
                  return;
                }

                updateNote.mutate({
                  input,
                  noteId: selectedCard.noteId,
                });
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
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}

type BrowserDisplayMode = "cards" | "notes";
type BrowserLayoutMode = "auto" | "horizontal" | "vertical";

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
  decks,
  filter,
  filterRef,
  onActivateDeck,
  onFilterChange,
}: {
  activeDeckId: string;
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
    void navigator.clipboard.writeText(JSON.stringify(cardInfo, null, 2));
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

function SelectedNoteEditor({
  card,
  deckOptions,
  isDeleting,
  isSaving,
  isUpdatingCard,
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

function getDeckId(deckId: string | undefined) {
  if (!deckId) {
    throw new Error("DeckDetailPage requires a deckId route param.");
  }

  return deckId;
}
