export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResponse<TData> {
  data: TData[];
  pagination: PaginationMeta;
}

export function buildPaginationSearchParams(input: PaginationInput = {}) {
  const searchParams = new URLSearchParams();

  if (input.page !== undefined) {
    searchParams.set("page", String(input.page));
  }

  if (input.pageSize !== undefined) {
    searchParams.set("pageSize", String(input.pageSize));
  }

  return searchParams;
}

export function formatSearchParams(searchParams: URLSearchParams) {
  const search = searchParams.toString();
  return search ? `?${search}` : "";
}
