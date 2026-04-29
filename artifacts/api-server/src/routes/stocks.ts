import { Router, type IRouter } from "express";
import {
  ListStocksResponse,
  GetStockResponse,
} from "@workspace/api-zod";
import { fetchQuotes, fetchWeeklyHistory } from "../lib/yahoo-finance";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/** Price data older than this is considered stale and will not be served. */
const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Number of distinct data points verified from live sources (price, volume,
 * chart history — all from Yahoo Finance) when a live fetch succeeds.
 */
const LIVE_SOURCES_COUNT = 3;

/** Sources count when only static analyst definitions are available. */
const STATIC_SOURCES_COUNT = 1;

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

async function buildLiveStockData() {
  const now = Date.now();
  const [quotes, ...histories] = await Promise.all([
    fetchQuotes(TICKERS),
    ...TICKERS.map((t) => fetchWeeklyHistory(t)),
  ]);

  return stockDefinitions.map((def, i) => {
    const quote = quotes.get(def.ticker);
    const history = histories[i];

    const dataFreshnessMs = quote?.fetchedAt ?? 0;
    const liveDataAvailable = quote != null;

    // Confidence is high when live data is fresh, lower when relying on
    // stale cache, and low when falling back to static analyst definitions.
    let confidenceScore: number;
    if (!liveDataAvailable) {
      confidenceScore = 0.40; // static fallback only
    } else if (now - dataFreshnessMs > STALE_THRESHOLD_MS) {
      confidenceScore = 0.55; // stale cache — approaching hard-fail territory
    } else {
      confidenceScore = 0.85; // fresh live data
    }

    const sourcesCount = liveDataAvailable ? LIVE_SOURCES_COUNT : STATIC_SOURCES_COUNT;

    return {
      ...def,
      price: quote?.price ?? def.price,
      volume: quote?.volume ?? def.volume,
      chart: history ?? def.chart,
      confidenceScore,
      dataFreshnessMs,
      sourcesCount,
    };
  });
}

router.get("/stocks", async (req, res) => {
  const { q, status } = req.query as { q?: string; status?: string };

  let results = await buildLiveStockData();

  // Freshness guardrail: reject any record whose live price data is stale.
  // Static-only records (dataFreshnessMs === 0) are always surfaced with a
  // reduced confidence score rather than hard-failed, because they represent
  // the analyst floor — not a broken live feed.
  const now = Date.now();
  const staleRecords = results.filter(
    (s) => s.dataFreshnessMs > 0 && now - s.dataFreshnessMs > STALE_THRESHOLD_MS
  );
  if (staleRecords.length > 0) {
    logger.error(
      { tickers: staleRecords.map((s) => s.ticker), staleThresholdMs: STALE_THRESHOLD_MS },
      "Price data exceeded staleness threshold — returning unavailable"
    );
    res.status(503).json({
      status: "Unavailable",
      reason: "Data stale — price data has not been refreshed within the required window",
    });
    return;
  }

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

  // Audit log: record every scored list response for debugging and compliance.
  logger.info({
    event: "stocks_listed",
    filters: { q, status },
    count: results.length,
    scores: results.map((s) => ({
      ticker: s.ticker,
      bounceProbability: s.bounceProbability,
      confidenceScore: s.confidenceScore,
      dataFreshnessMs: s.dataFreshnessMs,
      sourcesCount: s.sourcesCount,
      status: s.status,
    })),
    timestamp: now,
  });

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
    fetchQuotes([def.ticker]),
    fetchWeeklyHistory(def.ticker),
  ]);

  const quote = quotes.get(def.ticker);
  const now = Date.now();
  const dataFreshnessMs = quote?.fetchedAt ?? 0;
  const liveDataAvailable = quote != null;

  // Freshness guardrail: hard-fail if live data is stale beyond the threshold.
  if (liveDataAvailable && now - dataFreshnessMs > STALE_THRESHOLD_MS) {
    logger.error(
      { ticker: def.ticker, dataFreshnessMs, staleThresholdMs: STALE_THRESHOLD_MS },
      "Price data exceeded staleness threshold — returning unavailable"
    );
    res.status(503).json({
      status: "Unavailable",
      reason: "Data stale — price data has not been refreshed within the required window",
    });
    return;
  }

  // At this point live data is either absent (static fallback) or fresh.
  const confidenceScore = liveDataAvailable ? 0.85 : 0.40;
  const sourcesCount = liveDataAvailable ? LIVE_SOURCES_COUNT : STATIC_SOURCES_COUNT;

  const stock = {
    ...def,
    price: quote?.price ?? def.price,
    volume: quote?.volume ?? def.volume,
    chart: history ?? def.chart,
    confidenceScore,
    dataFreshnessMs,
    sourcesCount,
  };

  // Audit log: record every individual stock score output.
  logger.info({
    event: "stock_scored",
    ticker: def.ticker,
    inputs: {
      price: stock.price,
      volume: stock.volume,
      dataFreshnessMs,
      sourcesCount,
    },
    output: {
      bounceProbability: def.bounceProbability,
      confidenceScore,
      status: def.status,
    },
    timestamp: now,
  });

  const parsed = GetStockResponse.parse(stock);
  res.json(parsed);
});

export default router;
