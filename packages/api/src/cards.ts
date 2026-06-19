import type { ApiClient } from "./api-client.js";

export interface Card {
  ankiCardType: string | null;
  ankiData: string | null;
  ankiDeckId: number | null;
  ankiDue: number | null;
  ankiFactor: number | null;
  ankiFlags: number | null;
  ankiId: number | null;
  ankiInterval: number | null;
  ankiLapses: number | null;
  ankiLeft: number | null;
  ankiModifiedAt: number | null;
  ankiNoteId: number | null;
  ankiOrder: number | null;
  ankiOriginalDeckId: number | null;
  ankiOriginalDue: number | null;
  ankiQueue: number | null;
  ankiRepetitions: number | null;
  ankiType: number | null;
  ankiUpdateSequenceNumber: number | null;
  cardTypeId: string | null;
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
