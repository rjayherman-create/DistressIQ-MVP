import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const stockWatchlistTable = pgTable(
  "stock_watchlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    symbol: text("symbol").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique("stock_watchlist_user_symbol_unique").on(table.userId, table.symbol)],
);

export type InsertStockWatchlistItem = typeof stockWatchlistTable.$inferInsert;
export type StockWatchlistItem = typeof stockWatchlistTable.$inferSelect;
