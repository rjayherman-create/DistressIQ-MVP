import { Router, type IRouter } from "express";
import { ListAlertsResponse } from "@workspace/api-zod";
import { db, alertsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { fetchQuotes } from "../lib/yahoo-finance";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Alert thresholds
// ---------------------------------------------------------------------------

/** Price within this fraction of $1 triggers a compliance warning. */
const COMPLIANCE_WARNING_THRESHOLD = 0.05; // within 5% of $1

/** Price below this absolute level triggers a critical delisting risk alert. */
const CRITICAL_DELISTING_RISK_THRESHOLD = 0.30;

/** Volume ratio above this multiple triggers a volume spike alert. */
const VOLUME_SPIKE_MULTIPLIER = 2.0;

// ---------------------------------------------------------------------------
// Analyst-assigned stock definitions used for alert scoring
// ---------------------------------------------------------------------------

const alertDefs = [
  {
    ticker: "ALXO",
    company: "ALX Oncology",
    avgVolume: 900_000,   // approximate 30-day average volume
    complianceScore: 82,
  },
  {
    ticker: "FFIE",
    company: "Faraday Future Intelligent Electric",
    avgVolume: 100_000_000,
    complianceScore: 60,
  },
  {
    ticker: "GAME",
    company: "GameSquare",
    avgVolume: 400_000,
    complianceScore: 31,
  },
  {
    ticker: "TELA",
    company: "TELA Bio",
    avgVolume: 100_000,
    complianceScore: 74,
  },
];

// ---------------------------------------------------------------------------
// Dynamic alert generation
// ---------------------------------------------------------------------------

type AlertSeverity = "info" | "warning" | "critical";

interface GeneratedAlert {
  id: string;
  ticker: string;
  message: string;
  severity: AlertSeverity;
  createdAt: string;
}

async function generateAlerts(): Promise<GeneratedAlert[]> {
  const tickers = alertDefs.map((d) => d.ticker);
  const quotes = await fetchQuotes(tickers);
  const now = new Date().toISOString();
  const alerts: GeneratedAlert[] = [];

  for (const def of alertDefs) {
    const quote = quotes.get(def.ticker);
    if (!quote) continue;

    const { price } = quote;

    // Critical: price far below $1 — high delisting risk
    if (price < CRITICAL_DELISTING_RISK_THRESHOLD) {
      alerts.push({
        id: `${def.ticker}-delisting`,
        ticker: def.ticker,
        message: `${def.ticker} is trading at $${price.toFixed(2)} — critical delisting risk territory`,
        severity: "critical",
        createdAt: now,
      });
      continue;
    }

    // Warning: price within 5% of $1 compliance line
    if (price >= CRITICAL_DELISTING_RISK_THRESHOLD && price < 1.0) {
      const distancePct = (1.0 - price) / 1.0;
      if (distancePct <= COMPLIANCE_WARNING_THRESHOLD) {
        alerts.push({
          id: `${def.ticker}-compliance`,
          ticker: def.ticker,
          message: `${def.ticker} moved within ${(distancePct * 100).toFixed(0)}% of the $1 recovery line`,
          severity: "warning",
          createdAt: now,
        });
      } else {
        alerts.push({
          id: `${def.ticker}-below-one`,
          ticker: def.ticker,
          message: `${def.ticker} remains below $1 compliance threshold at $${price.toFixed(2)}`,
          severity: "warning",
          createdAt: now,
        });
      }
      continue;
    }

    // Info: price recovered above $1
    if (price >= 1.0) {
      alerts.push({
        id: `${def.ticker}-recovered`,
        ticker: def.ticker,
        message: `${def.ticker} is trading above $1 at $${price.toFixed(2)} — compliance pressure easing`,
        severity: "info",
        createdAt: now,
      });
    }
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

router.get("/alerts", async (req, res) => {
  try {
    const generated = await generateAlerts();

    // If the user is authenticated, persist new alerts and return merged list
    if (req.isAuthenticated()) {
      const userId = req.user.id;

      // Persist each generated alert (insert, ignore duplicates by id)
      try {
        const inserts = generated.map((a) => ({
          id: a.id,
          userId,
          ticker: a.ticker,
          message: a.message,
          severity: a.severity as "info" | "warning" | "critical",
        }));

        await db
          .insert(alertsTable)
          .values(inserts)
          .onConflictDoNothing();
      } catch (dbErr) {
        logger.warn({ dbErr }, "Failed to persist alerts to DB — returning live alerts only");
      }

      // Return the user's persisted alerts (most recent first, capped at 50)
      try {
        const persisted = await db
          .select()
          .from(alertsTable)
          .where(eq(alertsTable.userId, userId))
          .orderBy(desc(alertsTable.createdAt))
          .limit(50);

        const merged = persisted.map((a) => ({
          id: a.id,
          ticker: a.ticker,
          message: a.message,
          severity: a.severity as AlertSeverity,
          createdAt: a.createdAt.toISOString(),
        }));

        const parsed = ListAlertsResponse.parse(merged);
        res.json(parsed);
        return;
      } catch (dbErr) {
        logger.warn({ dbErr }, "Failed to read persisted alerts — falling back to live alerts");
      }
    }

    // Unauthenticated or DB failure: return live-generated alerts
    const parsed = ListAlertsResponse.parse(generated);
    res.json(parsed);
  } catch (err) {
    logger.error({ err }, "Alert generation failed");
    res.status(500).json({ error: "Failed to generate alerts" });
  }
});

export default router;
