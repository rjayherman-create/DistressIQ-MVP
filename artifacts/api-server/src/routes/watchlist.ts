import { Router, type IRouter } from "express";
import {
  GetWatchlistResponse,
  AddToWatchlistResponse,
  RemoveFromWatchlistResponse,
} from "@workspace/api-zod";
import { db, watchlistsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/watchlist", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const rows = await db
    .select()
    .from(watchlistsTable)
    .where(eq(watchlistsTable.userId, userId));
  const tickers = rows.map((r) => r.ticker);
  const parsed = GetWatchlistResponse.parse({ tickers });
  res.json(parsed);
});

router.post("/watchlist/:ticker", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const ticker = req.params.ticker.toUpperCase();

  // Upsert: only insert if not already present
  const existing = await db
    .select()
    .from(watchlistsTable)
    .where(and(eq(watchlistsTable.userId, userId), eq(watchlistsTable.ticker, ticker)));

  if (existing.length === 0) {
    await db.insert(watchlistsTable).values({ userId, ticker });
  }

  const rows = await db
    .select()
    .from(watchlistsTable)
    .where(eq(watchlistsTable.userId, userId));
  const tickers = rows.map((r) => r.ticker);
  const parsed = AddToWatchlistResponse.parse({ tickers });
  res.json(parsed);
});

router.delete("/watchlist/:ticker", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const ticker = req.params.ticker.toUpperCase();

  await db
    .delete(watchlistsTable)
    .where(and(eq(watchlistsTable.userId, userId), eq(watchlistsTable.ticker, ticker)));

  const rows = await db
    .select()
    .from(watchlistsTable)
    .where(eq(watchlistsTable.userId, userId));
  const tickers = rows.map((r) => r.ticker);
  const parsed = RemoveFromWatchlistResponse.parse({ tickers });
  res.json(parsed);
});

export default router;
