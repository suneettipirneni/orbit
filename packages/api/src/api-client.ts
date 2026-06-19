export interface ApiClient {
  delete<TResponse>(path: string): Promise<TResponse>;
  get<TResponse>(path: string): Promise<TResponse>;
  patch<TBody, TResponse>(path: string, body: TBody): Promise<TResponse>;
  post<TBody, TResponse>(path: string, body: TBody): Promise<TResponse>;
  postForm<TResponse>(path: string, body: FormData): Promise<TResponse>;
}
