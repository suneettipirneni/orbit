import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { decks } from "./deck.js";
import { notes } from "./note.js";

export const cards = sqliteTable("cards", {
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
