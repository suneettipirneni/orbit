import type { ApiClient } from "./api-client.js";

export interface Card {
  id: string;
  deckId: string;
  noteId: string;
  dueAt: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardWithNote extends Card {
  front: string;
  back: string;
  deckName: string;
}

export function getCard(client: ApiClient, cardId: string) {
  return client.get<CardWithNote>(`/cards/${cardId}`);
}
