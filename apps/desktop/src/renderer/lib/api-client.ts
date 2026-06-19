import type { ApiClient, PaginationInput } from "@orbit/api";

export const apiClient: ApiClient = {
  delete(path) {
    return routeRequest("DELETE", path);
  },
  get(path) {
    return routeRequest("GET", path);
  },
  patch(path, body) {
    return routeRequest("PATCH", path, body);
  },
  post(path, body) {
    return routeRequest("POST", path, body);
  },
  postForm(path, body) {
    return routeFormRequest(path, body);
  },
};

async function routeRequest<TResponse>(
  method: "DELETE" | "GET" | "PATCH" | "POST",
  path: string,
  body?: unknown,
) {
  const url = new URL(path, "orbit://desktop");
  const segments = url.pathname.split("/").filter(Boolean);

  if (method === "GET" && segments[0] === "decks" && segments.length === 1) {
    return window.api.decks.list(paginationFromSearch(url.searchParams)) as Promise<TResponse>;
  }

  if (method === "POST" && segments[0] === "decks" && segments.length === 1) {
    return window.api.decks.create(
      body as Parameters<typeof window.api.decks.create>[0],
    ) as Promise<TResponse>;
  }

  if (method === "GET" && segments[0] === "decks" && segments[1] && segments.length === 2) {
    return window.api.decks.get(segments[1]) as Promise<TResponse>;
  }

  if (method === "PATCH" && segments[0] === "decks" && segments[1] && segments.length === 2) {
    return window.api.decks.update(
      segments[1],
      body as Parameters<typeof window.api.decks.update>[1],
    ) as Promise<TResponse>;
  }

  if (method === "DELETE" && segments[0] === "decks" && segments[1] && segments.length === 2) {
    return window.api.decks.delete(segments[1]) as Promise<TResponse>;
  }

  if (method === "GET" && segments[0] === "decks" && segments[1] && segments[2] === "cards") {
    return window.api.decks.listCards(segments[1], {
      ...paginationFromSearch(url.searchParams),
      query: url.searchParams.get("query") ?? undefined,
      searchWithinFormatting: url.searchParams.get("searchWithinFormatting") === "true",
    }) as Promise<TResponse>;
  }

  if (method === "GET" && segments[0] === "decks" && segments[1] && segments[2] === "note-types") {
    return window.api.decks.listNoteTypes(
      segments[1],
      paginationFromSearch(url.searchParams),
    ) as Promise<TResponse>;
  }

  if (method === "GET" && segments[0] === "decks" && segments[1] && segments[2] === "card-types") {
    return window.api.decks.listCardTypes(
      segments[1],
      paginationFromSearch(url.searchParams),
    ) as Promise<TResponse>;
  }

  if (method === "GET" && segments[0] === "cards" && segments[1]) {
    return window.api.cards.get(segments[1]) as Promise<TResponse>;
  }

  if (method === "PATCH" && segments[0] === "cards" && segments[1]) {
    return window.api.cards.update(
      segments[1],
      body as Parameters<typeof window.api.cards.update>[1],
    ) as Promise<TResponse>;
  }

  if (method === "POST" && segments[0] === "notes" && segments.length === 1) {
    return window.api.notes.create(
      body as Parameters<typeof window.api.notes.create>[0],
    ) as Promise<TResponse>;
  }

  if (method === "PATCH" && segments[0] === "notes" && segments[1]) {
    return window.api.notes.update(
      segments[1],
      body as Parameters<typeof window.api.notes.update>[1],
    ) as Promise<TResponse>;
  }

  if (method === "DELETE" && segments[0] === "notes" && segments[1]) {
    return window.api.notes.delete(segments[1]) as Promise<TResponse>;
  }

  if (method === "GET" && segments[0] === "reviews" && segments[1] === "due") {
    return window.api.reviews.listDue({
      ...paginationFromSearch(url.searchParams),
      deckId: url.searchParams.get("deckId") ?? undefined,
    }) as Promise<TResponse>;
  }

  if (method === "GET" && segments[0] === "reviews" && segments[1] === "today") {
    return window.api.reviews.today() as Promise<TResponse>;
  }

  if (method === "GET" && segments[0] === "reviews" && segments[1] === "scheduler-status") {
    return window.api.reviews.schedulerStatus() as Promise<TResponse>;
  }

  if (method === "POST" && segments[0] === "reviews" && segments[1]) {
    return window.api.reviews.submit(
      segments[1],
      body as Parameters<typeof window.api.reviews.submit>[1],
    ) as Promise<TResponse>;
  }

  throw new Error(`Unsupported desktop API request: ${method} ${path}`);
}

async function routeFormRequest<TResponse>(path: string, body: FormData) {
  const url = new URL(path, "orbit://desktop");
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments[0] === "decks" && segments[1] === "import" && segments[2] === "anki") {
    const file = body.get("file");

    if (!(file instanceof File)) {
      throw new Error("Upload an Anki deck file in the 'file' form field.");
    }

    return window.api.decks.importAnki({
      data: await file.arrayBuffer(),
      fileName: file.name,
    }) as Promise<TResponse>;
  }

  throw new Error(`Unsupported desktop API form request: ${path}`);
}

function paginationFromSearch(searchParams: URLSearchParams): PaginationInput {
  return {
    page: numberFromSearch(searchParams, "page"),
    pageSize: numberFromSearch(searchParams, "pageSize"),
  };
}

function numberFromSearch(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);

  if (value === null) {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : undefined;
}
