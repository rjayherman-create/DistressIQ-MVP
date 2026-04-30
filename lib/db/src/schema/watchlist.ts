import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const watchlistsTable = pgTable("watchlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WatchlistEntry = typeof watchlistsTable.$inferSelect;
export type InsertWatchlistEntry = typeof watchlistsTable.$inferInsert;

export const alertsTable = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  message: text("message").notNull(),
  severity: text("severity", { enum: ["info", "warning", "critical"] })
    .notNull()
    .default("info"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AlertEntry = typeof alertsTable.$inferSelect;
export type InsertAlertEntry = typeof alertsTable.$inferInsert;
