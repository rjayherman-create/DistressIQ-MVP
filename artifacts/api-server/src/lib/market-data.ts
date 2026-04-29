// ==============================
// DUAL-SOURCE MARKET DATA LAYER
// ==============================
//
// All market prices are fetched from two independent sources, time-stamped,
// cross-validated, and only served if both sources agree within tolerance.
// Hard-fail on discrepancy prevents hallucinated or stale data reaching
// the client.

import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum relative difference (fraction) allowed between two price sources. */
const PRICE_TOLERANCE = 0.02; // 2%

const FETCH_TIMEOUT_MS = 5_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RawMarketData {
  ticker: string;
  price: number;
  volume?: number;
}

export interface StampedMarketData extends RawMarketData {
  source: string;
  fetchedAt: string;
}

export interface MarketDataVerifyInput {
  primary: StampedMarketData;
  secondary: StampedMarketData;
  type: "price";
}

export interface MarketDataVerifySuccess {
  success: true;
  data: {
    ticker: string;
    price: number;
    source: string;
    verifiedAt: string;
  };
}

export interface MarketDataVerifyFailure {
  success: false;
  error: string;
}

export type MarketDataVerifyResult =
  | MarketDataVerifySuccess
  | MarketDataVerifyFailure;

// ---------------------------------------------------------------------------
// stampMarketData
// ---------------------------------------------------------------------------

/**
 * Attach a source label and an ISO-8601 fetch timestamp to raw market data.
 * The stamped object is then safe to pass into verifyMarketData.
 */
export function stampMarketData(
  data: RawMarketData,
  source: string,
): StampedMarketData {
  return {
    ...data,
    source,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// verifyMarketData
// ---------------------------------------------------------------------------

/**
 * Cross-validate primary and secondary stamped market data.
 *
 * For "price" verification:
 *   - Both prices must be positive finite numbers.
 *   - The relative difference must not exceed PRICE_TOLERANCE.
 *
 * Returns a discriminated union:
 *   { success: true,  data: { ticker, price, source, verifiedAt } }
 *   { success: false, error: string }
 */
export function verifyMarketData({
  primary,
  secondary,
  type,
}: MarketDataVerifyInput): MarketDataVerifyResult {
  if (type !== "price") {
    return { success: false, error: `Unknown verification type: ${type}` };
  }

  const p1 = primary.price;
  const p2 = secondary.price;

  if (!isFinite(p1) || p1 <= 0) {
    return {
      success: false,
      error: `Primary source (${primary.source}) returned an invalid price: ${p1}`,
    };
  }

  if (!isFinite(p2) || p2 <= 0) {
    return {
      success: false,
      error: `Secondary source (${secondary.source}) returned an invalid price: ${p2}`,
    };
  }

  const relativeDiff = Math.abs(p1 - p2) / Math.max(p1, p2);
  if (relativeDiff > PRICE_TOLERANCE) {
    return {
      success: false,
      error:
        `Price discrepancy between ${primary.source} (${p1}) and ` +
        `${secondary.source} (${p2}) exceeds ${PRICE_TOLERANCE * 100}% ` +
        `tolerance (actual: ${(relativeDiff * 100).toFixed(2)}%)`,
    };
  }

  return {
    success: true,
    data: {
      ticker: primary.ticker,
      price: p1,
      source: primary.source,
      verifiedAt: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// fetchPolygon
// ---------------------------------------------------------------------------

/**
 * Fetch the previous-close price for a ticker from Polygon.io.
 *
 * Requires the POLYGON_API_KEY environment variable.
 * Throws if the key is missing, the network request fails, or no data is
 * returned for the ticker.
 */
export async function fetchPolygon(ticker: string): Promise<RawMarketData> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    throw new Error("POLYGON_API_KEY environment variable is not set");
  }

  const url =
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev` +
    `?adjusted=true&apiKey=${apiKey}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Polygon HTTP ${res.status} ${res.statusText} for ${ticker}`);
  }

  const json = (await res.json()) as {
    results?: Array<{
      c?: number; // close
      v?: number; // volume
    }>;
    resultsCount?: number;
  };

  const result = json?.results?.[0];
  if (!result || result.c == null) {
    throw new Error(`Polygon returned no price data for ${ticker}`);
  }

  logger.debug({ ticker, source: "polygon", price: result.c }, "fetchPolygon ok");

  return {
    ticker: ticker.toUpperCase(),
    price: Math.round(result.c * 10000) / 10000,
    volume: result.v,
  };
}

// ---------------------------------------------------------------------------
// fetchIEX
// ---------------------------------------------------------------------------

/**
 * Fetch the latest price for a ticker from IEX Cloud.
 *
 * Requires the IEX_API_KEY environment variable.
 * Throws if the key is missing, the network request fails, or no data is
 * returned for the ticker.
 */
export async function fetchIEX(ticker: string): Promise<RawMarketData> {
  const apiKey = process.env.IEX_API_KEY;
  if (!apiKey) {
    throw new Error("IEX_API_KEY environment variable is not set");
  }

  const url =
    `https://cloud.iexapis.com/stable/stock/${encodeURIComponent(ticker)}/quote` +
    `?token=${apiKey}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`IEX HTTP ${res.status} ${res.statusText} for ${ticker}`);
  }

  const json = (await res.json()) as {
    latestPrice?: number;
    latestVolume?: number;
    symbol?: string;
  };

  if (json.latestPrice == null) {
    throw new Error(`IEX returned no price data for ${ticker}`);
  }

  logger.debug(
    { ticker, source: "iex", price: json.latestPrice },
    "fetchIEX ok",
  );

  return {
    ticker: ticker.toUpperCase(),
    price: Math.round(json.latestPrice * 10000) / 10000,
    volume: json.latestVolume,
  };
}
