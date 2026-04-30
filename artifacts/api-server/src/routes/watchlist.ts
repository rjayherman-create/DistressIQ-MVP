import { Router, type IRouter } from "express";
import {
  GetWatchlistResponse,
  AddToWatchlistResponse,
  RemoveFromWatchlistResponse,
} from "@workspace/api-zod";
import { db, watchlistsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// In-memory fallback for unauthenticated users
const anonWatchlist = new Set<string>();

router.get("/watchlist", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const rows = await db
        .select()
        .from(watchlistsTable)
        .where(eq(watchlistsTable.userId, req.user.id));
      const tickers = rows.map((r) => r.ticker);
      const parsed = GetWatchlistResponse.parse({ tickers });
      res.json(parsed);
      return;
    } catch (err) {
      logger.warn({ err }, "DB watchlist read failed — falling back to anon store");
    }
  }

  const parsed = GetWatchlistResponse.parse({ tickers: [...anonWatchlist] });
  res.json(parsed);
});

router.post("/watchlist/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const upper = ticker.toUpperCase();

  if (req.isAuthenticated()) {
    try {
      await db
        .insert(watchlistsTable)
        .values({ userId: req.user.id, ticker: upper })
        .onConflictDoNothing();

      const rows = await db
        .select()
        .from(watchlistsTable)
        .where(eq(watchlistsTable.userId, req.user.id));
      const tickers = rows.map((r) => r.ticker);
      const parsed = AddToWatchlistResponse.parse({ tickers });
      res.json(parsed);
      return;
    } catch (err) {
      logger.warn({ err }, "DB watchlist insert failed — falling back to anon store");
    }
  }

  anonWatchlist.add(upper);
  const parsed = AddToWatchlistResponse.parse({ tickers: [...anonWatchlist] });
  res.json(parsed);
});

router.delete("/watchlist/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const upper = ticker.toUpperCase();

  if (req.isAuthenticated()) {
    try {
      await db
        .delete(watchlistsTable)
        .where(
          and(
            eq(watchlistsTable.userId, req.user.id),
            eq(watchlistsTable.ticker, upper),
          ),
        );

      const rows = await db
        .select()
        .from(watchlistsTable)
        .where(eq(watchlistsTable.userId, req.user.id));
      const tickers = rows.map((r) => r.ticker);
      const parsed = RemoveFromWatchlistResponse.parse({ tickers });
      res.json(parsed);
      return;
    } catch (err) {
      logger.warn({ err }, "DB watchlist delete failed — falling back to anon store");
    }
  }

  anonWatchlist.delete(upper);
  const parsed = RemoveFromWatchlistResponse.parse({ tickers: [...anonWatchlist] });
  res.json(parsed);
});

export default router;
