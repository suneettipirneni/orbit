import { formatDueDate } from "@/lib/date-format";
import { useDeckCardsQuery } from "@/lib/queries/deck";
import type { CardPreview, PaginatedResponse } from "@orbit/types";
import {
  DataTableColumnVisibility,
  DataTableContent,
  DataTablePagination,
  DataTableRoot,
  DataTableToolbar,
} from "@orbit/ui";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@orbit/ui/components/input-group";
import { Skeleton } from "@orbit/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@orbit/ui/components/table";
import {
  createColumnHelper,
  getCoreRowModel,
  type OnChangeFn,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import React from "react";

const columnHelper = createColumnHelper<CardPreview>();
const cardTableSkeletonColumns = ["Front", "Back", "Sort Field", "Due"];
const cardTableSkeletonRows = Array.from({ length: 6 }, (_, index) => index);

const columns = [
  columnHelper.accessor("front", {
    cell: (props) => props.getValue(),
    header: () => <span>Front</span>,
  }),
  columnHelper.accessor("back", {
    cell: (col) => (
      <span className="wrap-anywhere text-wrap text-muted-foreground line-clamp-1">
        {col.getValue()}
      </span>
    ),
    header: () => <span>Back</span>,
  }),
  columnHelper.accessor("ankiSortField", {
    cell: (col) => <span>{col.getValue()}</span>,
    header: () => <span>Sort Field</span>,
  }),
  columnHelper.accessor("dueAt", {
    cell: (col) => <span>{formatDueDate(col.getValue())}</span>,
    header: () => <span>Due</span>,
  }),
];

export function DeckCardTable({
  cardsPage,
  isPaginationPending = false,
  pagination,
  onPaginationChange,
}: {
  cardsPage: PaginatedResponse<CardPreview>;
  isPaginationPending?: boolean;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
}) {
  "use no memo";

  const cards = cardsPage.data;

  const table = useReactTable({
    data: cards,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: cardsPage.pagination.total,
    state: {
      pagination,
    },
    onPaginationChange,
  });

  return (
    <DataTableRoot table={table}>
      <DataTableToolbar>
        <InputGroup className="max-w-xs">
          <InputGroupInput placeholder="Search..." />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <DataTableColumnVisibility />
      </DataTableToolbar>
      <DataTableContent />
      <DataTablePagination
        aria-busy={isPaginationPending}
        className={`transition-opacity ${isPaginationPending ? "opacity-50" : ""}`}
        totalRows={cardsPage.pagination.total}
      />
    </DataTableRoot>
  );
}

function DeckCardTableSkeleton() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-full max-w-xs" />
        <Skeleton className="ml-auto h-8 w-20" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border *:data-[slot=table-container]:h-full *:data-[slot=table-container]:overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-0!">
              {cardTableSkeletonColumns.map((column) => (
                <TableHead
                  className="sticky top-0 z-10 bg-background after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border after:content-['']"
                  key={column}
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cardTableSkeletonRows.map((row) => (
              <TableRow key={row}>
                <TableCell>
                  <Skeleton className="h-4 w-44" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-64 max-w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-5 w-24" />
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-[70px]" />
          </div>
          <Skeleton className="h-5 w-[100px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="hidden size-9 lg:block" />
            <Skeleton className="size-9" />
            <Skeleton className="size-9" />
            <Skeleton className="hidden size-9 lg:block" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeckCardsFallback() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading cards"
      className="flex min-h-0 flex-1 flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Cards</h2>
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
      </div>
      <DeckCardTableSkeleton />
    </section>
  );
}

export function DeckCards({ deckId }: { deckId: string }) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 100,
  });
  const [retainedCardsPage, setRetainedCardsPage] = React.useState<{
    cardsPage: PaginatedResponse<CardPreview>;
    deckId: string;
  } | null>(null);

  const {
    data: [queriedCardsPage] = [],
    isFetching,
    isLoading,
  } = useDeckCardsQuery(deckId, {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const cardsPage =
    queriedCardsPage ?? (retainedCardsPage?.deckId === deckId ? retainedCardsPage.cardsPage : null);
  const isPaginationPending = Boolean(cardsPage && (isFetching || isLoading || !queriedCardsPage));
  const CardsTableTransition = React.ViewTransition ?? React.Fragment;

  React.useEffect(() => {
    if (queriedCardsPage) {
      setRetainedCardsPage({ cardsPage: queriedCardsPage, deckId });
    }
  }, [deckId, queriedCardsPage]);

  if (!cardsPage) {
    return <DeckCardsFallback />;
  }

  return (
    <section className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Cards</h2>
          <p className="text-sm text-muted-foreground">
            Showing {cardsPage.data.length} of {cardsPage.pagination.total} cards
          </p>
        </div>
      </div>
      <CardsTableTransition default="none" enter="deck-cards-table-enter">
        <DeckCardTable
          cardsPage={cardsPage}
          isPaginationPending={isPaginationPending}
          onPaginationChange={setPagination}
          pagination={pagination}
        />
      </CardsTableTransition>
    </section>
  );
}
