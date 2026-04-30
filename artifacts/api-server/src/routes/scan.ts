import { Router, type IRouter } from "express";
import { analyzeScan, type ScanInput, type ScanAnalysis } from "../lib/scan-engine";
import { fetchQuotes } from "../lib/yahoo-finance";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/** Minimum drop in bounceProbability between scans that raises a tracking alert. */
const BOUNCE_PROBABILITY_ALERT_THRESHOLD = 10;

// ---------------------------------------------------------------------------
// Scan definitions
// ---------------------------------------------------------------------------
// Compact subset of stock data used by the scan engine.
// Kept in sync with the full definitions in routes/stocks.ts.
// Fields: ticker, daysUnderOne, daysToDeadline, bounceProbability,
//         delistingRisk, complianceScore, volume (baseline avg as string).
// ---------------------------------------------------------------------------

interface ScanDefinition {
  ticker: string;
  daysUnderOne: number;
  daysToDeadline: number;
  bounceProbability: number;
  delistingRisk: number;
  complianceScore: number;
  /** Baseline average daily volume as a human-readable string (e.g. "133.6K"). */
  volume: string;
}

const scanDefinitions: ScanDefinition[] = [
  { ticker: "TELA",  daysUnderOne:  47, daysToDeadline: 174, bounceProbability: 68, delistingRisk: 34, complianceScore: 74, volume: "133.6K" },
  { ticker: "GAME",  daysUnderOne: 212, daysToDeadline: 167, bounceProbability: 39, delistingRisk: 77, complianceScore: 31, volume: "589K"   },
  { ticker: "FFIE",  daysUnderOne:  58, daysToDeadline: 176, bounceProbability: 54, delistingRisk: 62, complianceScore: 60, volume: "235.1M" },
  { ticker: "ALXO",  daysUnderOne:  29, daysToDeadline: 205, bounceProbability: 71, delistingRisk: 28, complianceScore: 82, volume: "1.8M"   },
  { ticker: "MULN",  daysUnderOne: 341, daysToDeadline:  14, bounceProbability: 22, delistingRisk: 94, complianceScore: 12, volume: "12.4M"  },
  { ticker: "NKLA",  daysUnderOne: 124, daysToDeadline:  56, bounceProbability: 34, delistingRisk: 81, complianceScore: 27, volume: "8.7M"   },
  { ticker: "GOEV",  daysUnderOne: 287, daysToDeadline:  22, bounceProbability: 19, delistingRisk: 92, complianceScore: 16, volume: "3.1M"   },
  { ticker: "IDEX",  daysUnderOne: 198, daysToDeadline:  44, bounceProbability: 31, delistingRisk: 86, complianceScore: 22, volume: "1.9M"   },
  { ticker: "MVST",  daysUnderOne:  89, daysToDeadline:  91, bounceProbability: 49, delistingRisk: 57, complianceScore: 54, volume: "2.3M"   },
  { ticker: "GLYC",  daysUnderOne:  76, daysToDeadline: 104, bounceProbability: 44, delistingRisk: 63, complianceScore: 48, volume: "287K"   },
  { ticker: "BFRI",  daysUnderOne: 112, daysToDeadline:  68, bounceProbability: 38, delistingRisk: 74, complianceScore: 34, volume: "412K"   },
  { ticker: "HYMC",  daysUnderOne:  94, daysToDeadline:  86, bounceProbability: 42, delistingRisk: 66, complianceScore: 45, volume: "543K"   },
  { ticker: "PRST",  daysUnderOne:  71, daysToDeadline: 109, bounceProbability: 47, delistingRisk: 59, complianceScore: 51, volume: "318K"   },
  { ticker: "WKSP",  daysUnderOne:  54, daysToDeadline: 126, bounceProbability: 53, delistingRisk: 51, complianceScore: 58, volume: "227K"   },
  { ticker: "GFAI",  daysUnderOne: 163, daysToDeadline:  37, bounceProbability: 28, delistingRisk: 88, complianceScore: 24, volume: "189K"   },
  { ticker: "ZAPP",  daysUnderOne:  68, daysToDeadline: 112, bounceProbability: 46, delistingRisk: 60, complianceScore: 52, volume: "143K"   },
  { ticker: "AEYE",  daysUnderOne:  38, daysToDeadline: 142, bounceProbability: 63, delistingRisk: 41, complianceScore: 66, volume: "96K"    },
  { ticker: "CTRM",  daysUnderOne: 178, daysToDeadline:  32, bounceProbability: 29, delistingRisk: 85, complianceScore: 26, volume: "2.1M"   },
  { ticker: "SOPA",  daysUnderOne: 146, daysToDeadline:  54, bounceProbability: 33, delistingRisk: 82, complianceScore: 28, volume: "312K"   },
  { ticker: "SGBX",  daysUnderOne:  62, daysToDeadline: 118, bounceProbability: 51, delistingRisk: 55, complianceScore: 56, volume: "178K"   },
  { ticker: "NXPL",  daysUnderOne:  73, daysToDeadline: 107, bounceProbability: 48, delistingRisk: 58, complianceScore: 53, volume: "214K"   },
  { ticker: "ABVC",  daysUnderOne: 152, daysToDeadline:  48, bounceProbability: 30, delistingRisk: 83, complianceScore: 25, volume: "267K"   },
  { ticker: "NRSN",  daysUnderOne:  44, daysToDeadline: 136, bounceProbability: 59, delistingRisk: 47, complianceScore: 63, volume: "148K"   },
  { ticker: "CETX",  daysUnderOne: 108, daysToDeadline:  72, bounceProbability: 36, delistingRisk: 72, complianceScore: 37, volume: "231K"   },
];

// ---------------------------------------------------------------------------
// Volume parsing helper
// ---------------------------------------------------------------------------

/**
 * Parse a human-readable volume string (e.g. "133.6K", "2.1M") into a raw
 * integer.  Returns null for strings that cannot be parsed.
 */
function parseVolumeString(v: string): number | null {
  const m = v.trim().match(/^([\d.]+)([KMBkmb]?)$/);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (!isFinite(num)) return null;
  switch (m[2].toUpperCase()) {
    case "K": return Math.round(num * 1_000);
    case "M": return Math.round(num * 1_000_000);
    case "B": return Math.round(num * 1_000_000_000);
    default:  return Math.round(num);
  }
}

// ---------------------------------------------------------------------------
// Tracking system (in-memory)
// ---------------------------------------------------------------------------

interface TrackedEntry {
  ticker: string;
  alerts: string[];
  lastData: ScanAnalysis | null;
  trackedSince: string;
}

const tracked = new Map<string, TrackedEntry>();

function trackStock(ticker: string): void {
  if (!tracked.has(ticker)) {
    tracked.set(ticker, {
      ticker,
      alerts: [],
      lastData: null,
      trackedSince: new Date().toISOString(),
    });
  }
}

/**
 * Compare a new scan result against the previous one and return any alert
 * messages that should be raised due to deterioration.
 */
function checkAlerts(
  newData: ScanAnalysis,
  oldData: ScanAnalysis | null,
): string[] {
  const alerts: string[] = [];
  if (!oldData) return alerts;

  // Bounce probability dropped significantly — deterioration signal
  if (newData.bounceProbability < oldData.bounceProbability - BOUNCE_PROBABILITY_ALERT_THRESHOLD) {
    alerts.push(
      `Bounce probability fell from ${oldData.bounceProbability} to ${newData.bounceProbability}`,
    );
  }

  // New critical risk flags that weren't present before
  const newFlags = newData.riskFlags.filter(
    (f) => !oldData.riskFlags.includes(f),
  );
  for (const flag of newFlags) {
    alerts.push(`New risk flag: ${flag}`);
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Background scanner (cron-ready)
// ---------------------------------------------------------------------------

/**
 * Run one scan cycle over all defined tickers.
 *
 * Called by the 60-second interval set up in index.ts and can also be
 * triggered manually.  Fetches live prices from Yahoo Finance (with its
 * internal 60-second cache), runs the full analysis pipeline for every
 * ticker, and appends any new alert messages to the in-memory tracking store.
 */
export async function runBackgroundScanner(): Promise<void> {
  const tickers = scanDefinitions.map((d) => d.ticker);

  let priceMap: Awaited<ReturnType<typeof fetchQuotes>> = new Map();
  try {
    priceMap = await fetchQuotes(tickers);
  } catch (err) {
    logger.warn({ err }, "scanner: price fetch failed — using static baseline data");
  }

  for (const def of scanDefinitions) {
    const quote = priceMap.get(def.ticker);
    const input: ScanInput = {
      ticker: def.ticker,
      price: quote?.price ?? null,
      volume: quote?.volumeRaw ?? null,
      avgVolume: parseVolumeString(def.volume),
      daysUnderOne: def.daysUnderOne,
      daysToDeadline: def.daysToDeadline,
      bounceProbability: def.bounceProbability,
      delistingRisk: def.delistingRisk,
      complianceScore: def.complianceScore,
    };

    const result = analyzeScan(input);

    if (result.status === "valid") {
      const entry = tracked.get(def.ticker);
      if (entry) {
        const newAlerts = checkAlerts(result.data, entry.lastData);
        entry.alerts.push(...newAlerts);
        entry.lastData = result.data;
        if (newAlerts.length > 0) {
          logger.info(
            { ticker: def.ticker, alerts: newAlerts },
            "scanner: alerts triggered",
          );
        }
      }
    } else {
      logger.debug(
        { ticker: def.ticker, status: result.status },
        "scanner: scan result not valid — skipping tracking update",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/scan
 *
 * Run the full pre-delisting analysis pipeline for all defined tickers.
 * Live prices are fetched from Yahoo Finance (with its internal 60-second
 * cache).  Each ticker goes through data validation, dual-pass scoring,
 * cross-check, and confidence calculation before the result is returned.
 *
 * Returns an array of ScanResult objects (one per ticker).
 */
router.get("/scan", async (_req, res) => {
  const tickers = scanDefinitions.map((d) => d.ticker);

  let priceMap: Awaited<ReturnType<typeof fetchQuotes>> = new Map();
  try {
    priceMap = await fetchQuotes(tickers);
  } catch (err) {
    logger.warn({ err }, "scan: price fetch failed — proceeding with static data");
  }

  const results = scanDefinitions.map((def) => {
    const quote = priceMap.get(def.ticker);
    const input: ScanInput = {
      ticker: def.ticker,
      price: quote?.price ?? null,
      volume: quote?.volumeRaw ?? null,
      avgVolume: parseVolumeString(def.volume),
      daysUnderOne: def.daysUnderOne,
      daysToDeadline: def.daysToDeadline,
      bounceProbability: def.bounceProbability,
      delistingRisk: def.delistingRisk,
      complianceScore: def.complianceScore,
    };
    return analyzeScan(input);
  });

  res.json(results);
});

/**
 * POST /api/track
 *
 * Add a ticker to the in-memory tracking map so that the background scanner
 * will monitor it for deterioration events.
 *
 * Body: { "ticker": "ALXO" }
 */
router.post("/track", (req, res) => {
  const body = req.body as { ticker?: unknown };
  const ticker =
    typeof body.ticker === "string" ? body.ticker.trim().toUpperCase() : null;

  if (!ticker) {
    res.status(400).json({ error: "ticker is required" });
    return;
  }

  trackStock(ticker);
  res.json({ success: true, ticker });
});

/**
 * GET /api/tracked
 *
 * Return the current state of the in-memory tracking map, including all
 * accumulated alert messages and the last scan result for each ticker.
 */
router.get("/tracked", (_req, res) => {
  const result: Record<string, TrackedEntry> = {};
  for (const [key, entry] of tracked) {
    result[key] = entry;
  }
  res.json(result);
});

export default router;
