import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { cardTypes } from "./card-type.js";
import { decks } from "./deck.js";
import { notes } from "./note.js";

export const cards = sqliteTable("cards", {
  ankiCardType: text("anki_card_type"),
  ankiData: text("anki_data"),
  ankiDeckId: integer("anki_deck_id"),
  ankiDue: integer("anki_due"),
  ankiFactor: integer("anki_factor"),
  ankiFlags: integer("anki_flags"),
  ankiId: integer("anki_id"),
  ankiInterval: integer("anki_interval"),
  ankiLapses: integer("anki_lapses"),
  ankiLeft: integer("anki_left"),
  ankiModifiedAt: integer("anki_modified_at"),
  ankiNoteId: integer("anki_note_id"),
  ankiOrder: integer("anki_order"),
  ankiOriginalDeckId: integer("anki_original_deck_id"),
  ankiOriginalDue: integer("anki_original_due"),
  ankiQueue: integer("anki_queue"),
  ankiRepetitions: integer("anki_repetitions"),
  ankiType: integer("anki_type"),
  ankiUpdateSequenceNumber: integer("anki_update_sequence_number"),
  cardTypeId: text("card_type_id").references(() => cardTypes.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull(),
  deckId: text("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  dueAt: text("due_at").notNull(),
  easeFactor: real("ease_factor").notNull(),
  id: text("id").primaryKey(),
  intervalDays: integer("interval_days").notNull(),
  lapses: integer("lapses").notNull(),
  noteId: text("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  repetitions: integer("repetitions").notNull(),
  updatedAt: text("updated_at").notNull(),
});
