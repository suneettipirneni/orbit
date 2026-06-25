import { formatDueDate } from "@/lib/date-format";
import { useSuspenseDeckCardsQuery } from "@/lib/queries/deck";
import type { CardPreview, PaginatedResponse } from "@orbit/types";
import {
  DataTableColumnVisibility,
  DataTableContent,
  DataTablePagination,
  DataTableRoot,
  DataTableToolbar,
} from "@orbit/ui";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@orbit/ui/components/input-group";
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

export function DeckCards({ deckId }: { deckId: string }) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 100,
  });
  const [retainedCardsPage, setRetainedCardsPage] = React.useState<{
    cardsPage: PaginatedResponse<CardPreview>;
    deckId: string;
  } | null>(null);

  const { data: queriedCardsPage } = useSuspenseDeckCardsQuery(deckId, {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const cardsPage =
    queriedCardsPage ?? (retainedCardsPage?.deckId === deckId ? retainedCardsPage.cardsPage : null);

  React.useEffect(() => {
    if (queriedCardsPage) {
      setRetainedCardsPage({ cardsPage: queriedCardsPage, deckId });
    }
  }, [deckId, queriedCardsPage]);

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
      <DeckCardTable
        cardsPage={cardsPage}
        onPaginationChange={setPagination}
        pagination={pagination}
      />
    </section>
  );
}
