/**
 * Minimal AI client for DistressIQ.
 *
 * Primary path: OpenAI chat completion (requires OPENAI_API_KEY env var).
 * Fallback: rule-based safe response that satisfies anti-hallucination checks
 *           when no API key is configured.
 */

import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
}

// ---------------------------------------------------------------------------
// Safe rule-based fallback
// ---------------------------------------------------------------------------

/**
 * Generates a deterministic safe response when no AI backend is available.
 * Satisfies anti-hallucination requirements:
 *  - Includes required uncertainty phrases ("could not be verified", "official source", etc.)
 *  - Avoids dangerous guarantees
 *  - Labels user-provided data clearly
 */
export function buildSafeResponse(
  userMessage: string,
  verifiedData: Record<string, unknown> = {},
  userFacts: Record<string, unknown> = {},
): string {
  const hasVerified = Object.keys(verifiedData).length > 0;
  const hasUserFacts = Object.keys(userFacts).length > 0;

  const lines: string[] = [
    "Thank you for your question. Please note this is not legal advice and does not guarantee any outcome.",
    "",
  ];

  if (hasVerified) {
    lines.push("Based on verified information:");
    for (const [key, value] of Object.entries(verifiedData)) {
      if (key === "appDisclaimer") {
        lines.push(`  ${value}`);
      } else {
        lines.push(`  ${key}: ${value}`);
      }
    }
    lines.push("");
    lines.push(
      "Please review this information and confirm with an official source before taking action.",
    );
  } else {
    lines.push(
      "The information you requested could not be verified from an official source.",
    );
    lines.push(
      "Please check with an official source or consult with an attorney before taking action.",
    );
  }

  if (hasUserFacts) {
    lines.push("");
    lines.push("Based on your answers (user-provided, not independently verified):");
    for (const [key, value] of Object.entries(userFacts)) {
      lines.push(`  ${key}: ${value}`);
    }
    lines.push("");
    lines.push("Please review before filing or taking action.");
  }

  lines.push("");
  lines.push(
    `Your question was: "${userMessage.slice(0, 120)}${userMessage.length > 120 ? "..." : ""}"`,
  );
  lines.push(
    "We are unable to guarantee any specific outcome. Please confirm all details with the appropriate official source.",
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// OpenAI chat completion
// ---------------------------------------------------------------------------

async function callOpenAI(
  messages: OpenAIChatMessage[],
  apiKey: string,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages,
      temperature: 0.2,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as OpenAIChatResponse;
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");
  return content;
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Generate a response using OpenAI (if configured) or the safe fallback.
 *
 * @param systemPrompt  System instruction
 * @param userMessage   The user's message / prompt
 * @param verifiedData  Verified facts to include in the fallback context
 * @param userFacts     User-supplied facts for the fallback context
 */
export async function generateAIResponse(
  systemPrompt: string,
  userMessage: string,
  verifiedData: Record<string, unknown> = {},
  userFacts: Record<string, unknown> = {},
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.info("OPENAI_API_KEY not set — using safe rule-based response");
    return buildSafeResponse(userMessage, verifiedData, userFacts);
  }

  try {
    return await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      apiKey,
    );
  } catch (err) {
    logger.warn({ err }, "OpenAI call failed — falling back to safe response");
    return buildSafeResponse(userMessage, verifiedData, userFacts);
  }
}

/**
 * Thin wrapper to match the `runAI(prompt: string) => Promise<string>` signature
 * expected by verifyAIResponse's cross-check step.
 */
export async function runAI(prompt: string): Promise<string> {
  return generateAIResponse(
    "You are a verification engine. Return only valid JSON.",
    prompt,
  );
}
