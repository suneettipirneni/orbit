import type { ApiClient } from "./api-client.js";
import * as z from "zod/v4";

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

export const updateCardInputSchema = z
  .object({
    buried: z.boolean().optional(),
    deckId: z.string().optional(),
    dueAt: z.iso.datetime().optional(),
    flag: z
      .union([
        z.literal(0),
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6),
        z.literal(7),
      ])
      .optional(),
    forget: z.literal(true).optional(),
    position: z.int().min(0).optional(),
    suspended: z.boolean().optional(),
  })
  .strict();

export type UpdateCardInput = z.infer<typeof updateCardInputSchema>;

export function getCard(client: ApiClient, cardId: string) {
  return client.get<CardWithNote>(`/cards/${cardId}`);
}

export function updateCard(client: ApiClient, cardId: string, input: UpdateCardInput) {
  return client.patch<UpdateCardInput, CardWithNote>(`/cards/${cardId}`, input);
}
