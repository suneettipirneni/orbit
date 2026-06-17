export interface ApiClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export class ApiError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ApiClient {
  delete<TResponse>(path: string, options?: RequestOptions): Promise<TResponse>;
  get<TResponse>(path: string, options?: RequestOptions): Promise<TResponse>;
  patch<TBody, TResponse>(path: string, body: TBody, options?: RequestOptions): Promise<TResponse>;
  post<TBody, TResponse>(path: string, body: TBody, options?: RequestOptions): Promise<TResponse>;
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = options.baseUrl ?? "http://127.0.0.1:3737";
  const fetcher = options.fetcher ?? fetch;

  async function request<TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> {
    const response = await fetcher(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...init.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(text || response.statusText, response.status);
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }

  return {
    delete<TResponse>(path: string, requestOptions?: RequestOptions) {
      return request<TResponse>(path, {
        method: "DELETE",
        signal: requestOptions?.signal,
      });
    },
    get<TResponse>(path: string, requestOptions?: RequestOptions) {
      return request<TResponse>(path, {
        method: "GET",
        signal: requestOptions?.signal,
      });
    },
    patch<TBody, TResponse>(path: string, body: TBody, requestOptions?: RequestOptions) {
      return request<TResponse>(path, {
        body: JSON.stringify(body),
        method: "PATCH",
        signal: requestOptions?.signal,
      });
    },
    post<TBody, TResponse>(path: string, body: TBody, requestOptions?: RequestOptions) {
      return request<TResponse>(path, {
        body: JSON.stringify(body),
        method: "POST",
        signal: requestOptions?.signal,
      });
    },
  };
}
