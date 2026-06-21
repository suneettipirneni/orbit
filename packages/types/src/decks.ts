import * as z from "zod/v4";
import type { PaginationInput } from "./pagination.js";

export interface Deck {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  isFiltered?: boolean;
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
  searchWithinFormatting?: boolean;
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
