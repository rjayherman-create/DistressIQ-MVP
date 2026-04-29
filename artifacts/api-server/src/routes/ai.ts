import { Router, type IRouter } from "express";
import { verifyAIResponse, type Source } from "../lib/verify";
import { generateAIResponse, runAI } from "../lib/ai-client";
import { stampAIResponse } from "../lib/timestamp";

const AI_SOURCE = "AI";
const AI_FALLBACK_SOURCE = "AI:fallback";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/ai/check
// ---------------------------------------------------------------------------
// Used by the hallucination-check script (scripts/hallucination-check.mjs).
// Accepts: { message, verifiedData, userFacts, safetyMode, instruction }
// Returns: { answer: string }
// ---------------------------------------------------------------------------
router.post("/ai/check", async (req, res) => {
  const {
    message,
    verifiedData = {},
    userFacts = {},
    instruction = "",
  } = req.body as {
    message?: string;
    verifiedData?: Record<string, unknown>;
    userFacts?: Record<string, unknown>;
    safetyMode?: string;
    instruction?: string;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  // Build a system prompt that enforces safety and uses only the supplied data
  const hasVerified = Object.keys(verifiedData).length > 0;

  const systemPrompt = [
    instruction ||
      "Use only verifiedData and userFacts. Do not invent facts. If verified data is missing, say it could not be verified and instruct the user to check an official source. Do not provide legal advice or guarantees.",
    "",
    "RULES:",
    "- Never invent court addresses, filing fees, deadlines, statutes of limitations, or legal outcomes.",
    "- Never guarantee outcomes or results.",
    "- Label all user-supplied facts as 'user-provided' or 'based on your answers'.",
    "- If no verified data is supplied, explicitly state the information could not be verified.",
    "- Always include a reminder that this is not legal advice.",
    "",
    hasVerified
      ? `VERIFIED DATA (authoritative — use these values):\n${JSON.stringify(verifiedData, null, 2)}`
      : "VERIFIED DATA: (none — do not invent any facts; say they could not be verified)",
    "",
    userFacts && Object.keys(userFacts).length > 0
      ? `USER-PROVIDED FACTS (label as user-provided):\n${JSON.stringify(userFacts, null, 2)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Generate the AI response
  const aiOutput = await generateAIResponse(
    systemPrompt,
    message,
    verifiedData,
    userFacts,
  );

  // Derive sources from available data
  const sources: Source[] = [];
  if (hasVerified) {
    sources.push({ type: "official", name: "Verified app data" });
  }
  if (userFacts && Object.keys(userFacts).length > 0) {
    sources.push({ type: "user-doc", name: "User-provided facts" });
  }

  // Run the verification pipeline
  const result = await verifyAIResponse({
    output: aiOutput,
    sources,
    timestamp: new Date().toISOString(),
    prompt: message,
    runAI,
  });

  if (!result.success) {
    // Return the safe fallback text as the answer
    res.json(stampAIResponse(result.safeFallback.message, AI_FALLBACK_SOURCE));
    return;
  }

  res.json(stampAIResponse(result.data.output, AI_SOURCE));
});

// ---------------------------------------------------------------------------
// POST /api/generate
// ---------------------------------------------------------------------------
// General-purpose AI generation endpoint with hallucination verification.
// Accepts: { prompt }
// Returns: verified AI response or 400 on failure
// ---------------------------------------------------------------------------
router.post("/generate", async (req, res) => {
  const { prompt } = req.body as { prompt?: string };

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  // 1. Generate AI output
  const aiOutput = await generateAIResponse(
    "You are a helpful assistant. Do not invent facts, guarantee outcomes, or provide legal advice.",
    prompt,
  );

  // 2. Attach sources
  const sources: Source[] = [
    { type: "user-doc", name: "User prompt" },
  ];

  // 3. Verify
  const result = await verifyAIResponse({
    output: aiOutput,
    sources,
    timestamp: new Date().toISOString(),
    prompt,
    runAI,
  });

  // 4. Hard fail or return
  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json(stampAIResponse(result.data, AI_SOURCE));
});

export default router;
