import { Router, type IRouter } from "express";
import {
  ListStocksResponse,
  GetStockResponse,
} from "@workspace/api-zod";
import { fetchQuotes, fetchWeeklyHistory, fetchHistory, VALID_PERIODS } from "../lib/yahoo-finance";
import { fetchPolygonBatch, fetchAlphaVantage, type RawMarketData } from "../lib/market-data";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Static definitions — scores, notes, and trade plan zones are analyst-assigned.
// Price, volume, and chart are overlaid with live data at request time.
const stockDefinitions = [
  {
    ticker: "TELA",
    company: "TELA Bio",
    price: 0.83,
    exchange: "NASDAQ",
    industry: "MedTech",
    daysUnderOne: 47,
    daysToDeadline: 174,
    bounceProbability: 68,
    delistingRisk: 34,
    complianceScore: 74,
    financialScore: 41,
    operatorScore: 58,
    industryScore: 49,
    patternScore: 66,
    tradabilityScore: 72,
    operatorNote: "Mixed management record; not a serial destroyer.",
    financialNote: "Weak profitability, but capital markets access still open.",
    tradeWindow: "7–21 days",
    entryZone: "$0.78–$0.82",
    targetZone: "$0.96–$1.06",
    stopZone: "$0.72",
    status: "Recovery Candidate",
    volume: "133.6K",
    chart: [
      { d: "W1", p: 1.34 },
      { d: "W2", p: 1.12 },
      { d: "W3", p: 0.98 },
      { d: "W4", p: 0.88 },
      { d: "W5", p: 0.84 },
      { d: "W6", p: 0.79 },
      { d: "W7", p: 0.76 },
      { d: "W8", p: 0.83 },
    ],
  },
  {
    ticker: "GAME",
    company: "GameSquare",
    price: 0.29,
    exchange: "NASDAQ",
    industry: "Media / Esports",
    daysUnderOne: 212,
    daysToDeadline: 167,
    bounceProbability: 39,
    delistingRisk: 77,
    complianceScore: 31,
    financialScore: 26,
    operatorScore: 43,
    industryScore: 45,
    patternScore: 34,
    tradabilityScore: 48,
    operatorNote: "Late-stage compliance case with extension already used.",
    financialNote: "Heavily dependent on capital markets support.",
    tradeWindow: "3–10 days",
    entryZone: "$0.26–$0.28",
    targetZone: "$0.34–$0.40",
    stopZone: "$0.23",
    status: "High Delisting Risk",
    volume: "589K",
    chart: [
      { d: "W1", p: 0.74 },
      { d: "W2", p: 0.61 },
      { d: "W3", p: 0.52 },
      { d: "W4", p: 0.43 },
      { d: "W5", p: 0.38 },
      { d: "W6", p: 0.33 },
      { d: "W7", p: 0.27 },
      { d: "W8", p: 0.29 },
    ],
  },
  {
    ticker: "FFIE",
    company: "Faraday Future Intelligent Electric",
    price: 0.35,
    exchange: "NASDAQ",
    industry: "EV",
    daysUnderOne: 58,
    daysToDeadline: 176,
    bounceProbability: 54,
    delistingRisk: 62,
    complianceScore: 60,
    financialScore: 18,
    operatorScore: 35,
    industryScore: 24,
    patternScore: 59,
    tradabilityScore: 67,
    operatorNote: "Speculative operator profile with higher pattern risk.",
    financialNote:
      "Very weak business quality; movement is mostly capital-market driven.",
    tradeWindow: "2–8 days",
    entryZone: "$0.31–$0.34",
    targetZone: "$0.42–$0.50",
    stopZone: "$0.28",
    status: "Management Action Likely",
    volume: "235.1M",
    chart: [
      { d: "W1", p: 1.11 },
      { d: "W2", p: 0.92 },
      { d: "W3", p: 0.76 },
      { d: "W4", p: 0.63 },
      { d: "W5", p: 0.49 },
      { d: "W6", p: 0.37 },
      { d: "W7", p: 0.29 },
      { d: "W8", p: 0.35 },
    ],
  },
  {
    ticker: "ALXO",
    company: "ALX Oncology",
    price: 0.96,
    exchange: "NASDAQ",
    industry: "Biotech",
    daysUnderOne: 29,
    daysToDeadline: 205,
    bounceProbability: 71,
    delistingRisk: 28,
    complianceScore: 82,
    financialScore: 44,
    operatorScore: 61,
    industryScore: 22,
    patternScore: 70,
    tradabilityScore: 75,
    operatorNote:
      "Cleaner than average setup, but biotech remains structurally risky.",
    financialNote:
      "Cash exists, but survival still relies on pipeline outcomes.",
    tradeWindow: "5–15 days",
    entryZone: "$0.92–$0.95",
    targetZone: "$1.05–$1.15",
    stopZone: "$0.88",
    status: "Recovery Candidate",
    volume: "1.8M",
    chart: [
      { d: "W1", p: 1.48 },
      { d: "W2", p: 1.27 },
      { d: "W3", p: 1.14 },
      { d: "W4", p: 1.03 },
      { d: "W5", p: 0.98 },
      { d: "W6", p: 0.94 },
      { d: "W7", p: 0.93 },
      { d: "W8", p: 0.96 },
    ],
  },
];

const TICKERS = stockDefinitions.map((s) => s.ticker);

// ---------------------------------------------------------------------------
// fetchLivePrices
// ---------------------------------------------------------------------------
// Attempts to build a price map from Polygon (batch) when POLYGON_API_KEY is
// present.  For any tickers not covered by Polygon, Alpha Vantage is tried as
// an individual fallback when ALPHA_VANTAGE_KEY is set.  Yahoo Finance is used
// for all remaining tickers (or as the sole source when no API keys are set).

/** Price and volume snapshot used internally by the stocks route. */
interface PriceInfo {
  price: number;
  /** Human-readable volume string (e.g. '1.5M', '500K') — not a raw number. */
  volume: string;
  /** Unix timestamp (ms) of when the price was fetched. */
  fetchedAt: number;
}

/**
 * Format a raw volume number into a human-readable string with K/M suffixes.
 * Returns null for undefined or non-finite inputs.
 */
function formatVol(vol: number | undefined): string | null {
  if (vol == null || !isFinite(vol)) return null;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return String(vol);
}

/**
 * Build a price map for the given tickers using the best available sources.
 *
 * Priority order:
 *  1. Polygon batch snapshot (when POLYGON_API_KEY is set)
 *  2. Alpha Vantage per-ticker (when ALPHA_VANTAGE_KEY is set, for any tickers
 *     not covered by Polygon)
 *  3. Yahoo Finance for all remaining tickers
 *
 * @param tickers - Uppercase ticker symbols to look up.
 * @returns Map of ticker → PriceInfo for every ticker that could be priced.
 */
async function fetchLivePrices(
  tickers: string[],
): Promise<Map<string, PriceInfo>> {
  const now = Date.now();
  const result = new Map<string, PriceInfo>();

  // --- Polygon batch ---
  if (process.env.POLYGON_API_KEY) {
    try {
      const polygonData = await fetchPolygonBatch(tickers);
      for (const [sym, data] of polygonData) {
        result.set(sym, {
          price: data.price,
          volume: formatVol(data.volume) ?? "—",
          fetchedAt: now,
        });
      }
    } catch (err) {
      logger.warn({ err }, "Polygon batch fetch failed — continuing to fallbacks");
    }
  }

  // --- Alpha Vantage per-ticker (for any still missing) ---
  if (process.env.ALPHA_VANTAGE_KEY) {
    const missing = tickers.filter((t) => !result.has(t));
    await Promise.all(
      missing.map(async (ticker) => {
        try {
          const data: RawMarketData = await fetchAlphaVantage(ticker);
          result.set(ticker, {
            price: data.price,
            volume: formatVol(data.volume) ?? "—",
            fetchedAt: now,
          });
        } catch (err) {
          logger.warn(
            { ticker, err },
            "Alpha Vantage fetch failed for ticker — falling through to Yahoo Finance",
          );
        }
      }),
    );
  }

  // --- Yahoo Finance for any still missing ---
  const stillMissing = tickers.filter((t) => !result.has(t));
  if (stillMissing.length > 0) {
    const yahooQuotes = await fetchQuotes(stillMissing);
    for (const [sym, entry] of yahooQuotes) {
      result.set(sym, entry);
    }
  }

  return result;
}

async function buildLiveStockData() {
  const [quotes, ...histories] = await Promise.all([
    fetchLivePrices(TICKERS),
    ...TICKERS.map((t) => fetchWeeklyHistory(t)),
  ]);

  const fallbackTimestamp = new Date().toISOString();
  return stockDefinitions.map((def, i) => {
    const quote = quotes.get(def.ticker);
    const history = histories[i];
    return {
      ...def,
      price: quote?.price ?? def.price,
      volume: quote?.volume ?? def.volume,
      priceTimestamp: quote ? new Date(quote.fetchedAt).toISOString() : fallbackTimestamp,
      chart: history ?? def.chart,
    };
  });
}

router.get("/stocks", async (req, res) => {
  const { q, status } = req.query as { q?: string; status?: string };

  let results = await buildLiveStockData();

  if (q) {
    const lower = q.toLowerCase();
    results = results.filter(
      (s) =>
        s.ticker.toLowerCase().includes(lower) ||
        s.company.toLowerCase().includes(lower) ||
        s.industry.toLowerCase().includes(lower)
    );
  }

  if (status && status !== "all") {
    results = results.filter((s) => s.status === status);
  }

  results.sort((a, b) => b.bounceProbability - a.bounceProbability);

  const parsed = ListStocksResponse.parse(results);
  res.json(parsed);
});

router.get("/stocks/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const def = stockDefinitions.find(
    (s) => s.ticker.toUpperCase() === ticker.toUpperCase()
  );

  if (!def) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }

  const [quotes, history] = await Promise.all([
    fetchLivePrices([def.ticker]),
    fetchWeeklyHistory(def.ticker),
  ]);

  const quote = quotes.get(def.ticker);
  const stock = {
    ...def,
    price: quote?.price ?? def.price,
    volume: quote?.volume ?? def.volume,
    priceTimestamp: quote ? new Date(quote.fetchedAt).toISOString() : new Date().toISOString(),
    chart: history ?? def.chart,
  };

  const parsed = GetStockResponse.parse(stock);
  res.json(parsed);
});

router.get("/stocks/:ticker/history", async (req, res) => {
  const { ticker } = req.params;
  const { period = "3M" } = req.query as { period?: string };

  const def = stockDefinitions.find(
    (s) => s.ticker.toUpperCase() === ticker.toUpperCase()
  );

  if (!def) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }

  const upperPeriod = period.toUpperCase();
  if (!VALID_PERIODS.includes(upperPeriod as (typeof VALID_PERIODS)[number])) {
    res.status(400).json({
      error: `Invalid period. Must be one of: ${VALID_PERIODS.join(", ")}`,
    });
    return;
  }

  const data = await fetchHistory(
    def.ticker,
    upperPeriod as (typeof VALID_PERIODS)[number],
  );

  if (!data) {
    res.status(503).json({ error: "History data temporarily unavailable" });
    return;
  }

  res.json({ ticker: def.ticker, period: upperPeriod, data });
});

export default router;
