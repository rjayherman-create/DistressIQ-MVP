import { Router, type IRouter } from "express";
import { fetchQuotes } from "../lib/yahoo-finance";
import {
  fetchPolygonBatch,
  fetchAlphaVantage,
} from "../lib/market-data";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * Fill in any missing ticker prices in `result` by fetching from Yahoo Finance.
 * Only tickers absent from `result` are queried; already-verified prices are
 * never overwritten.
 */
async function fillFromYahoo(
  missing: string[],
  result: Record<string, number>,
): Promise<void> {
  if (missing.length === 0) return;
  const yahooQuotes = await fetchQuotes(missing);
  for (const [ticker, entry] of yahooQuotes.entries()) {
    if (!(ticker in result)) {
      result[ticker] = entry.price;
    }
  }
}

/**
 * GET /api/prices?tickers=MVST,MULN,IDEX,...
 *
 * Returns a JSON object mapping each requested ticker to its current market
 * price.  Uses the best available source in priority order:
 *   1. Polygon batch snapshot (single request, requires POLYGON_API_KEY)
 *   2. Alpha Vantage per-ticker, processed sequentially to respect the free-tier
 *      rate limit (requires ALPHA_VANTAGE_KEY; covers tickers Polygon missed)
 *   3. Yahoo Finance for any tickers still missing
 *
 * Tickers for which no price could be fetched are omitted from the response.
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

  // ---------------------------------------------------------------------------
  // Primary path: Polygon batch → Alpha Vantage (sequential) → Yahoo Finance
  // ---------------------------------------------------------------------------
  // Polygon batch fetches all tickers in a single API call.  Any tickers not
  // covered by Polygon are picked up by Alpha Vantage one at a time (sequential
  // to respect the free-tier rate limit of 5 req/min).  Yahoo Finance covers
  // anything still missing.
  if (process.env.POLYGON_API_KEY) {
    const result: Record<string, number> = {};

    // 1. Polygon batch — one request for all tickers.
    try {
      const polygonData = await fetchPolygonBatch(tickers);
      for (const [ticker, data] of polygonData) {
        result[ticker] = data.price;
      }
    } catch (err) {
      logger.warn({ err }, "Polygon batch fetch failed — continuing to fallbacks");
    }

    // 2. Alpha Vantage — sequential to avoid rate limiting.
    if (process.env.ALPHA_VANTAGE_KEY) {
      const missing = tickers.filter((t) => !(t in result));
      for (const ticker of missing) {
        try {
          const data = await fetchAlphaVantage(ticker);
          result[ticker] = data.price;
        } catch (err) {
          logger.warn(
            { ticker, err },
            "Alpha Vantage fetch failed for ticker — falling through to Yahoo Finance",
          );
        }
      }
    }

    // 3. Yahoo Finance for any still-missing tickers.
    await fillFromYahoo(tickers.filter((t) => !(t in result)), result);

    res.json(result);
    return;
  }

  // ---------------------------------------------------------------------------
  // Fallback path: Yahoo Finance (no Polygon key configured)
  // ---------------------------------------------------------------------------
  logger.debug(
    "No POLYGON_API_KEY set — falling back to Yahoo Finance",
  );

  const quotes = await fetchQuotes(tickers);

  const result: Record<string, number> = {};
  for (const [ticker, entry] of quotes.entries()) {
    result[ticker] = entry.price;
  }

  res.json(result);
});

export default router;
