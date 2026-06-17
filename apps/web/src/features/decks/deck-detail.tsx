import type { CardPreview } from "@orbit/api";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Badge } from "@orbit/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@orbit/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@orbit/ui/components/table";
import { formatDueDate } from "@/lib/date-format";
import { CardForm } from "@/features/cards/card-form";
import { deckQueryOptions } from "@/lib/queries/deck";

export interface DeckDetailProps {
  deckId?: string;
}

export function DeckDetail({ deckId }: DeckDetailProps) {
  "use no memo";

  const deck = useQuery(deckQueryOptions(deckId ?? ""));
  const columns = useMemo<ColumnDef<CardPreview>[]>(
    () => [
      {
        accessorKey: "front",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.front}</p>
            <p className="text-sm text-muted-foreground">{row.original.back}</p>
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
        accessorKey: "intervalDays",
        cell: ({ row }) => `${row.original.intervalDays} days`,
        header: "Interval",
      },
    ],
    [],
  );
  const table = useReactTable({
    columns,
    data: deck.data?.cards ?? [],
    getCoreRowModel: getCoreRowModel(),
  });

  if (!deckId) {
    return (
      <main className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-card p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold tracking-normal">Select a deck</h2>
          <p className="text-sm text-muted-foreground">Create or choose a deck from the sidebar.</p>
        </div>
      </main>
    );
  }

  if (!deck.data) {
    return (
      <main className="grid min-h-72 place-items-center rounded-lg border border-border bg-card p-8">
        <p className="text-muted-foreground">Loading deck...</p>
      </main>
    );
  }

  return (
    <main className="min-w-0">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">{deck.data.cards.length} cards</Badge>
            </div>
            <h2 className="text-2xl font-semibold tracking-normal">{deck.data.deck.name}</h2>
            <p className="text-sm text-muted-foreground">Build and maintain this study deck.</p>
          </div>
        </div>

        <CardForm deckId={deckId} />

        <Card>
          <CardHeader>
            <CardTitle>Cards</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
