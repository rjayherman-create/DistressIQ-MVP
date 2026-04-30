import { Router, type IRouter } from "express";
import { ListAlertsResponse } from "@workspace/api-zod";
import { fetchQuotes } from "../lib/yahoo-finance";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Minimal definitions needed for alert generation.
// Analyst-assigned scores drive message content; live prices drive severity.
const alertDefs = [
  { ticker: "TELA", company: "TELA Bio", delistingRisk: 34, bounceProbability: 68, status: "Recovery Candidate" },
  { ticker: "GAME", company: "GameSquare", delistingRisk: 77, bounceProbability: 39, status: "High Delisting Risk" },
  { ticker: "FFIE", company: "Faraday Future Intelligent Electric", delistingRisk: 62, bounceProbability: 54, status: "Management Action Likely" },
  { ticker: "ALXO", company: "ALX Oncology", delistingRisk: 28, bounceProbability: 71, status: "Recovery Candidate" },
];

type AlertSeverity = "info" | "warning" | "critical";
const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

router.get("/alerts", async (_req, res) => {
  const tickers = alertDefs.map((d) => d.ticker);

  let quotes: Map<string, { price: number; volume: string; fetchedAt: number }>;
  try {
    quotes = await fetchQuotes(tickers);
  } catch (err) {
    logger.warn({ err }, "Failed to fetch quotes for alert generation — omitting price-based alerts");
    quotes = new Map();
  }

  const alerts: {
    id: string;
    ticker: string;
    message: string;
    severity: AlertSeverity;
    createdAt: string;
  }[] = [];

  const now = new Date().toISOString();
  let id = 1;

  for (const def of alertDefs) {
    const quote = quotes.get(def.ticker);
    const price = quote?.price;

    // Price-based alerts (only when a live quote is available)
    if (price != null) {
      const distanceTo1 = (1.0 - price) / 1.0;
      if (price >= 1.0) {
        alerts.push({
          id: String(id++),
          ticker: def.ticker,
          message: `${def.ticker} has recovered above $1.00 — NASDAQ compliance threshold cleared`,
          severity: "info",
          createdAt: now,
        });
      } else if (distanceTo1 <= 0.06) {
        // Within 6% below the $1 compliance line
        const pct = (distanceTo1 * 100).toFixed(1);
        alerts.push({
          id: String(id++),
          ticker: def.ticker,
          message: `${def.ticker} is ${pct}% below the $1.00 NASDAQ compliance threshold`,
          severity: "warning",
          createdAt: now,
        });
      }
    }

    // Score-based alerts
    if (def.delistingRisk >= 70) {
      alerts.push({
        id: String(id++),
        ticker: def.ticker,
        message: `${def.ticker} delisting risk is elevated at ${def.delistingRisk}/100 — late-stage compliance case`,
        severity: "critical",
        createdAt: now,
      });
    }

    if (def.bounceProbability >= 65) {
      alerts.push({
        id: String(id++),
        ticker: def.ticker,
        message: `${def.ticker} bounce probability is ${def.bounceProbability}% — high-quality setup identified`,
        severity: "info",
        createdAt: now,
      });
    }
  }

  // Sort: critical → warning → info
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const parsed = ListAlertsResponse.parse(alerts);
  res.json(parsed);
});

export default router;
