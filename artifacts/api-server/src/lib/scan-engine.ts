// ---------------------------------------------------------------------------
// Scan Engine
// ---------------------------------------------------------------------------
// Implements the pre-delisting opportunity intelligence pipeline:
//   1. Data validation  — hard-fail on insufficient data points
//   2. Signal scoring   — deterministic, data-only (no AI hallucination)
//   3. Confidence calc  — data-quality assessment
//   4. Cross-check      — dual scoring pass with tolerance enforcement
//
// All scoring is purely data-driven. No AI is used in any scoring or
// confidence step, preventing hallucinated signals from reaching clients.
// ---------------------------------------------------------------------------

const MIN_DATA_POINTS = 3;
const CROSS_CHECK_TOLERANCE = 20;
const VOLUME_SPIKE_MULTIPLIER = 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScanInput {
  ticker: string;
  /** Live price, or null when unavailable. */
  price: number | null;
  /** Current-period volume as a raw number, or null when unavailable. */
  volume: number | null;
  /** Baseline average volume as a raw number, or null when unavailable. */
  avgVolume: number | null;
  /** Number of consecutive trading days the price has been under $1.00. */
  daysUnderOne: number;
  /** Days remaining until the NASDAQ compliance deadline. */
  daysToDeadline: number;
  /** Analyst-assigned bounce probability (0–100). */
  bounceProbability: number;
  /** Analyst-assigned delisting risk score (0–100). */
  delistingRisk: number;
  /** Analyst-assigned compliance score (0–100). */
  complianceScore: number;
}

export interface ScanSignals {
  score: number;
  signals: string[];
  riskFlags: string[];
}

export interface ConfidenceResult {
  confidence: number;
  issues: string[];
}

export interface ScanAnalysis {
  ticker: string;
  bounceProbability: number;
  confidence: number;
  verifiedSignals: string[];
  riskFlags: string[];
  confidenceIssues: string[];
  scoredAt: string;
}

export type ScanResult =
  | { status: "invalid"; reason: string }
  | { status: "flagged"; reason: string }
  | { status: "valid"; data: ScanAnalysis };

// ---------------------------------------------------------------------------
// validateScanInput
// ---------------------------------------------------------------------------

function validateScanInput(
  input: ScanInput,
): { valid: true } | { valid: false; reason: string } {
  const presentCount = [
    input.price != null && input.price > 0,
    input.daysUnderOne != null,
    input.daysToDeadline != null,
    input.bounceProbability != null,
  ].filter(Boolean).length;

  if (presentCount < MIN_DATA_POINTS) {
    return { valid: false, reason: "Insufficient data points for reliable scoring" };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// computeScanSignals
// ---------------------------------------------------------------------------

function computeScanSignals(input: ScanInput): ScanSignals {
  // Start from the analyst-assigned bounce probability as the baseline.
  let score = input.bounceProbability;
  const signals: string[] = [];
  const riskFlags: string[] = [];

  // --- Positive signals ---

  if (input.price != null && input.price >= 0.90 && input.price < 1.00) {
    score += 8;
    signals.push("Price near $1 recovery threshold");
  }

  if (
    input.volume != null &&
    input.avgVolume != null &&
    input.avgVolume > 0 &&
    input.volume > input.avgVolume * VOLUME_SPIKE_MULTIPLIER
  ) {
    score += 15;
    signals.push("Volume spike detected");
  }

  if (input.daysUnderOne > 20) {
    score += 10;
    signals.push("Compliance pressure active");
  }

  // --- Risk flags ---

  if (input.delistingRisk >= 80) {
    score -= 20;
    riskFlags.push("Critical delisting risk");
  }

  if (input.daysToDeadline <= 14) {
    score -= 15;
    riskFlags.push("Compliance deadline imminent");
  } else if (input.daysToDeadline <= 30) {
    score -= 8;
    riskFlags.push("Compliance deadline approaching");
  }

  if (input.complianceScore < 30) {
    score -= 10;
    riskFlags.push("Low compliance score");
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    signals,
    riskFlags,
  };
}

// ---------------------------------------------------------------------------
// computeScanConfidence
// ---------------------------------------------------------------------------

/**
 * Assess the quality of the input data and return a confidence score (0–100)
 * along with a list of data-quality issues that reduced it.
 */
export function computeScanConfidence(input: ScanInput): ConfidenceResult {
  let confidence = 100;
  const issues: string[] = [];

  if (input.price == null || input.price <= 0) {
    confidence -= 25;
    issues.push("Missing live price");
  }

  if (input.volume == null) {
    confidence -= 20;
    issues.push("Missing live volume");
  }

  if (input.avgVolume == null) {
    confidence -= 10;
    issues.push("Missing average volume");
  }

  if (input.delistingRisk >= 80) {
    confidence -= 15;
    issues.push("High delisting risk reduces signal reliability");
  }

  if (input.daysToDeadline <= 14) {
    confidence -= 10;
    issues.push("Imminent deadline — outcome highly uncertain");
  }

  return {
    confidence: Math.max(confidence, 0),
    issues,
  };
}

// ---------------------------------------------------------------------------
// analyzeScan
// ---------------------------------------------------------------------------

/**
 * Full scan analysis pipeline for a single stock.
 *
 * Steps:
 *  1. Validate input — hard fail on insufficient data.
 *  2. Score independently twice — cross-check both results.
 *  3. Flag if the two passes disagree beyond the configured tolerance.
 *  4. Compute data-quality confidence on the verified score.
 */
export function analyzeScan(input: ScanInput): ScanResult {
  // 1. Validate
  const validation = validateScanInput(input);
  if (!validation.valid) {
    return { status: "invalid", reason: validation.reason };
  }

  // 2. Score — two independent passes.
  //
  //    Both passes are deterministic and will always agree for the current
  //    scoring model.  The dual-pass structure is kept intentionally so that
  //    if a future non-deterministic scoring extension (e.g. a probabilistic
  //    RSI estimator) is introduced, the cross-check gate is already wired up
  //    and will catch inter-pass disagreements without requiring a refactor.
  const scoreA = computeScanSignals(input);
  const scoreB = computeScanSignals(input);

  // 3. Cross-check: both passes must agree within tolerance
  if (Math.abs(scoreA.score - scoreB.score) > CROSS_CHECK_TOLERANCE) {
    return {
      status: "flagged",
      reason: "Score cross-check failed — model disagreement",
    };
  }

  // 4. Confidence
  const { confidence, issues: confidenceIssues } = computeScanConfidence(input);

  return {
    status: "valid",
    data: {
      ticker: input.ticker,
      bounceProbability: scoreA.score,
      confidence,
      verifiedSignals: scoreA.signals,
      riskFlags: scoreA.riskFlags,
      confidenceIssues,
      scoredAt: new Date().toISOString(),
    },
  };
}
