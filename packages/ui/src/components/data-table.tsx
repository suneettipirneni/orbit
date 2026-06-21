import * as React from "react";
import {
  flexRender,
  type Column,
  type Row,
  type Table as TanStackTable,
} from "@tanstack/react-table";
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
import { Checkbox } from "@orbit/ui/components/checkbox";
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

interface DataTableContextValue<TData> {
  table: TanStackTable<TData>;
}

const DataTableContext = React.createContext<DataTableContextValue<unknown> | null>(null);
const DataTableSelectionContext = React.createContext<DataTableSelectionOptions | null>(null);

export interface DataTableRootProps<TData> extends React.ComponentProps<"div"> {
  table: TanStackTable<TData>;
}

function DataTableRoot<TData>({ children, className, table, ...props }: DataTableRootProps<TData>) {
  "use no memo";

  const contextValue = React.useMemo<DataTableContextValue<unknown>>(
    () => ({ table: table as TanStackTable<unknown> }),
    [table],
  );

  return (
    <DataTableContext.Provider value={contextValue}>
      <div className={cn("flex min-h-0 w-full flex-col gap-4", className)} {...props}>
        {children}
      </div>
    </DataTableContext.Provider>
  );
}

export type DataTableToolbarProps = React.ComponentProps<"div">;

function DataTableToolbar({ className, ...props }: DataTableToolbarProps) {
  "use no memo";

  return <div className={cn("flex flex-wrap items-center gap-2", className)} {...props} />;
}

export interface DataTableFilterProps extends Omit<React.ComponentProps<typeof Input>, "value"> {
  columnId: string;
}

function DataTableFilter({
  className,
  columnId,
  onChange,
  placeholder,
  ...props
}: DataTableFilterProps) {
  "use no memo";

  const table = useDataTable();
  const filterColumn = table.getColumn(columnId);

  if (!filterColumn) {
    return null;
  }

  return (
    <Input
      className={cn("h-8 w-full sm:max-w-sm", className)}
      onChange={(event) => {
        filterColumn.setFilterValue(event.target.value);
        onChange?.(event);
      }}
      placeholder={placeholder ?? `Filter ${columnId}...`}
      value={(filterColumn.getFilterValue() as string) ?? ""}
      {...props}
    />
  );
}

export interface DataTableColumnVisibilityProps {
  className?: string;
  label?: string;
}

function DataTableColumnVisibility({ className, label = "View" }: DataTableColumnVisibilityProps) {
  "use no memo";

  const table = useDataTable();
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide()),
    [table],
  );

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
              {getColumnLabel(column)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface DataTableContentProps extends React.ComponentProps<"div"> {
  emptyMessage?: React.ReactNode;
}

function DataTableContent({
  className,
  emptyMessage = "No results.",
  ...props
}: DataTableContentProps) {
  "use no memo";

  const table = useDataTable();
  const selection = useDataTableSelection();
  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length || 1;
  const hasSelection = Boolean(selection);
  const tableColumnCount = columnCount + (hasSelection ? 1 : 0);
  const stickyHeaderClassName =
    "sticky top-0 z-10 bg-background after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border after:content-['']";

  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-hidden rounded-md border *:data-[slot=table-container]:h-full *:data-[slot=table-container]:overflow-auto",
        className,
      )}
      {...props}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b-0!">
              {hasSelection ? (
                <TableHead className={cn(stickyHeaderClassName, "w-10 px-2")}>
                  <DataTableSelectionHeader selectAll={selection?.selectAll} table={table} />
                </TableHead>
              ) : null}
              {headerGroup.headers.map((header) => (
                <TableHead
                  className={stickyHeaderClassName}
                  colSpan={header.colSpan}
                  key={header.id}
                >
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
                {hasSelection ? (
                  <TableCell className="w-10 px-2">
                    <DataTableSelectionCell row={row} />
                  </TableCell>
                ) : null}
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="h-24 text-center text-muted-foreground"
                colSpan={tableColumnCount}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export interface DataTableSelectionOptions {
  selectAll?: boolean;
}

export interface DataTableSelectionProps extends DataTableSelectionOptions {
  children: React.ReactNode;
}

function DataTableSelection({ children, selectAll }: DataTableSelectionProps) {
  "use no memo";

  const contextValue = React.useMemo<DataTableSelectionOptions>(() => ({ selectAll }), [selectAll]);

  return (
    <DataTableSelectionContext.Provider value={contextValue}>
      {children}
    </DataTableSelectionContext.Provider>
  );
}

function DataTableSelectionHeader<TData>({
  selectAll = true,
  table,
}: {
  selectAll?: boolean;
  table: TanStackTable<TData>;
}) {
  "use no memo";

  if (!selectAll) {
    return null;
  }

  const rows = table.getRowModel().rows;
  const hasSelectableRows = React.useMemo(() => rows.some((row) => row.getCanSelect()), [rows]);

  return (
    <Checkbox
      aria-label="Select all rows"
      checked={
        table.getIsAllPageRowsSelected()
          ? true
          : table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : false
      }
      disabled={!hasSelectableRows}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
    />
  );
}

function DataTableSelectionCell<TData>({ row }: { row: Row<TData> }) {
  "use no memo";

  return (
    <Checkbox
      aria-label="Select row"
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={(value) => row.toggleSelected(value === true)}
    />
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
  "use no memo";

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

export interface DataTablePaginationProps
  extends DataTablePaginationOptions, React.ComponentProps<"div"> {}

export interface DataTablePaginationOptions {
  pageSizeOptions?: number[];
  showSelectedCount?: boolean;
  totalRows?: number;
}

function DataTablePagination({
  className,
  pageSizeOptions: pageSizeOptionsProp,
  showSelectedCount = false,
  totalRows,
  ...props
}: DataTablePaginationProps) {
  "use no memo";

  const table = useDataTable();
  const tableState = table.getState();
  const { pageIndex, pageSize } = tableState.pagination;
  const rowModel = table.getRowModel();
  const rowSelection = tableState.rowSelection;
  const pageCount = table.getPageCount();
  const rowCount = totalRows ?? table.getRowCount();
  const rowStart = rowModel.rows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const rowEnd = Math.min(rowStart + rowModel.rows.length - 1, rowCount);
  const pageSizeOptions = React.useMemo(
    () => normalizePageSizeOptions(pageSizeOptionsProp),
    [pageSizeOptionsProp],
  );
  const selectedRowCount = React.useMemo(
    () =>
      table.options.manualPagination
        ? Object.values(rowSelection).filter(Boolean).length
        : table.getFilteredSelectedRowModel().rows.length,
    [rowSelection, table, tableState],
  );
  const selectedTotalRows = React.useMemo(
    () => (table.options.manualPagination ? rowCount : table.getFilteredRowModel().rows.length),
    [rowCount, table, tableState],
  );

  React.useEffect(() => {
    if (pageSize > 100) {
      table.setPageSize(100);
    }
  }, [pageSize, table]);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex-1 text-sm text-muted-foreground" aria-live="polite">
        {showSelectedCount ? (
          <>
            {selectedRowCount} of {selectedTotalRows} row(s) selected.
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

function useDataTable<TData = unknown>() {
  const context = React.useContext(DataTableContext);

  if (!context) {
    throw new Error("DataTable components must be rendered inside DataTableRoot.");
  }

  return context.table as TanStackTable<TData>;
}

function useDataTableSelection() {
  return React.useContext(DataTableSelectionContext);
}

function normalizePageSizeOptions(options: number[] = [10, 25, 50, 100]) {
  const normalized = [...new Set(options.map((option) => Math.trunc(option)))]
    .filter((option) => option > 0 && option <= 100)
    .sort((first, second) => first - second);

  return normalized.length ? normalized : [10, 25, 50, 100];
}

function getColumnLabel<TData>(column: Column<TData, unknown>) {
  const header = column.columnDef.header;

  return typeof header === "string" ? header : column.id;
}

const DataTable = {
  ColumnHeader: DataTableColumnHeader,
  ColumnVisibility: DataTableColumnVisibility,
  Content: DataTableContent,
  Filter: DataTableFilter,
  Pagination: DataTablePagination,
  Root: DataTableRoot,
  Selection: DataTableSelection,
  Toolbar: DataTableToolbar,
};

export {
  DataTable,
  DataTableColumnHeader,
  DataTableColumnVisibility,
  DataTableContent,
  DataTableFilter,
  DataTablePagination,
  DataTableRoot,
  DataTableSelection,
  DataTableToolbar,
  useDataTable,
};
