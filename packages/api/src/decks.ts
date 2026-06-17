import type { ApiClient } from "./api-client.js";

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
}

export interface CardPreview {
  id: string;
  noteId: string;
  front: string;
  back: string;
  dueAt: string;
  intervalDays: number;
}

export interface DeckDetail {
  deck: Deck;
  cards: CardPreview[];
}

export interface CreateDeckInput {
  name: string;
  description?: string | null;
}

export interface UpdateDeckInput {
  name?: string;
  description?: string | null;
}

export function listDecks(client: ApiClient) {
  return client.get<DeckSummary[]>("/decks");
}

export function getDeck(client: ApiClient, deckId: string) {
  return client.get<DeckDetail>(`/decks/${deckId}`);
}

export function createDeck(client: ApiClient, input: CreateDeckInput) {
  return client.post<CreateDeckInput, Deck>("/decks", input);
}

export function updateDeck(client: ApiClient, deckId: string, input: UpdateDeckInput) {
  return client.patch<UpdateDeckInput, Deck>(`/decks/${deckId}`, input);
}

export function deleteDeck(client: ApiClient, deckId: string) {
  return client.delete<void>(`/decks/${deckId}`);
}
