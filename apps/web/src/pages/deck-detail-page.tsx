import type { CardPreview } from "@orbit/api";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
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
import { Separator } from "@orbit/ui/components/separator";
import { SidebarTrigger } from "@orbit/ui/components/sidebar";
import { PageLayout, PageLayoutContent, PageLayoutHeader } from "@/components/layout/page";
import { QueryInput } from "@/features/search/query-input";
import { formatDueDate } from "@/lib/date-format";
import { deckCardsQueryOptions, deckQueryOptions } from "@/lib/queries/deck";

export function DeckDetailPage() {
  "use no memo";

  const { deckId } = useParams();
  const resolvedDeckId = getDeckId(deckId);
  const deck = useQuery(deckQueryOptions(resolvedDeckId));
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [queryText, setQueryText] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [submittedQueryText, setSubmittedQueryText] = useState("");
  const deckCards = useQuery(
    deckCardsQueryOptions(resolvedDeckId, {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      query: submittedQueryText || undefined,
    }),
  );
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
    data: deckCards.data?.data ?? [],
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    rowCount: deckCards.data?.pagination.total ?? 0,
    state: {
      columnVisibility,
      pagination,
      rowSelection,
    },
  });

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setQueryText("");
    setRowSelection({});
    setSubmittedQueryText("");
  }, [resolvedDeckId]);

  if (!deck.data) {
    return (
      <main className="grid min-h-72 place-items-center rounded-lg border border-border bg-card p-8">
        <p className="text-muted-foreground">Loading deck...</p>
      </main>
    );
  }

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
        <DataTable
          className="min-h-0 flex-1 min-w-0 [&_td:nth-child(2)]:whitespace-normal"
          columnVisibility
          emptyMessage={deckCards.isLoading ? "Loading cards..." : "No cards yet."}
          pagination={{ showSelectedCount: true, totalRows: deckCards.data?.pagination.total ?? 0 }}
          selection
          table={table}
        />
      </PageLayoutContent>
    </PageLayout>
  );
}

function getDeckId(deckId: string | undefined) {
  if (!deckId) {
    throw new Error("DeckDetailPage requires a deckId route param.");
  }

  return deckId;
}
