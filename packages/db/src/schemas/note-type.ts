import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { decks } from "./deck.js";

export const noteTypes = sqliteTable("note_types", {
  ankiId: integer("anki_id"),
  createdAt: text("created_at").notNull(),
  deckId: text("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  fieldNames: text("field_names", { mode: "json" }).$type<string[]>().notNull(),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  updatedAt: text("updated_at").notNull(),
});
