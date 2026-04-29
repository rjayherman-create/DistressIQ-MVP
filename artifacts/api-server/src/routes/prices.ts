import { Router, type IRouter } from "express";
import { fetchQuotes } from "../lib/yahoo-finance";

const router: IRouter = Router();

/**
 * GET /api/prices?tickers=MVST,MULN,IDEX,...
 *
 * Returns a JSON object mapping each requested ticker to its current market
 * price.  Tickers for which a price could not be fetched are omitted from
 * the response so callers can fall back to their own defaults.
 *
 * Responses are served from a 60-second in-process cache so the underlying
 * Yahoo Finance API is not hammered on every page load.
 */
router.get("/prices", async (req, res) => {
  const raw = req.query.tickers;
  if (!raw || typeof raw !== "string") {
    res.status(400).json({ error: "tickers query parameter is required" });
    return;
  }

  const tickers = raw
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 100); // cap at 100 to prevent abuse

  if (tickers.length === 0) {
    res.status(400).json({ error: "No valid tickers provided" });
    return;
  }

  const quotes = await fetchQuotes(tickers);

  const result: Record<string, number> = {};
  for (const [ticker, entry] of quotes.entries()) {
    result[ticker] = entry.price;
  }

  res.json(result);
});

export default router;
