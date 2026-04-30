import { Router, type IRouter } from "express";
import { ListAlertsResponse } from "@workspace/api-zod";
import { fetchQuotes } from "../lib/yahoo-finance";
import { parseEntryZoneMid } from "../lib/score-engine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Alert threshold definitions
// ---------------------------------------------------------------------------
// Minimal per-stock data needed to evaluate price-triggered conditions.
// Updated in sync with stock definitions in routes/stocks.ts.
// ---------------------------------------------------------------------------

interface AlertThreshold {
  ticker: string;
  company: string;
  entryZone: string;
  daysToDeadline: number;
  status: string;
  /** Analyst-defined stop zone price (lower bound) as a number. */
  stopPrice: number;
}

const alertThresholds: AlertThreshold[] = [
  { ticker: "TELA",  company: "TELA Bio",                              entryZone: "$0.78–$0.82",  daysToDeadline: 174, status: "Recovery Candidate",        stopPrice: 0.72 },
  { ticker: "GAME",  company: "GameSquare",                            entryZone: "$0.26–$0.28",  daysToDeadline: 167, status: "High Delisting Risk",        stopPrice: 0.23 },
  { ticker: "FFIE",  company: "Faraday Future Intelligent Electric",   entryZone: "$0.31–$0.34",  daysToDeadline: 176, status: "Management Action Likely",   stopPrice: 0.28 },
  { ticker: "ALXO",  company: "ALX Oncology",                          entryZone: "$0.92–$0.95",  daysToDeadline: 205, status: "Recovery Candidate",        stopPrice: 0.88 },
  { ticker: "MULN",  company: "Mullen Automotive",                     entryZone: "$0.08–$0.09",  daysToDeadline: 14,  status: "High Delisting Risk",        stopPrice: 0.07 },
  { ticker: "NKLA",  company: "Nikola Corporation",                    entryZone: "$0.39–$0.43",  daysToDeadline: 56,  status: "High Delisting Risk",        stopPrice: 0.35 },
  { ticker: "GOEV",  company: "Canoo Inc",                             entryZone: "$0.18–$0.20",  daysToDeadline: 22,  status: "High Delisting Risk",        stopPrice: 0.15 },
  { ticker: "IDEX",  company: "Ideanomics Inc",                        entryZone: "$0.24–$0.27",  daysToDeadline: 44,  status: "High Delisting Risk",        stopPrice: 0.20 },
  { ticker: "MVST",  company: "Microvast Holdings",                    entryZone: "$0.48–$0.52",  daysToDeadline: 91,  status: "Management Action Likely",   stopPrice: 0.43 },
  { ticker: "GLYC",  company: "GlycoMimetics Inc",                     entryZone: "$0.42–$0.46",  daysToDeadline: 104, status: "Management Action Likely",   stopPrice: 0.38 },
  { ticker: "BFRI",  company: "Biofrontera Inc",                       entryZone: "$0.37–$0.40",  daysToDeadline: 68,  status: "High Delisting Risk",        stopPrice: 0.33 },
  { ticker: "HYMC",  company: "Hycroft Mining Holding",                entryZone: "$0.41–$0.45",  daysToDeadline: 86,  status: "Management Action Likely",   stopPrice: 0.37 },
  { ticker: "PRST",  company: "Presto Automation Inc",                 entryZone: "$0.49–$0.53",  daysToDeadline: 109, status: "Management Action Likely",   stopPrice: 0.44 },
  { ticker: "WKSP",  company: "Worksport Ltd",                         entryZone: "$0.58–$0.62",  daysToDeadline: 126, status: "Management Action Likely",   stopPrice: 0.52 },
  { ticker: "GFAI",  company: "Guardforce AI Co",                      entryZone: "$0.27–$0.30",  daysToDeadline: 37,  status: "High Delisting Risk",        stopPrice: 0.23 },
  { ticker: "ZAPP",  company: "Zapp Electric Vehicles",                entryZone: "$0.52–$0.56",  daysToDeadline: 112, status: "Management Action Likely",   stopPrice: 0.46 },
  { ticker: "AEYE",  company: "AudioEye Inc",                          entryZone: "$0.77–$0.80",  daysToDeadline: 142, status: "Recovery Candidate",        stopPrice: 0.71 },
  { ticker: "CTRM",  company: "Castor Maritime Inc",                   entryZone: "$0.30–$0.33",  daysToDeadline: 32,  status: "High Delisting Risk",        stopPrice: 0.26 },
  { ticker: "SOPA",  company: "Society Pass Inc",                      entryZone: "$0.33–$0.36",  daysToDeadline: 54,  status: "High Delisting Risk",        stopPrice: 0.28 },
  { ticker: "SGBX",  company: "SG Blocks Inc",                         entryZone: "$0.56–$0.60",  daysToDeadline: 118, status: "Management Action Likely",   stopPrice: 0.50 },
  { ticker: "NXPL",  company: "NextPlat Corp",                         entryZone: "$0.51–$0.55",  daysToDeadline: 107, status: "Management Action Likely",   stopPrice: 0.45 },
  { ticker: "ABVC",  company: "ABVC BioPharma Inc",                    entryZone: "$0.32–$0.35",  daysToDeadline: 48,  status: "High Delisting Risk",        stopPrice: 0.27 },
  { ticker: "NRSN",  company: "NeuroSense Therapeutics",               entryZone: "$0.67–$0.70",  daysToDeadline: 136, status: "Recovery Candidate",        stopPrice: 0.61 },
  { ticker: "CETX",  company: "Cemtrex Inc",                           entryZone: "$0.39–$0.43",  daysToDeadline: 72,  status: "High Delisting Risk",        stopPrice: 0.34 },
];

// ---------------------------------------------------------------------------
// Alert generation cache (60-second TTL to avoid hammering Yahoo Finance)
// ---------------------------------------------------------------------------

interface CachedAlerts {
  alerts: Array<{
    id: string;
    message: string;
    ticker: string;
    severity: "info" | "warning" | "critical";
    createdAt: string;
  }>;
  generatedAt: number;
}

let alertCache: CachedAlerts | null = null;
const ALERT_CACHE_TTL_MS = 60_000;

// ---------------------------------------------------------------------------
// generateAlerts
// ---------------------------------------------------------------------------

async function generateAlerts(): Promise<CachedAlerts["alerts"]> {
  const tickers = alertThresholds.map((t) => t.ticker);

  // Fetch live prices — uses the internal 60-second Yahoo Finance cache.
  let priceMap: Map<string, { price: number }> = new Map();
  try {
    priceMap = await fetchQuotes(tickers);
  } catch (err) {
    logger.warn({ err }, "alerts: price fetch failed — using threshold-only alerts");
  }

  const now = new Date().toISOString();
  const generated: CachedAlerts["alerts"] = [];
  let id = 1;

  for (const def of alertThresholds) {
    const entry = priceMap.get(def.ticker);
    const price = entry?.price ?? null;
    const entryMid = parseEntryZoneMid(def.entryZone);

    // -----------------------------------------------------------------------
    // Condition 1: Critical deadline — fewer than 30 days remaining
    // -----------------------------------------------------------------------
    if (def.daysToDeadline <= 30) {
      generated.push({
        id: String(id++),
        ticker: def.ticker,
        severity: def.daysToDeadline <= 14 ? "critical" : "warning",
        message: `${def.ticker} has only ${def.daysToDeadline} days left to meet NASDAQ compliance — delisting risk is elevated`,
        createdAt: now,
      });
    }

    if (price == null) continue;

    // -----------------------------------------------------------------------
    // Condition 2: Price near $1.00 recovery threshold (within 4%)
    // -----------------------------------------------------------------------
    if (price >= 0.96 && price < 1.00) {
      generated.push({
        id: String(id++),
        ticker: def.ticker,
        severity: "warning",
        message: `${def.ticker} is within 4% of the $1.00 compliance threshold at $${price.toFixed(2)} — watch for a sustained break above $1`,
        createdAt: now,
      });
    }

    // -----------------------------------------------------------------------
    // Condition 3: Price at or in entry zone — actionable setup
    // -----------------------------------------------------------------------
    if (entryMid != null) {
      const entryLow = entryMid * 0.97;
      const entryHigh = entryMid * 1.03;
      if (price >= entryLow && price <= entryHigh) {
        generated.push({
          id: String(id++),
          ticker: def.ticker,
          severity: "info",
          message: `${def.ticker} is trading at $${price.toFixed(2)}, within its entry zone — potential setup forming`,
          createdAt: now,
        });
      }
    }

    // -----------------------------------------------------------------------
    // Condition 4: Price breached stop zone — risk alert
    // -----------------------------------------------------------------------
    if (price < def.stopPrice) {
      generated.push({
        id: String(id++),
        ticker: def.ticker,
        severity: "critical",
        message: `${def.ticker} has fallen to $${price.toFixed(2)}, below the stop zone ($${def.stopPrice.toFixed(2)}) — exit or avoid`,
        createdAt: now,
      });
    }

    // -----------------------------------------------------------------------
    // Condition 5: Price bounced above $1.00 (compliance recovery)
    // -----------------------------------------------------------------------
    if (price >= 1.00 && def.status !== "Recovery Candidate") {
      generated.push({
        id: String(id++),
        ticker: def.ticker,
        severity: "info",
        message: `${def.ticker} has crossed back above $1.00 at $${price.toFixed(2)} — compliance pressure may be easing`,
        createdAt: now,
      });
    }
  }

  // Sort: critical → warning → info, then by ticker alphabetically.
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  generated.sort((a, b) => {
    const s = severityOrder[a.severity] - severityOrder[b.severity];
    return s !== 0 ? s : a.ticker.localeCompare(b.ticker);
  });

  // Reassign sequential IDs after sort.
  return generated.map((alert, i) => ({ ...alert, id: String(i + 1) }));
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

router.get("/alerts", async (_req, res) => {
  const now = Date.now();

  if (alertCache && now - alertCache.generatedAt < ALERT_CACHE_TTL_MS) {
    const parsed = ListAlertsResponse.parse(alertCache.alerts);
    res.json(parsed);
    return;
  }

  try {
    const alerts = await generateAlerts();
    alertCache = { alerts, generatedAt: now };
    const parsed = ListAlertsResponse.parse(alerts);
    res.json(parsed);
  } catch (err) {
    logger.error({ err }, "alerts: failed to generate dynamic alerts — returning empty list");
    res.json([]);
  }
});

export default router;

