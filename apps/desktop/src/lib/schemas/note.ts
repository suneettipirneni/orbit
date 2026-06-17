import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { decks } from "./deck.js";

export const notes = sqliteTable("notes", {
  back: text("back").notNull(),
  createdAt: text("created_at").notNull(),
  deckId: text("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  front: text("front").notNull(),
  id: text("id").primaryKey(),
  updatedAt: text("updated_at").notNull(),
});
