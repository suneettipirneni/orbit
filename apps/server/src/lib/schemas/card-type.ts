import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { decks } from "./deck.js";
import { noteTypes } from "./note-type.js";

export const cardTypes = sqliteTable("card_types", {
  ankiOrder: integer("anki_order"),
  createdAt: text("created_at").notNull(),
  deckId: text("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  noteTypeId: text("note_type_id").references(() => noteTypes.id, { onDelete: "cascade" }),
  updatedAt: text("updated_at").notNull(),
});
