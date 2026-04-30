// ---------------------------------------------------------------------------
// Delisting Risk Scanner Engine
// ---------------------------------------------------------------------------
// Scans a universe of tickers for delisting risk signals and produces a
// composite score for each.  Scores of 70 or above are considered "at risk".
//
// Signal sources:
//   1. SEC EDGAR — delayed/missing filings (+25)
//   2. Polygon.io — >70% price collapse over the trailing ~2-year window (+15)
//   3. Polygon.io batch snapshot — low daily volume (<100 000 shares) (+10)
//   4. OTC tier check — tickers on known warning tiers (+30)
//   5. Reverse-split pattern — placeholder; add real logic when data is
//      available (+10)
//
// The engine is designed to be called on-demand (via the API route) and on a
// daily schedule (via the cron registered in index.ts).
// ---------------------------------------------------------------------------

import { fetchPolygonBatch } from "./market-data";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RISK_THRESHOLD = 70;

/** How long (ms) to cache the last completed scan before allowing a new one. */
const SCAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// SEC EDGAR requires a descriptive User-Agent string that includes an email
// address so they can contact you if needed.  Set SEC_USER_AGENT in your
// environment to override the default (e.g. "MyApp admin@mycompany.com").
const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT ?? "DistressIQ contact@distressiq.io";
const FETCH_TIMEOUT_MS = 8_000;

// ---------------------------------------------------------------------------
// Ticker universe — mirrors the stock definitions in routes/stocks.ts
// ---------------------------------------------------------------------------

export const SCAN_UNIVERSE: string[] = [
  "TELA", "GAME", "FFIE", "ALXO", "MULN", "NKLA",
  "GOEV", "IDEX", "MVST", "GLYC", "BFRI", "HYMC",
  "PRST", "WKSP", "GFAI", "ZAPP", "AEYE", "CTRM",
  "SOPA", "SGBX", "NXPL", "ABVC", "NRSN", "CETX",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TickerScanResult {
  ticker: string;
  score: number;
  flags: string[];
}

export interface ScanSummary {
  total: number;
  timestamp: string;
  results: TickerScanResult[];
}

// ---------------------------------------------------------------------------
// In-memory result cache
// ---------------------------------------------------------------------------

interface ScanCache {
  summary: ScanSummary;
  cachedAt: number;
}

let scanCache: ScanCache | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the delisting risk scan over the full universe.
 *
 * Returns cached results if the last scan completed within SCAN_CACHE_TTL_MS.
 * Pass `force = true` to bypass the cache and run immediately.
 */
export async function runDelistingScan(force = false): Promise<ScanSummary> {
  const now = Date.now();

  if (!force && scanCache && now - scanCache.cachedAt < SCAN_CACHE_TTL_MS) {
    logger.debug("delisting-scan: returning cached results");
    return scanCache.summary;
  }

  logger.info("delisting-scan: starting scan");

  const tickers = SCAN_UNIVERSE;
  const atRisk: TickerScanResult[] = [];

  // Pre-fetch Polygon batch prices/volumes for all tickers in one request.
  let polygonBatch: Map<string, { price: number; volume?: number }> = new Map();
  if (process.env.POLYGON_API_KEY) {
    try {
      polygonBatch = await fetchPolygonBatch(tickers);
    } catch (err) {
      logger.warn({ err }, "delisting-scan: Polygon batch fetch failed — continuing without batch data");
    }
  }

  for (const ticker of tickers) {
    try {
      const result = await scoreTicker(ticker, polygonBatch);
      if (result.score >= RISK_THRESHOLD) {
        atRisk.push(result);
      }
    } catch (err) {
      logger.warn({ ticker, err }, "delisting-scan: error scoring ticker");
    }
  }

  // Sort highest score first.
  atRisk.sort((a, b) => b.score - a.score);

  const summary: ScanSummary = {
    total: atRisk.length,
    timestamp: new Date().toISOString(),
    results: atRisk,
  };

  logger.info(
    { total: summary.total },
    "delisting-scan: scan complete",
  );

  await saveScanResults(summary);

  scanCache = { summary, cachedAt: Date.now() };
  return summary;
}

// ---------------------------------------------------------------------------
// Score engine
// ---------------------------------------------------------------------------

async function scoreTicker(
  ticker: string,
  polygonBatch: Map<string, { price: number; volume?: number }>,
): Promise<TickerScanResult> {
  let score = 0;
  const flags: string[] = [];

  // 1. SEC Filing Check
  if (await checkFilingStatus(ticker)) {
    score += 25;
    flags.push("Missing/Delayed Filings");
  }

  // 2. Price Collapse (uses Polygon batch data if available, else API)
  if (await checkPriceDrop(ticker)) {
    score += 15;
    flags.push("Price Collapse");
  }

  // 3. Low Volume (from Polygon batch snapshot)
  if (checkLowVolume(ticker, polygonBatch)) {
    score += 10;
    flags.push("Low Volume");
  }

  // 4. OTC Risk Tier
  if (checkOTCRisk(ticker)) {
    score += 30;
    flags.push("OTC Warning Tier");
  }

  // 5. Reverse Split Pattern
  if (await checkReverseSplit(ticker)) {
    score += 10;
    flags.push("Reverse Split Pattern");
  }

  return { ticker, score, flags };
}

// ---------------------------------------------------------------------------
// EDGAR ticker → CIK cache
// ---------------------------------------------------------------------------
// The EDGAR submissions endpoint requires zero-padded 10-digit CIK numbers,
// not ticker symbols.  SEC publishes a public JSON mapping at:
//   https://www.sec.gov/files/company_tickers.json
// We fetch it once per process lifetime and cache the result.

/** CIK formatted as a zero-padded 10-digit string, e.g. "0000320193". */
type Cik = string;

let tickerToCikCache: Map<string, Cik> | null = null;
/** Promise guard so we only fetch the mapping once concurrently. */
let tickerToCikPromise: Promise<Map<string, Cik>> | null = null;

async function getTickerToCikMap(): Promise<Map<string, Cik>> {
  if (tickerToCikCache) return tickerToCikCache;
  if (tickerToCikPromise) return tickerToCikPromise;

  tickerToCikPromise = (async () => {
    const url = "https://www.sec.gov/files/company_tickers.json";
    const res = await fetch(url, {
      headers: { "User-Agent": SEC_USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`EDGAR company_tickers HTTP ${res.status}`);
    }

    const json = (await res.json()) as Record<
      string,
      { cik_str: number; ticker: string; title: string }
    >;

    const map = new Map<string, Cik>();
    for (const entry of Object.values(json)) {
      const sym = entry.ticker.toUpperCase();
      const cik = String(entry.cik_str).padStart(10, "0");
      map.set(sym, cik);
    }

    tickerToCikCache = map;
    logger.debug({ count: map.size }, "delisting-scan: EDGAR CIK map loaded");
    return map;
  })();

  return tickerToCikPromise;
}

// ---------------------------------------------------------------------------
// Signal functions
// ---------------------------------------------------------------------------

/**
 * Check for missing or significantly delayed SEC filings via EDGAR.
 * Returns true if the most recent filing is older than 120 days, which is
 * a proxy for late-filing risk.
 */
async function checkFilingStatus(ticker: string): Promise<boolean> {
  try {
    // Resolve ticker → CIK using the SEC public mapping.
    const cikMap = await getTickerToCikMap();
    const cik = cikMap.get(ticker.toUpperCase());
    if (!cik) return false; // unknown ticker — can't assess

    const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
    const res = await fetch(url, {
      headers: { "User-Agent": SEC_USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as {
      filings?: { recent?: { filingDate?: string[] } };
    };

    const recent = data.filings?.recent;
    if (!recent || !recent.filingDate || recent.filingDate.length === 0) {
      return true; // no filings found — treat as delayed
    }

    const lastDate = new Date(recent.filingDate[0]);
    if (isNaN(lastDate.getTime())) return false;

    const diffDays = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 120;
  } catch {
    return false;
  }
}

/**
 * Check for a >70% price collapse over the trailing ~2-year window using
 * the Polygon daily aggregates endpoint.
 */
async function checkPriceDrop(ticker: string): Promise<boolean> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return false;

  try {
    const url =
      `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day` +
      `/2024-01-01/2026-01-01?adjusted=true&apiKey=${apiKey}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as {
      results?: Array<{ c?: number }>;
    };

    if (!data.results || data.results.length < 10) return false;

    const first = data.results[0].c;
    const last = data.results[data.results.length - 1].c;

    if (!first || !last || first <= 0) return false;

    return (first - last) / first > 0.7; // >70% drop
  } catch {
    return false;
  }
}

/**
 * Check for low daily volume (<100 000 shares) using the pre-fetched Polygon
 * batch snapshot.  Falls back to false when the ticker isn't present.
 */
function checkLowVolume(
  ticker: string,
  polygonBatch: Map<string, { price: number; volume?: number }>,
): boolean {
  const entry = polygonBatch.get(ticker.toUpperCase());
  if (!entry || entry.volume == null) return false;
  return entry.volume < 100_000;
}

/**
 * OTC tier check — returns true for tickers known to be on OTC warning tiers.
 * Replace with a live OTC Markets API call or a regularly refreshed dataset.
 */
function checkOTCRisk(ticker: string): boolean {
  const otcWarningTickers = new Set(["BBBYQ", "MULN", "GOEV", "IDEX", "SOPA", "GFAI"]);
  return otcWarningTickers.has(ticker.toUpperCase());
}

/**
 * Reverse-split pattern check — placeholder.
 * Add real logic (e.g. Polygon corporate actions API) when available.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkReverseSplit(_ticker: string): Promise<boolean> {
  return false;
}

// ---------------------------------------------------------------------------
// Persist results (stub — plug your DB here)
// ---------------------------------------------------------------------------

async function saveScanResults(summary: ScanSummary): Promise<void> {
  // Example with Drizzle:
  //   await db.insert(delistingScanTable).values({
  //     total: summary.total,
  //     timestamp: new Date(summary.timestamp),
  //     results: JSON.stringify(summary.results),
  //   });
  logger.debug({ total: summary.total }, "delisting-scan: results ready for persistence");
}
