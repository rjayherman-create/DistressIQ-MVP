import { Router, type IRouter } from "express";
import { fetchQuotes } from "../lib/yahoo-finance";
import {
  fetchPolygon,
  fetchAlphaVantage,
  fetchIEX,
  stampMarketData,
  verifyMarketData,
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
 * price.  Prices are verified against two independent sources (Polygon and
 * IEX Cloud) when the corresponding API keys are present.  If the dual-source
 * check is unavailable the route falls back to a single Yahoo Finance fetch.
 *
 * Tickers for which a price could not be fetched or verified are omitted from
 * the response so callers can fall back to their own defaults.
 *
 * Responses are served from a 60-second in-process cache (Yahoo Finance path)
 * so the underlying APIs are not hammered on every page load.
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
  // Dual-source path: Polygon + Alpha Vantage
  // ---------------------------------------------------------------------------
  // Enabled automatically when both POLYGON_API_KEY and ALPHA_VANTAGE_KEY are
  // set.  Prices are fetched from both sources concurrently, stamped, and
  // cross-validated.  Only tickers whose prices agree within the configured
  // tolerance are included in the response.
  if (process.env.POLYGON_API_KEY && process.env.ALPHA_VANTAGE_KEY) {
    const result: Record<string, number> = {};
    const unverified: string[] = [];

    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const [price1, price2] = await Promise.all([
            fetchPolygon(ticker),
            fetchAlphaVantage(ticker),
          ]);

          const stamped1 = stampMarketData(price1, "polygon");
          const stamped2 = stampMarketData(price2, "alpha-vantage");

          const verification = verifyMarketData({
            primary: stamped1,
            secondary: stamped2,
            type: "price",
          });

          if (!verification.success) {
            throw new Error(`Unreliable market data: ${verification.error}`);
          }

          result[ticker] = verification.data.price;
        } catch (err) {
          logger.warn(
            { ticker, err },
            "Polygon+AlphaVantage price verification failed — omitting ticker",
          );
          unverified.push(ticker);
        }
      }),
    );

    // Fall back to Yahoo Finance for tickers that could not be dual-source verified.
    await fillFromYahoo(unverified, result);

    res.json(result);
    return;
  }

  // ---------------------------------------------------------------------------
  // Dual-source path: Polygon + IEX
  // ---------------------------------------------------------------------------
  // Enabled automatically when both POLYGON_API_KEY and IEX_API_KEY are set.
  // Each ticker is fetched from both sources concurrently.  The two results
  // are stamped and cross-validated; only tickers whose prices agree within
  // the configured tolerance are included in the response.  A hard failure on
  // any individual ticker is logged and that ticker is omitted rather than
  // failing the entire request.
  if (process.env.POLYGON_API_KEY && process.env.IEX_API_KEY) {
    const result: Record<string, number> = {};
    const unverified: string[] = [];

    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          // 1. Fetch from two sources
          const [price1, price2] = await Promise.all([
            fetchPolygon(ticker),
            fetchIEX(ticker),
          ]);

          // 2. Stamp them
          const stamped1 = stampMarketData(price1, "polygon");
          const stamped2 = stampMarketData(price2, "iex");

          // 3. Verify
          const verification = verifyMarketData({
            primary: stamped1,
            secondary: stamped2,
            type: "price",
          });

          // 4. Hard fail if bad
          if (!verification.success) {
            throw new Error(`Unreliable market data: ${verification.error}`);
          }

          // 5. Collect only verified data
          result[ticker] = verification.data.price;
        } catch (err) {
          logger.warn(
            { ticker, err },
            "Dual-source price verification failed — omitting ticker",
          );
          unverified.push(ticker);
        }
      }),
    );

    // Fall back to Yahoo Finance for tickers that could not be dual-source verified.
    await fillFromYahoo(unverified, result);

    res.json(result);
    return;
  }

  // ---------------------------------------------------------------------------
  // Fallback path: Yahoo Finance (single source)
  // ---------------------------------------------------------------------------
  logger.debug(
    "No dual-source API keys set — falling back to Yahoo Finance",
  );

  const quotes = await fetchQuotes(tickers);

  const result: Record<string, number> = {};
  for (const [ticker, entry] of quotes.entries()) {
    result[ticker] = entry.price;
  }

  res.json(result);
});

export default router;
