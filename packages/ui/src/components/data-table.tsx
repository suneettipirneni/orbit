import * as React from "react";
import { flexRender, type Column, type Table as TanStackTable } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  EyeOffIcon,
  Settings2Icon,
} from "lucide-react";

import { cn } from "@orbit/ui/lib/utils";
import { Button } from "@orbit/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@orbit/ui/components/dropdown-menu";
import { Input } from "@orbit/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@orbit/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@orbit/ui/components/table";

export interface DataTablePaginationOptions {
  pageSizeOptions?: number[];
  showSelectedCount?: boolean;
  totalRows?: number;
}

export interface DataTableFilterOptions {
  columnId: string;
  placeholder?: string;
}

export interface DataTablePaginationProps<TData> extends DataTablePaginationOptions {
  table: TanStackTable<TData>;
}

export interface DataTableViewOptionsProps<TData> {
  className?: string;
  label?: string;
  table: TanStackTable<TData>;
}

export interface DataTableProps<TData> extends Omit<React.ComponentProps<"div">, "children"> {
  emptyMessage?: React.ReactNode;
  filter?: DataTableFilterOptions;
  pagination?: boolean | DataTablePaginationOptions;
  table: TanStackTable<TData>;
  toolbar?: React.ReactNode;
  viewOptions?: boolean;
  viewOptionsLabel?: string;
}

function DataTable<TData>({
  className,
  emptyMessage = "No results.",
  filter,
  pagination,
  table,
  toolbar,
  viewOptions = false,
  viewOptionsLabel,
  ...props
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length || 1;
  const paginationOptions = pagination === true ? {} : pagination || undefined;
  const hasToolbar = Boolean(filter || toolbar || viewOptions);

  return (
    <div className={cn("flex w-full flex-col gap-4", className)} {...props}>
      {hasToolbar ? (
        <DataTableToolbar
          filter={filter}
          table={table}
          viewOptions={viewOptions}
          viewOptionsLabel={viewOptionsLabel}
        >
          {toolbar}
        </DataTableToolbar>
      ) : null}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead colSpan={header.colSpan} key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow data-state={row.getIsSelected() ? "selected" : undefined} key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={columnCount}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {paginationOptions ? <DataTablePagination {...paginationOptions} table={table} /> : null}
    </div>
  );
}

function DataTableToolbar<TData>({
  children,
  filter,
  table,
  viewOptions,
  viewOptionsLabel,
}: {
  children?: React.ReactNode;
  filter?: DataTableFilterOptions;
  table: TanStackTable<TData>;
  viewOptions?: boolean;
  viewOptionsLabel?: string;
}) {
  const filterColumn = filter ? table.getColumn(filter.columnId) : undefined;
  const filterPlaceholder = filter?.placeholder ?? (filter ? `Filter ${filter.columnId}...` : "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filterColumn ? (
        <Input
          className="h-8 w-full sm:max-w-sm"
          onChange={(event) => filterColumn.setFilterValue(event.target.value)}
          placeholder={filterPlaceholder}
          value={(filterColumn.getFilterValue() as string) ?? ""}
        />
      ) : null}
      {children}
      {viewOptions ? <DataTableViewOptions label={viewOptionsLabel} table={table} /> : null}
    </div>
  );
}

export interface DataTableColumnHeaderProps<TData, TValue> extends React.ComponentProps<"div"> {
  column: Column<TData, TValue>;
  title: string;
}

function DataTableColumnHeader<TData, TValue>({
  className,
  column,
  title,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn(className)} {...props}>
        {title}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="-ml-3 h-8 data-[state=open]:bg-accent" size="sm" variant="ghost">
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon data-icon="inline-end" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon data-icon="inline-end" />
            ) : (
              <ChevronsUpDownIcon data-icon="inline-end" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowUpIcon />
              Asc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDownIcon />
              Desc
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {column.getCanHide() ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                  <EyeOffIcon />
                  Hide
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function DataTableViewOptions<TData>({
  className,
  label = "View",
  table,
}: DataTableViewOptionsProps<TData>) {
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide());

  if (!columns.length) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn("ml-auto h-8", className)} size="sm" variant="outline">
          <Settings2Icon data-icon="inline-start" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              checked={column.getIsVisible()}
              className="capitalize"
              key={column.id}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DataTablePagination<TData>({
  pageSizeOptions: pageSizeOptionsProp,
  showSelectedCount = false,
  table,
  totalRows,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const rowCount = totalRows ?? table.getRowCount();
  const rowStart = table.getRowModel().rows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const rowEnd = Math.min(rowStart + table.getRowModel().rows.length - 1, rowCount);
  const pageSizeOptions = normalizePageSizeOptions(pageSizeOptionsProp);

  React.useEffect(() => {
    if (pageSize > 100) {
      table.setPageSize(100);
    }
  }, [pageSize, table]);

  return (
    <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 text-sm text-muted-foreground" aria-live="polite">
        {showSelectedCount ? (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </>
        ) : (
          <>
            {rowStart}-{rowEnd} of {rowCount}
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            onValueChange={(value) => table.setPageSize(Number(value))}
            value={String(Math.min(pageSize, 100))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {pageCount === 0 ? 0 : pageIndex + 1}
          {pageCount > -1 ? ` of ${pageCount}` : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="hidden lg:flex"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.firstPage()}
            size="icon"
            type="button"
            variant="outline"
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="icon"
            type="button"
            variant="outline"
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon />
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="icon"
            type="button"
            variant="outline"
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon />
          </Button>
          <Button
            className="hidden lg:flex"
            disabled={!table.getCanNextPage() || pageCount < 0}
            onClick={() => table.lastPage()}
            size="icon"
            type="button"
            variant="outline"
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

function normalizePageSizeOptions(options: number[] = [10, 25, 50, 100]) {
  const normalized = [...new Set(options.map((option) => Math.trunc(option)))]
    .filter((option) => option > 0 && option <= 100)
    .sort((first, second) => first - second);

  return normalized.length ? normalized : [10, 25, 50, 100];
}

export { DataTable, DataTableColumnHeader, DataTablePagination, DataTableViewOptions };
