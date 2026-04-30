import yahooFinance from "yahoo-finance2";
import { logger } from "./logger";

// Minimal types extracted from yahoo-finance2 for our usage
interface YFQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketVolume?: number;
  [key: string]: unknown;
}

interface YFChartQuote {
  date: Date | string | number;
  close: number | null;
  [key: string]: unknown;
}

interface YFChartResult {
  quotes: YFChartQuote[];
}

const CACHE_TTL_MS = 60_000; // 60 seconds for prices
const HISTORY_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours for historical data

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
 * Fetch current price and volume for a list of tickers using yahoo-finance2.
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
    const items = (await yahooFinance.quote(stale, {
      fields: ["regularMarketPrice", "regularMarketVolume"],
    })) as YFQuote[];
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
    logger.warn({ err }, "Yahoo Finance quote fetch failed — using cached/static values");
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

function formatWeekLabel(date: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/**
 * Fetch 8 weeks of weekly price history for a ticker using yahoo-finance2.
 * Results are cached per-ticker for HISTORY_CACHE_TTL_MS.
 */
export async function fetchWeeklyHistory(ticker: string): Promise<ChartPoint[] | null> {
  const now = Date.now();
  const cached = historyCache.get(ticker);
  if (cached && now - cached.fetchedAt < HISTORY_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const twoMonthsAgo = new Date(now - 8 * 7 * 24 * 60 * 60 * 1000);
    const historical = (await yahooFinance.chart(ticker, {
      interval: "1wk",
      period1: twoMonthsAgo,
      return: "array",
    })) as YFChartResult;

    const points: ChartPoint[] = [];
    for (const q of historical.quotes) {
      const price = q.close;
      if (price != null && isFinite(price) && q.date) {
        points.push({
          d: formatWeekLabel(new Date(q.date)),
          p: parseFloat(price.toFixed(4)),
        });
      }
    }

    if (points.length > 0) {
      historyCache.set(ticker, { data: points, fetchedAt: now });
      return points;
    }
  } catch (err) {
    logger.warn({ err, ticker }, `Yahoo Finance history fetch failed for ${ticker} — keeping static chart`);
  }

  return null;
}
