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

const PERIOD_PARAMS: Record<string, { interval: string; range: string }> = {
  "1W": { interval: "1d", range: "5d" },
  "1M": { interval: "1d", range: "1mo" },
  "3M": { interval: "1wk", range: "3mo" },
  "6M": { interval: "1wk", range: "6mo" },
  "1Y": { interval: "1mo", range: "1y" },
};

const PERIOD_CACHE_TTL_MS: Record<string, number> = {
  "1W": 5 * 60_000,
  "1M": 30 * 60_000,
  "3M": 2 * 60 * 60_000,
  "6M": 4 * 60 * 60_000,
  "1Y": 6 * 60 * 60_000,
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
// Period-based history cache (1W / 1M / 3M / 6M / 1Y)
// ---------------------------------------------------------------------------

interface PeriodHistoryEntry {
  data: ChartPoint[];
  fetchedAt: number;
}

const periodHistoryCache = new Map<string, PeriodHistoryEntry>();

function formatPeriodLabel(timestamp: number, interval: string, period: string): string {
  const date = new Date(timestamp * 1000);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  if (period === "1W" && interval === "1d") {
    return days[date.getUTCDay()];
  }
  if (interval === "1d" || interval === "1wk") {
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
  }
  // Monthly
  return months[date.getUTCMonth()];
}

export const VALID_PERIODS = new Set(Object.keys(PERIOD_PARAMS));

/**
 * Fetch price history for a ticker and a UI period (1W / 1M / 3M / 6M / 1Y).
 * Results are cached per ticker+period with period-appropriate TTLs.
 */
export async function fetchHistory(
  ticker: string,
  period: string
): Promise<ChartPoint[] | null> {
  const params = PERIOD_PARAMS[period];
  if (!params) return null;

  const cacheKey = `${ticker}:${period}`;
  const now = Date.now();
  const cached = periodHistoryCache.get(cacheKey);
  const ttl = PERIOD_CACHE_TTL_MS[period] ?? 60_000;

  if (cached && now - cached.fetchedAt < ttl) {
    return cached.data;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${params.interval}&range=${params.range}`;
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
          d: formatPeriodLabel(timestamps[i], params.interval, period),
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
      ? `Yahoo Finance ${period} history fetch timed out for ${ticker}`
      : `Yahoo Finance ${period} history fetch failed for ${ticker}`
    );
  }

  return null;
}
