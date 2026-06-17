import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const decks = sqliteTable("decks", {
  createdAt: text("created_at").notNull(),
  description: text("description"),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  updatedAt: text("updated_at").notNull(),
});
