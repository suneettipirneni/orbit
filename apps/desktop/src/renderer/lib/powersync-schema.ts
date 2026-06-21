import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { DrizzleTableWithPowerSyncOptions } from "@powersync/drizzle-driver";

export const decks = sqliteTable("decks", {
  createdAt: text("created_at").notNull(),
  deletedAt: text("deleted_at"),
  description: text("description"),
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const noteTypes = sqliteTable("note_types", {
  ankiId: integer("anki_id"),
  createdAt: text("created_at").notNull(),
  deckId: text("deck_id").notNull(),
  fieldNames: text("field_names", { mode: "json" }).$type<string[]>().notNull(),
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const cardTypes = sqliteTable("card_types", {
  ankiOrder: integer("anki_order"),
  createdAt: text("created_at").notNull(),
  deckId: text("deck_id").notNull(),
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  noteTypeId: text("note_type_id"),
  updatedAt: text("updated_at").notNull(),
});

export const notes = sqliteTable("notes", {
  ankiChecksum: integer("anki_checksum"),
  ankiData: text("anki_data"),
  ankiFieldNames: text("anki_field_names", { mode: "json" }).$type<string[] | null>(),
  ankiFields: text("anki_fields", { mode: "json" }).$type<string[] | null>(),
  ankiFlags: integer("anki_flags"),
  ankiGuid: text("anki_guid"),
  ankiId: integer("anki_id"),
  ankiModelId: integer("anki_model_id"),
  ankiModifiedAt: integer("anki_modified_at"),
  ankiSortField: text("anki_sort_field"),
  ankiTags: text("anki_tags", { mode: "json" }).$type<string[] | null>(),
  ankiUpdateSequenceNumber: integer("anki_update_sequence_number"),
  back: text("back").notNull(),
  createdAt: text("created_at").notNull(),
  deckId: text("deck_id").notNull(),
  deletedAt: text("deleted_at"),
  front: text("front").notNull(),
  id: text("id").primaryKey().notNull(),
  noteTypeId: text("note_type_id"),
  updatedAt: text("updated_at").notNull(),
});

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
  cardTypeId: text("card_type_id"),
  createdAt: text("created_at").notNull(),
  deckId: text("deck_id").notNull(),
  deletedAt: text("deleted_at"),
  dueAt: text("due_at").notNull(),
  easeFactor: real("ease_factor").notNull(),
  id: text("id").primaryKey().notNull(),
  intervalDays: integer("interval_days").notNull(),
  lapses: integer("lapses").notNull(),
  noteId: text("note_id").notNull(),
  repetitions: integer("repetitions").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const reviews = sqliteTable("reviews", {
  cardId: text("card_id").notNull(),
  createdAt: text("created_at").notNull(),
  deletedAt: text("deleted_at"),
  elapsedMilliseconds: integer("elapsed_milliseconds"),
  id: text("id").primaryKey().notNull(),
  rating: integer("rating").notNull(),
});
export const powerSyncDrizzleSchema = {
  cardTypes,
  cards,
  decks,
  noteTypes,
  notes,
  reviews,
};

export function createPowerSyncAppSchemaEntries({ localOnly }: { localOnly: boolean }) {
  if (!localOnly) {
    return powerSyncDrizzleSchema;
  }

  return Object.fromEntries(
    Object.entries(powerSyncDrizzleSchema).map(([key, table]) => [
      key,
      {
        options: { localOnly: true },
        tableDefinition: table,
      } satisfies DrizzleTableWithPowerSyncOptions,
    ]),
  );
}
