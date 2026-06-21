import { formatDueDate } from "@/lib/date-format";
import { useDeckCardsQuery } from "@/lib/queries/deck";
import { CardPreview } from "@orbit/types";
import {
  DataTableColumnVisibility,
  DataTableContent,
  DataTablePagination,
  DataTableRoot,
  DataTableToolbar,
} from "@orbit/ui";
import {
  createColumnHelper,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

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

export function DeckCards({ deckId }: { deckId: string }) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 100 });
  const {
    data: [cardsPage],
  } = useDeckCardsQuery(deckId, {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const cards = cardsPage?.data ?? [];

  const table = useReactTable({
    data: cards,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: cardsPage?.pagination.total,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  return (
    <DataTableRoot table={table}>
      <DataTableToolbar>
        <DataTableColumnVisibility />
      </DataTableToolbar>
      <DataTableContent />
      <DataTablePagination totalRows={cardsPage?.pagination.total} />
    </DataTableRoot>
  );
}
