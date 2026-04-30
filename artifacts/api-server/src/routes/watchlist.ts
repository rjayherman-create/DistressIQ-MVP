import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  GetWatchlistResponse,
  AddToWatchlistParams,
  AddToWatchlistResponse,
  RemoveFromWatchlistParams,
  RemoveFromWatchlistResponse,
} from "@workspace/api-zod";
import { db, stockWatchlistTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/watchlist", async (req, res) => {
  if (!req.isAuthenticated()) {
    const parsed = GetWatchlistResponse.parse({ tickers: [] });
    res.json(parsed);
    return;
  }

  const userId = req.user.id;

  try {
    const rows = await db
      .select()
      .from(stockWatchlistTable)
      .where(eq(stockWatchlistTable.userId, userId));

    const parsed = GetWatchlistResponse.parse({
      tickers: rows.map((r) => r.symbol),
    });
    res.json(parsed);
  } catch (err) {
    logger.error({ err }, "watchlist: failed to fetch");
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

router.post("/watchlist/:ticker", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const parsed = AddToWatchlistParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ticker" });
    return;
  }

  const userId = req.user.id;
  const symbol = parsed.data.ticker.toUpperCase();

  try {
    await db
      .insert(stockWatchlistTable)
      .values({ userId, symbol })
      .onConflictDoNothing();

    const rows = await db
      .select()
      .from(stockWatchlistTable)
      .where(eq(stockWatchlistTable.userId, userId));

    const result = AddToWatchlistResponse.parse({
      tickers: rows.map((r) => r.symbol),
    });
    res.json(result);
  } catch (err) {
    logger.error({ err }, "watchlist: failed to add ticker");
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

router.delete("/watchlist/:ticker", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const parsed = RemoveFromWatchlistParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ticker" });
    return;
  }

  const userId = req.user.id;
  const symbol = parsed.data.ticker.toUpperCase();

  try {
    await db
      .delete(stockWatchlistTable)
      .where(
        and(
          eq(stockWatchlistTable.userId, userId),
          eq(stockWatchlistTable.symbol, symbol),
        ),
      );

    const rows = await db
      .select()
      .from(stockWatchlistTable)
      .where(eq(stockWatchlistTable.userId, userId));

    const result = RemoveFromWatchlistResponse.parse({
      tickers: rows.map((r) => r.symbol),
    });
    res.json(result);
  } catch (err) {
    logger.error({ err }, "watchlist: failed to remove ticker");
    res.status(500).json({ error: "Failed to remove from watchlist" });
  }
});

export default router;
