import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const wishlistTable = pgTable(
  "wishlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    itemId: text("item_id").notNull(),
    itemType: text("item_type").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique("wishlist_user_item_unique").on(table.userId, table.itemId)],
);

export type InsertWishlistItem = typeof wishlistTable.$inferInsert;
export type WishlistItem = typeof wishlistTable.$inferSelect;
