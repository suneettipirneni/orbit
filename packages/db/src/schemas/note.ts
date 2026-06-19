import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { decks } from "./deck.js";
import { noteTypes } from "./note-type.js";

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
  deckId: text("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  front: text("front").notNull(),
  id: text("id").primaryKey(),
  noteTypeId: text("note_type_id").references(() => noteTypes.id, { onDelete: "set null" }),
  updatedAt: text("updated_at").notNull(),
});
