import { Router, type IRouter } from "express";
import { runDelistingScan } from "../lib/delisting-scan";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /delisting-risk
 *
 * Triggers (or returns a cached result of) the delisting risk scan and
 * returns all tickers whose composite score meets or exceeds the risk
 * threshold (70), sorted highest score first.
 *
 * Query params:
 *   force=true — bypass the 5-minute result cache and run a fresh scan.
 *
 * Response:
 *   {
 *     total_at_risk: number,
 *     timestamp: string,
 *     results: Array<{ ticker, score, flags }>
 *   }
 */
router.get("/delisting-risk", async (req, res) => {
  const force = req.query["force"] === "true";

  try {
    const data = await runDelistingScan(force);
    res.json({
      total_at_risk: data.total,
      timestamp: data.timestamp,
      results: data.results,
    });
  } catch (err) {
    logger.error({ err }, "delisting-risk: scan failed");
    res.status(500).json({ error: "Delisting risk scan failed" });
  }
});

export default router;
