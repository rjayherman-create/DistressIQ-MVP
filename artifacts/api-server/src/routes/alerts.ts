import { Router, type IRouter } from "express";
import { ListAlertsResponse } from "@workspace/api-zod";
import { db, watchlistsTable, alertsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { fetchQuotes, fetchWeeklyHistory } from "../lib/yahoo-finance";

const router: IRouter = Router();

// Static baseline definitions — analyst-assigned average volumes and entry zones.
// These mirror the definitions in stocks.ts and serve as the reference for alert thresholds.
const stockBaselines: Record<
  string,
  { avgVolume: number; entryZoneLow: number; entryZoneHigh: number; delistingRisk: number }
> = {
  TELA: { avgVolume: 133_600,     entryZoneLow: 0.78, entryZoneHigh: 0.82, delistingRisk: 34 },
  GAME: { avgVolume: 589_000,     entryZoneLow: 0.26, entryZoneHigh: 0.28, delistingRisk: 77 },
  FFIE: { avgVolume: 235_100_000, entryZoneLow: 0.31, entryZoneHigh: 0.34, delistingRisk: 62 },
  ALXO: { avgVolume: 1_800_000,   entryZoneLow: 0.92, entryZoneHigh: 0.95, delistingRisk: 28 },
};

const TICKERS = Object.keys(stockBaselines);

type AlertSeverity = "info" | "warning" | "critical";

interface GeneratedAlert {
  id: string;
  ticker: string;
  message: string;
  severity: AlertSeverity;
  createdAt: string;
}

/**
 * Fetch live market data for all tracked tickers and generate alerts based on:
 *  - Price movement >5% from previous week's close → "info"
 *  - Volume >2x average → "warning"
 *  - Delisting risk >70 → "critical"
 *  - Price within entry zone → "info"
 */
async function generateMarketAlerts(): Promise<GeneratedAlert[]> {
  const [quotes, ...histories] = await Promise.all([
    fetchQuotes(TICKERS),
    ...TICKERS.map((t) => fetchWeeklyHistory(t)),
  ]);

  const now = new Date().toISOString();
  const alerts: GeneratedAlert[] = [];
  let idCounter = 1;

  TICKERS.forEach((ticker, i) => {
    const baseline = stockBaselines[ticker];
    const quote = quotes.get(ticker);
    const history = histories[i];

    const livePrice = quote?.price ?? null;
    const liveRawVolume = quote?.rawVolume ?? null;

    // Previous week's close is the second-to-last chart point
    const prevWeekClose =
      history && history.length >= 2 ? history[history.length - 2].p : null;

    // 1. Price movement >5% from previous week's close
    if (livePrice !== null && prevWeekClose !== null && prevWeekClose > 0) {
      const pctChange = Math.abs((livePrice - prevWeekClose) / prevWeekClose);
      if (pctChange > 0.05) {
        const direction = livePrice > prevWeekClose ? "up" : "down";
        const pctDisplay = (pctChange * 100).toFixed(1);
        alerts.push({
          id: String(idCounter++),
          ticker,
          message: `${ticker} moved ${pctDisplay}% ${direction} from last week's close of ${prevWeekClose.toFixed(2)}`,
          severity: "info",
          createdAt: now,
        });
      }
    }

    // 2. Volume spike >2x average
    if (liveRawVolume !== null && baseline.avgVolume > 0) {
      const ratio = liveRawVolume / baseline.avgVolume;
      if (ratio > 2) {
        const ratioDisplay = ratio.toFixed(1);
        alerts.push({
          id: String(idCounter++),
          ticker,
          message: `${ticker} volume is ${ratioDisplay}x above average — unusual activity detected`,
          severity: "warning",
          createdAt: now,
        });
      }
    }

    // 3. Delisting risk >70
    if (baseline.delistingRisk > 70) {
      alerts.push({
        id: String(idCounter++),
        ticker,
        message: `${ticker} carries a ${baseline.delistingRisk}% delisting risk — compliance window is critical`,
        severity: "critical",
        createdAt: now,
      });
    }

    // 4. Price within entry zone
    if (
      livePrice !== null &&
      livePrice >= baseline.entryZoneLow &&
      livePrice <= baseline.entryZoneHigh
    ) {
      alerts.push({
        id: String(idCounter++),
        ticker,
        message: `${ticker} is trading at ${livePrice.toFixed(2)}, inside the ${baseline.entryZoneLow.toFixed(2)}–${baseline.entryZoneHigh.toFixed(2)} entry zone`,
        severity: "info",
        createdAt: now,
      });
    }
  });

  return alerts;
}

router.get("/alerts", async (req, res) => {
  // Generate fresh market-driven alerts
  const allAlerts = await generateMarketAlerts();

  // If the user is authenticated, also persist generated alerts to the DB
  // and scope the response to stocks in their watchlist (if they have one).
  if (req.isAuthenticated()) {
    const userId = req.user.id;

    // Fetch the user's watchlist tickers
    const watchlistRows = await db
      .select()
      .from(watchlistsTable)
      .where(eq(watchlistsTable.userId, userId));
    const watchlistTickers = new Set(watchlistRows.map((r) => r.ticker));

    // Persist newly generated alerts for watchlisted stocks
    if (watchlistTickers.size > 0) {
      const toInsert = allAlerts.filter((a) => watchlistTickers.has(a.ticker));
      if (toInsert.length > 0) {
        // Clear stale alerts for this user before inserting fresh ones
        await db.delete(alertsTable).where(eq(alertsTable.userId, userId));
        await db.insert(alertsTable).values(
          toInsert.map((a) => ({
            userId,
            ticker: a.ticker,
            message: a.message,
            severity: a.severity,
          })),
        );
      }

      // Return only alerts for watchlisted stocks
      const filtered = allAlerts.filter((a) => watchlistTickers.has(a.ticker));
      const parsed = ListAlertsResponse.parse(filtered);
      res.json(parsed);
      return;
    }
  }

  // Unauthenticated users (or authenticated users with an empty watchlist)
  // receive all generated alerts across all tracked stocks.
  const parsed = ListAlertsResponse.parse(allAlerts);
  res.json(parsed);
});

export default router;
