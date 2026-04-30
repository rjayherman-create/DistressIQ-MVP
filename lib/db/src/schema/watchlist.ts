import { pgTable, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const watchlistsTable = pgTable("watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  ticker: varchar("ticker").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const alertsTable = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  ticker: varchar("ticker").notNull(),
  message: text("message").notNull(),
  severity: varchar("severity").notNull(), // "info", "warning", "critical"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Watchlist = typeof watchlistsTable.$inferSelect;
export type Alert = typeof alertsTable.$inferSelect;
