import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { cards } from "./card.js";

export const reviews = sqliteTable("reviews", {
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
  id: text("id").primaryKey(),
  rating: integer("rating").notNull(),
});
