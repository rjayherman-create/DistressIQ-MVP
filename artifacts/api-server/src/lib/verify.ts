// ==============================
// ANTI-HALLUCINATION ENGINE
// ==============================

const VERIFY_CONFIG = {
  requireSources: true,
  minConfidence: 0.75,
  allowAIOnly: false,
  maxAgeMinutes: 1440, // 24 hours freshness
};

// --- Types

export interface Source {
  type: string;
  name: string;
}

export interface VerifyInput {
  output: string;
  sources?: Source[];
  timestamp?: string;
  prompt?: string;
  runAI?: (prompt: string) => Promise<string>;
}

export interface VerifySuccess {
  success: true;
  data: {
    output: string;
    sources: Source[];
    verified: true;
    verifiedAt: string;
    confidence: number;
  };
}

export interface VerifyFailure {
  success: false;
  error: string;
  failures: string[];
  safeFallback: SafeFallback;
}

export interface SafeFallback {
  message: string;
  action: string;
}

export type VerifyResult = VerifySuccess | VerifyFailure;

interface AICheckResult {
  valid: boolean;
  confidence: number;
  issues: string[];
}

// --- Detect hallucination patterns
function detectRedFlags(text: string): RegExp[] {
  const redFlags = [
    /according to recent data/i,
    /studies show/i,
    /experts say/i,
    /based on statistics/i,
    /national average/i,
    /\d+% of/i,
  ];

  return redFlags.filter((pattern) => pattern.test(text));
}

// --- Source validation
function validateSources(sources: Source[]): { valid: true; sources: Source[] } | { valid: false; reason: string } {
  if (!sources || sources.length === 0) {
    return { valid: false, reason: "No sources provided" };
  }

  const trustedTypes = ["government", "court", "official", "user-doc"];

  const validSources = sources.filter((s) => trustedTypes.includes(s.type));

  if (validSources.length === 0) {
    return { valid: false, reason: "No trusted sources" };
  }

  return { valid: true, sources: validSources };
}

// --- Freshness validation
function validateFreshness(timestampISO?: string): boolean {
  if (!timestampISO) return false;

  const now = Date.now();
  const ts = new Date(timestampISO).getTime();
  if (isNaN(ts)) return false;
  const diff = (now - ts) / (1000 * 60);

  return diff <= VERIFY_CONFIG.maxAgeMinutes;
}

// --- AI self-check (second pass)
async function crossCheckAI(
  output: string,
  runAI: (prompt: string) => Promise<string>,
): Promise<AICheckResult> {
  const checkPrompt = `
You are a verification engine.

Check if the following output contains:
- made-up facts
- unsupported claims
- vague statistics
- legal inaccuracies

Return JSON only (no markdown, no explanation):
{
  "valid": true,
  "confidence": 0.9,
  "issues": []
}

OUTPUT:
${output}
`;

  try {
    const result = await runAI(checkPrompt);
    // Strip markdown code fences if present
    const cleaned = result.replace(/```(?:json)?\s*|```/gi, "").trim();
    return JSON.parse(cleaned) as AICheckResult;
  } catch {
    return { valid: false, confidence: 0, issues: ["Invalid verification response"] };
  }
}

// --- SAFE FALLBACK RESPONSE
function generateSafeFallback(): SafeFallback {
  return {
    message:
      "We could not verify this information with sufficient confidence. Please review manually or provide additional documentation.",
    action: "RETRY_OR_UPLOAD_DOCUMENT",
  };
}

// --- MAIN VERIFICATION PIPELINE
export async function verifyAIResponse({
  output,
  sources = [],
  timestamp,
  prompt: _prompt,
  runAI,
}: VerifyInput): Promise<VerifyResult> {
  const failures: string[] = [];

  // 1. Red flag detection
  const redFlags = detectRedFlags(output);
  if (redFlags.length > 0) {
    failures.push("Suspicious language patterns detected");
  }

  // 2. Source validation
  if (VERIFY_CONFIG.requireSources) {
    const sourceCheck = validateSources(sources);
    if (!sourceCheck.valid) {
      failures.push(sourceCheck.reason);
    }
  }

  // 3. Freshness check
  if (!validateFreshness(timestamp)) {
    failures.push("Data is stale");
  }

  // 4. AI cross-check (only if a runAI function is provided)
  let aiCheckConfidence = 1;
  if (runAI) {
    const aiCheck = await crossCheckAI(output, runAI);
    if (!aiCheck.valid || aiCheck.confidence < VERIFY_CONFIG.minConfidence) {
      failures.push("AI self-check failed");
    }
    aiCheckConfidence = aiCheck.confidence;
  }

  // 5. FINAL DECISION
  if (failures.length > 0) {
    return {
      success: false,
      error: "Verification failed",
      failures,
      safeFallback: generateSafeFallback(),
    };
  }

  return {
    success: true,
    data: {
      output,
      sources,
      verified: true,
      verifiedAt: new Date().toISOString(),
      confidence: aiCheckConfidence,
    },
  };
}
