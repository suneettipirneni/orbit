import type { PaginatedResponse, PaginationInput } from "@orbit/api";

const defaultPage = 1;
const defaultPageSize = 50;
const maxPageSize = 100;

export interface NormalizedPagination {
  limit: number;
  offset: number;
  page: number;
  pageSize: number;
}

export function normalizePagination(input: PaginationInput = {}): NormalizedPagination {
  const page = normalizePositiveInteger(input.page, defaultPage);
  const pageSize = Math.min(normalizePositiveInteger(input.pageSize, defaultPageSize), maxPageSize);

  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    page,
    pageSize,
  };
}

export function parsePaginationQuery(query: (name: string) => string | undefined) {
  return normalizePagination({
    page: parseQueryInteger(query("page")),
    pageSize: parseQueryInteger(query("pageSize")),
  });
}

export function paginatedResponse<TData>(
  data: TData[],
  pagination: Pick<NormalizedPagination, "page" | "pageSize">,
  total: number,
): PaginatedResponse<TData> {
  return {
    data,
    pagination: {
      page: pagination.page,
      pageCount: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
      pageSize: pagination.pageSize,
      total,
    },
  };
}

function parseQueryInteger(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (value === undefined || !Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return value;
}
