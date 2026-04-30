import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const FETCH_TIMEOUT_MS = 5_000;

interface ServiceCheck {
  name: string;
  configured: boolean;
  reachable: boolean | null;
  error?: string;
}


/**
 * GET /api/diagnostics
 *
 * Tests connectivity to all external market-data services and reports whether
 * the required API keys are set.  Useful for verifying a new deployment is
 * wired up correctly before serving real traffic.
 *
 * Response shape:
 *   {
 *     port: number,
 *     services: {
 *       polygon:      { configured, reachable, error? },
 *       alphaVantage: { configured, reachable, error? },
 *       yahooFinance: { configured, reachable, error? }
 *     },
 *     allOk: boolean
 *   }
 *
 * `allOk` is true only when every configured service is also reachable.
 * Unconfigured optional services do not affect `allOk`.
 */
router.get("/diagnostics", async (_req, res) => {
  const port = Number(process.env["PORT"] ?? 8080);

  const checks = await Promise.all([
    checkPolygon(),
    checkAlphaVantage(),
    checkYahooFinance(),
  ]);

  const [polygon, alphaVantage, yahooFinance] = checks;

  // allOk: every service that is configured must be reachable;
  //        Yahoo Finance has no key but must always be reachable.
  const allOk = checks.every((c) => {
    if (c.name === "Yahoo Finance") return c.reachable === true;
    return !c.configured || c.reachable === true;
  });

  const status = allOk ? 200 : 503;
  res.status(status).json({
    port,
    services: { polygon, alphaVantage, yahooFinance },
    allOk,
  });
});

// ---------------------------------------------------------------------------
// Individual service probes
// ---------------------------------------------------------------------------

async function checkPolygon(): Promise<ServiceCheck> {
  const apiKey = process.env.POLYGON_API_KEY;
  const check: ServiceCheck = { name: "Polygon", configured: !!apiKey, reachable: null };

  if (!apiKey) return check;

  try {
    const params = new URLSearchParams({ adjusted: "true", apiKey });
    const url = `https://api.polygon.io/v2/aggs/ticker/TELA/prev?${params}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (res.status === 403 || res.status === 401) {
      check.reachable = false;
      check.error = `Polygon returned HTTP ${res.status} — check your API key`;
    } else if (!res.ok && res.status !== 404) {
      // 404 is fine: key is valid but the ticker just has no recent data
      check.reachable = false;
      check.error = `Polygon returned HTTP ${res.status} ${res.statusText}`;
    } else {
      check.reachable = true;
    }
  } catch (err) {
    check.reachable = false;
    check.error = err instanceof Error ? err.message : String(err);
    logger.warn({ err }, "diagnostics: Polygon probe failed");
  }

  return check;
}

async function checkAlphaVantage(): Promise<ServiceCheck> {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  const check: ServiceCheck = { name: "Alpha Vantage", configured: !!apiKey, reachable: null };

  if (!apiKey) return check;

  try {
    const params = new URLSearchParams({ function: "GLOBAL_QUOTE", symbol: "TELA", apikey: apiKey });
    const url = `https://www.alphavantage.co/query?${params}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      check.reachable = false;
      check.error = `Alpha Vantage returned HTTP ${res.status} ${res.statusText}`;
      return check;
    }

    const json = (await res.json()) as {
      "Global Quote"?: Record<string, string>;
      Note?: string;
      Information?: string;
      "Error Message"?: string;
    };

    if (json["Error Message"]) {
      check.reachable = false;
      check.error = `Alpha Vantage error: ${json["Error Message"]}`;
    } else if (json.Note) {
      // Rate-limit note — key is valid but we're throttled; count as reachable
      check.reachable = true;
      check.error = `Rate-limited: ${json.Note}`;
    } else {
      check.reachable = true;
    }
  } catch (err) {
    check.reachable = false;
    check.error = err instanceof Error ? err.message : String(err);
    logger.warn({ err }, "diagnostics: Alpha Vantage probe failed");
  }

  return check;
}

async function checkYahooFinance(): Promise<ServiceCheck> {
  const check: ServiceCheck = { name: "Yahoo Finance", configured: true, reachable: null };

  try {
    const url =
      "https://query1.finance.yahoo.com/v7/finance/quote?symbols=TELA";
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      check.reachable = false;
      check.error = `Yahoo Finance returned HTTP ${res.status} ${res.statusText}`;
    } else {
      check.reachable = true;
    }
  } catch (err) {
    check.reachable = false;
    check.error = err instanceof Error ? err.message : String(err);
    logger.warn({ err }, "diagnostics: Yahoo Finance probe failed");
  }

  return check;
}

export default router;
