// ---------------------------------------------------------------------------
// Score Engine
// ---------------------------------------------------------------------------
// Adjusts analyst-assigned scores (bounceProbability, delistingRisk,
// patternScore, complianceScore) using observable market data:
//   • live price vs the stock's entry zone
//   • days remaining until NASDAQ compliance deadline
//   • recent price momentum derived from the weekly chart
//
// All adjustments are bounded to [0, 100] and are kept intentionally small
// so they serve as a live refinement rather than overriding the analyst view.
// ---------------------------------------------------------------------------

type ChartPoint = { d: string; p: number };

/** Partial score fields that the engine can adjust. */
export interface ScoreAdjustments {
  bounceProbability: number;
  delistingRisk: number;
  patternScore: number;
  complianceScore: number;
}

/** A minimal stock definition that the engine needs. */
export interface ScoreEngineInput extends ScoreAdjustments {
  entryZone: string;
  daysToDeadline: number;
  chart: ChartPoint[];
}

// ---------------------------------------------------------------------------
// parseEntryZoneMid
// ---------------------------------------------------------------------------

/**
 * Parse an entry zone string like "$0.78–$0.82" and return the midpoint.
 * Returns null if the string cannot be parsed.
 */
export function parseEntryZoneMid(entryZone: string): number | null {
  // Handles both en-dash "–" and hyphen "-" separators.
  const match = entryZone.match(/\$?([\d.]+)\s*[–\-]\s*\$?([\d.]+)/);
  if (!match) return null;
  const lo = parseFloat(match[1]);
  const hi = parseFloat(match[2]);
  if (!isFinite(lo) || !isFinite(hi) || lo <= 0 || hi <= 0) return null;
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

// ---------------------------------------------------------------------------
// computeAdjustedScores
// ---------------------------------------------------------------------------

/**
 * Compute score adjustments for a stock given live market data.
 *
 * @param def         - Stock definition including analyst-assigned base scores.
 * @param livePrice   - Current market price, or null if unavailable.
 * @param liveChart   - Weekly price history (most recent last), or null to
 *                      fall back to def.chart.
 * @returns           - Adjusted versions of the four scores.
 */
export function computeAdjustedScores(
  def: ScoreEngineInput,
  livePrice: number | null,
  liveChart: ChartPoint[] | null,
): ScoreAdjustments {
  let { bounceProbability, delistingRisk, patternScore, complianceScore } = def;

  // -------------------------------------------------------------------------
  // 1. Price vs entry zone
  // -------------------------------------------------------------------------
  const entryMid = parseEntryZoneMid(def.entryZone);
  if (entryMid != null && livePrice != null && livePrice > 0) {
    const ratio = livePrice / entryMid;

    if (ratio < 0.90) {
      // Price is well below entry — stronger bounce setup but potentially
      // more downside risk too; boost bounce, slight delisting nudge.
      bounceProbability += 6;
      patternScore += 4;
      delistingRisk += 2;
    } else if (ratio < 0.97) {
      // Price is just below entry — ideal entry zone.
      bounceProbability += 3;
      patternScore += 2;
    } else if (ratio >= 1.20) {
      // Price has run well above entry — opportunity may have passed.
      bounceProbability -= 10;
      patternScore -= 6;
    } else if (ratio >= 1.08) {
      // Price is moderately above entry.
      bounceProbability -= 5;
      patternScore -= 3;
    }
  }

  // -------------------------------------------------------------------------
  // 2. Days-to-deadline urgency
  // -------------------------------------------------------------------------
  const { daysToDeadline } = def;

  if (daysToDeadline <= 14) {
    // Critical — compliance deadline imminent.
    delistingRisk += 18;
    complianceScore -= 18;
    bounceProbability -= 8;
  } else if (daysToDeadline <= 30) {
    delistingRisk += 10;
    complianceScore -= 10;
    bounceProbability -= 4;
  } else if (daysToDeadline <= 60) {
    delistingRisk += 5;
    complianceScore -= 5;
  } else if (daysToDeadline >= 180) {
    // Far from deadline — pressure eases slightly.
    delistingRisk -= 4;
    complianceScore += 4;
  }

  // -------------------------------------------------------------------------
  // 3. Recent price momentum (last 3 weekly candles)
  // -------------------------------------------------------------------------
  const chart = liveChart ?? def.chart;
  if (chart.length >= 3) {
    const tail = chart.slice(-3).map((pt) => pt.p);
    const [oldestPrice, middlePrice, latestPrice] = tail;
    const isRising = latestPrice > middlePrice && middlePrice > oldestPrice;
    const isFalling = latestPrice < middlePrice && middlePrice < oldestPrice;

    // Price recovering for 2+ consecutive weeks: positive signal.
    if (isRising) {
      bounceProbability += 4;
      patternScore += 4;
      delistingRisk -= 3;
    }

    // Price falling for 2+ consecutive weeks: negative signal.
    if (isFalling) {      bounceProbability -= 4;
      patternScore -= 4;
      delistingRisk += 3;
    }
  }

  return {
    bounceProbability: clamp(bounceProbability),
    delistingRisk: clamp(delistingRisk),
    patternScore: clamp(patternScore),
    complianceScore: clamp(complianceScore),
  };
}
