import type { ApiClient } from "./api-client.js";
import * as z from "zod/v4";
import {
  buildPaginationSearchParams,
  formatSearchParams,
  type PaginatedResponse,
  type PaginationInput,
} from "./pagination.js";

export interface Deck {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeckSummary extends Deck {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
}

export interface CardPreview {
  id: string;
  noteId: string;
  cardTypeId: string | null;
  ankiCardType: string | null;
  ankiDue: number | null;
  ankiFlags: number | null;
  ankiOrder: number | null;
  ankiQueue: number | null;
  ankiSortField: string | null;
  ankiTags: string[] | null;
  ankiType: number | null;
  front: string;
  back: string;
  deckId: string;
  deckName: string;
  dueAt: string;
  intervalDays: number;
  repetitions: number;
}

export interface NoteType {
  id: string;
  deckId: string;
  ankiId: number | null;
  name: string;
  fieldNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CardType {
  id: string;
  deckId: string;
  noteTypeId: string | null;
  noteTypeName: string | null;
  ankiOrder: number | null;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeckDetail {
  deck: Deck;
  counts: {
    total: number;
    due: number;
    new: number;
    learning: number;
    review: number;
  };
}

export interface DeleteDeckResult {
  deletedCards: number;
}

export interface ListDeckCardsInput extends PaginationInput {
  query?: string;
}

export const createDeckInputSchema = z
  .object({
    description: z.string().nullable().optional(),
    name: z.string(),
  })
  .strict();

export type CreateDeckInput = z.infer<typeof createDeckInputSchema>;

export const updateDeckInputSchema = z
  .object({
    description: z.string().nullable().optional(),
    name: z.string().optional(),
  })
  .strict();

export type UpdateDeckInput = z.infer<typeof updateDeckInputSchema>;

export interface ImportAnkiDecksInput {
  file: File;
}

export interface ImportAnkiDecksResult {
  cardCount: number;
  deckCount: number;
  decks: Deck[];
  noteCount: number;
}

export function listDecks(client: ApiClient, input: PaginationInput = {}) {
  return client.get<PaginatedResponse<DeckSummary>>(
    `/decks${formatSearchParams(buildPaginationSearchParams(input))}`,
  );
}

export function getDeck(client: ApiClient, deckId: string) {
  return client.get<DeckDetail>(`/decks/${deckId}`);
}

export function listDeckCards(client: ApiClient, deckId: string, input: ListDeckCardsInput = {}) {
  const searchParams = buildPaginationSearchParams(input);

  if (input.query) {
    searchParams.set("query", input.query);
  }

  return client.get<PaginatedResponse<CardPreview>>(
    `/decks/${deckId}/cards${formatSearchParams(searchParams)}`,
  );
}

export function listDeckNoteTypes(client: ApiClient, deckId: string, input: PaginationInput = {}) {
  return client.get<PaginatedResponse<NoteType>>(
    `/decks/${deckId}/note-types${formatSearchParams(buildPaginationSearchParams(input))}`,
  );
}

export function listDeckCardTypes(client: ApiClient, deckId: string, input: PaginationInput = {}) {
  return client.get<PaginatedResponse<CardType>>(
    `/decks/${deckId}/card-types${formatSearchParams(buildPaginationSearchParams(input))}`,
  );
}

export function createDeck(client: ApiClient, input: CreateDeckInput) {
  return client.post<CreateDeckInput, Deck>("/decks", input);
}

export function updateDeck(client: ApiClient, deckId: string, input: UpdateDeckInput) {
  return client.patch<UpdateDeckInput, Deck>(`/decks/${deckId}`, input);
}

export function deleteDeck(client: ApiClient, deckId: string) {
  return client.delete<DeleteDeckResult>(`/decks/${deckId}`);
}

export function importAnkiDecks(client: ApiClient, input: ImportAnkiDecksInput) {
  const formData = new FormData();
  formData.append("file", input.file);

  return client.postForm<ImportAnkiDecksResult>("/decks/import/anki", formData);
}
