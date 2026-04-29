import { logger } from "./logger";

const VERIFIED_PRICE_CACHE_TTL_MS = 60_000; // 60 seconds, same as Yahoo Finance quotes

/** Maximum absolute price difference (USD) between two sources before data is blocked. */
const MAX_PRICE_VARIANCE = 0.05;

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface VerifiedPriceEntry {
  price: number;
  fetchedAt: number;
}

const verifiedPriceCache = new Map<string, VerifiedPriceEntry>();

// ---------------------------------------------------------------------------
// Polygon.io
// ---------------------------------------------------------------------------

/**
 * Fetch the most recent trade price for a ticker from Polygon.io.
 * Requires the POLYGON_API_KEY environment variable.
 */
async function getPolygonPrice(ticker: string): Promise<number> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) throw new Error("POLYGON_API_KEY is not set");

  const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev?adjusted=true&apiKey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok)
    throw new Error(`Polygon HTTP ${res.status} ${res.statusText}`);

  const json = (await res.json()) as {
    results?: Array<{ c?: number }>;
    status?: string;
  };

  const close = json?.results?.[0]?.c;
  if (close == null || !isFinite(close))
    throw new Error(`Polygon returned no usable price for ${ticker}`);

  return close;
}

// ---------------------------------------------------------------------------
// Alpha Vantage
// ---------------------------------------------------------------------------

/**
 * Fetch the most recent close price for a ticker from Alpha Vantage.
 * Requires the ALPHA_VANTAGE_API_KEY environment variable.
 */
async function getAlphaVantagePrice(ticker: string): Promise<number> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) throw new Error("ALPHA_VANTAGE_API_KEY is not set");

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok)
    throw new Error(`Alpha Vantage HTTP ${res.status} ${res.statusText}`);

  const json = (await res.json()) as {
    "Global Quote"?: { "05. price"?: string };
  };

  const raw = json?.["Global Quote"]?.["05. price"];
  const price = raw != null ? parseFloat(raw) : NaN;
  if (!isFinite(price))
    throw new Error(`Alpha Vantage returned no usable price for ${ticker}`);

  return price;
}

// ---------------------------------------------------------------------------
// Verified price
// ---------------------------------------------------------------------------

/**
 * Fetch and cross-verify the current price for a single ticker using two
 * independent sources (Polygon.io and Alpha Vantage).
 *
 * If the absolute difference between the two prices exceeds $0.05, the data
 * is considered inconsistent and an error is thrown so callers can refuse to
 * display potentially stale or erroneous prices.
 *
 * When the sources agree, the midpoint of the two prices is returned.
 */
export async function getVerifiedPrice(ticker: string): Promise<number> {
  const sources = await Promise.all([
    getPolygonPrice(ticker),
    getAlphaVantagePrice(ticker),
  ]);

  const variance = Math.abs(sources[0] - sources[1]);

  if (variance > MAX_PRICE_VARIANCE) {
    throw new Error(
      `Price mismatch for ${ticker} — blocked (Polygon: ${sources[0]}, Alpha Vantage: ${sources[1]}, delta: ${variance.toFixed(4)})`
    );
  }

  return (sources[0] + sources[1]) / 2;
}

// ---------------------------------------------------------------------------
// Batch helper with caching (mirrors fetchQuotes interface)
// ---------------------------------------------------------------------------

/**
 * Fetch cross-verified prices for multiple tickers in parallel.
 * Results are cached per-ticker for VERIFIED_PRICE_CACHE_TTL_MS.
 *
 * Tickers whose verified price cannot be obtained (API keys absent, network
 * error, or price mismatch) are omitted from the returned map so callers can
 * fall back to an alternative source.
 */
export async function fetchVerifiedPrices(
  tickers: string[]
): Promise<Map<string, number>> {
  const now = Date.now();
  const stale: string[] = [];
  const result = new Map<string, number>();

  for (const t of tickers) {
    const cached = verifiedPriceCache.get(t);
    if (cached && now - cached.fetchedAt < VERIFIED_PRICE_CACHE_TTL_MS) {
      result.set(t, cached.price);
    } else {
      stale.push(t);
    }
  }

  if (stale.length === 0) return result;

  await Promise.all(
    stale.map(async (ticker) => {
      try {
        const price = await getVerifiedPrice(ticker);
        const entry: VerifiedPriceEntry = { price, fetchedAt: now };
        verifiedPriceCache.set(ticker, entry);
        result.set(ticker, price);
      } catch (err) {
        logger.warn(
          { err, ticker },
          `Verified price unavailable for ${ticker} — caller will fall back`
        );
      }
    })
  );

  return result;
}
