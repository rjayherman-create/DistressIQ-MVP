import { logger } from "./logger";

const CACHE_TTL_MS = 60_000; // 60 seconds for prices
const HISTORY_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours for historical data

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

// ---------------------------------------------------------------------------
// Period-based history config
// ---------------------------------------------------------------------------

export const VALID_PERIODS = ["1W", "1M", "3M", "6M", "1Y"] as const;
export type ValidPeriod = (typeof VALID_PERIODS)[number];

/** Yahoo Finance interval + range params for each UI period. */
const PERIOD_PARAMS: Record<ValidPeriod, { interval: string; range: string }> = {
  "1W": { interval: "1d",  range: "5d"  },
  "1M": { interval: "1d",  range: "1mo" },
  "3M": { interval: "1wk", range: "3mo" },
  "6M": { interval: "1wk", range: "6mo" },
  "1Y": { interval: "1mo", range: "1y"  },
};

/** Cache TTL per period — shorter periods refresh more often. */
const PERIOD_CACHE_TTL_MS: Record<ValidPeriod, number> = {
  "1W": 5  * 60 * 1000,        // 5 minutes
  "1M": 30 * 60 * 1000,        // 30 minutes
  "3M": 6  * 60 * 60 * 1000,   // 6 hours
  "6M": 6  * 60 * 60 * 1000,   // 6 hours
  "1Y": 24 * 60 * 60 * 1000,   // 24 hours
};

// ---------------------------------------------------------------------------
// Price cache
// ---------------------------------------------------------------------------

interface PriceEntry {
  price: number;
  volume: string;
  fetchedAt: number;
}

const priceCache = new Map<string, PriceEntry>();

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return String(vol);
}

/**
 * Fetch current price and volume for a list of tickers in a single request.
 * Results are cached per-ticker for CACHE_TTL_MS.
 */
export async function fetchQuotes(
  tickers: string[]
): Promise<Map<string, PriceEntry>> {
  const now = Date.now();
  const stale: string[] = [];
  const result = new Map<string, PriceEntry>();

  for (const t of tickers) {
    const cached = priceCache.get(t);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      result.set(t, cached);
    } else {
      stale.push(t);
    }
  }

  if (stale.length === 0) return result;

  try {
    const symbols = stale.join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketVolume`;
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(5000) });

    if (!res.ok) throw new Error(`Yahoo Finance quotes HTTP ${res.status} ${res.statusText}`);

    const json = (await res.json()) as {
      quoteResponse?: {
        result?: Array<{
          symbol: string;
          regularMarketPrice?: number;
          regularMarketVolume?: number;
        }>;
      };
    };

    const items = json?.quoteResponse?.result ?? [];
    for (const item of items) {
      if (item.regularMarketPrice != null) {
        const entry: PriceEntry = {
          price: parseFloat(item.regularMarketPrice.toFixed(4)),
          volume: formatVolume(item.regularMarketVolume ?? 0),
          fetchedAt: now,
        };
        priceCache.set(item.symbol.toUpperCase(), entry);
        result.set(item.symbol.toUpperCase(), entry);
      }
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    logger.warn({ err, timeout: isTimeout }, isTimeout
      ? "Yahoo Finance quote fetch timed out — using cached/static values"
      : "Yahoo Finance quote fetch failed — using cached/static values"
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Historical chart cache
// ---------------------------------------------------------------------------

type ChartPoint = { d: string; p: number };

interface HistoryEntry {
  data: ChartPoint[];
  fetchedAt: number;
}

const historyCache = new Map<string, HistoryEntry>();

function formatWeekLabel(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  return `${month} ${day}`;
}

/**
 * Fetch 8 weeks of weekly price history for a ticker.
 * Results are cached per-ticker for HISTORY_CACHE_TTL_MS.
 */
export async function fetchWeeklyHistory(ticker: string): Promise<ChartPoint[] | null> {
  const now = Date.now();
  const cached = historyCache.get(ticker);
  if (cached && now - cached.fetchedAt < HISTORY_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1wk&range=2mo`;
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(5000) });

    if (!res.ok) throw new Error(`Yahoo Finance history HTTP ${res.status} ${res.statusText}`);

    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          indicators?: { quote?: Array<{ close?: (number | null)[] }> };
        }>;
      };
    };

    const result = json?.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];

    const points: ChartPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const price = closes[i];
      if (price != null && isFinite(price)) {
        points.push({ d: formatWeekLabel(timestamps[i]), p: parseFloat(price.toFixed(4)) });
      }
    }

    if (points.length > 0) {
      historyCache.set(ticker, { data: points, fetchedAt: now });
      return points;
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    logger.warn({ err, ticker, timeout: isTimeout }, isTimeout
      ? `Yahoo Finance history fetch timed out for ${ticker} — keeping static chart`
      : `Yahoo Finance history fetch failed for ${ticker} — keeping static chart`
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Period-based history cache (keyed by "TICKER:PERIOD")
// ---------------------------------------------------------------------------

const periodHistoryCache = new Map<string, HistoryEntry>();

function formatPeriodLabel(timestamp: number, period: ValidPeriod): string {
  const date = new Date(timestamp * 1000);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  if (period === "1Y") return month;
  if (period === "1W" || period === "1M") return `${month} ${day}`;
  return `${month} ${day}`;
}

/**
 * Fetch price history for a ticker over a given UI period.
 * Uses period-specific Yahoo Finance interval/range params and TTLs.
 * Results are cached per ticker+period.
 */
export async function fetchHistory(
  ticker: string,
  period: ValidPeriod,
): Promise<ChartPoint[] | null> {
  const cacheKey = `${ticker}:${period}`;
  const now = Date.now();
  const cached = periodHistoryCache.get(cacheKey);
  const ttl = PERIOD_CACHE_TTL_MS[period];

  if (cached && now - cached.fetchedAt < ttl) {
    return cached.data;
  }

  const { interval, range } = PERIOD_PARAMS[period];

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(5000) });

    if (!res.ok) throw new Error(`Yahoo Finance history HTTP ${res.status} ${res.statusText}`);

    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          indicators?: { quote?: Array<{ close?: (number | null)[] }> };
        }>;
      };
    };

    const result = json?.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];

    const points: ChartPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const price = closes[i];
      if (price != null && isFinite(price)) {
        points.push({
          d: formatPeriodLabel(timestamps[i], period),
          p: parseFloat(price.toFixed(4)),
        });
      }
    }

    if (points.length > 0) {
      periodHistoryCache.set(cacheKey, { data: points, fetchedAt: now });
      return points;
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    logger.warn({ err, ticker, period, timeout: isTimeout }, isTimeout
      ? `Yahoo Finance history fetch timed out for ${ticker} (${period})`
      : `Yahoo Finance history fetch failed for ${ticker} (${period})`
    );
  }

  return null;
}
