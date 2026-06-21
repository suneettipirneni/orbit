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
