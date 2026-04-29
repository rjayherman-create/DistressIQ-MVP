// ==============================
// GLOBAL TIMESTAMP GUARDRAIL
// ==============================

import crypto from "crypto";
import { type Request, type Response, type NextFunction } from "express";

// --- Helper: get full timestamp object
export function getTimestamp() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    unix: Date.now(),
    readable: now.toLocaleString(),
  };
}

// Augment Express Request to carry request metadata
declare global {
  namespace Express {
    interface Request {
      meta?: {
        requestId: string;
        timestamp: ReturnType<typeof getTimestamp>;
      };
    }
  }
}

// --- Middleware: attach to EVERY request
export function timestampMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const ts = getTimestamp();

  req.meta = {
    requestId: crypto.randomUUID(),
    timestamp: ts,
  };

  res.setHeader("X-Request-ID", req.meta.requestId);
  res.setHeader("X-Timestamp", ts.iso);

  next();
}

// --- Wrap AI responses (CRITICAL for hallucination control)
export function stampAIResponse<T>(output: T, source = "AI") {
  return {
    data: output,
    meta: {
      source,
      generatedAt: getTimestamp(),
      verified: false,
    },
  };
}

// --- Wrap DB writes
export function stampDBRecord<T extends Record<string, unknown>>(data: T) {
  const ts = getTimestamp();
  return {
    ...data,
    created_at: ts.iso,
    updated_at: ts.iso,
  };
}

// --- Update timestamp helper
export function touchRecord<T extends Record<string, unknown>>(data: T) {
  return {
    ...data,
    updated_at: getTimestamp().iso,
  };
}

// --- Freshness check (prevents stale data usage)
export function isFresh(timestampISO: string, maxAgeMinutes = 60): boolean {
  const ts = new Date(timestampISO).getTime();
  if (isNaN(ts)) return false;
  const diffMinutes = (Date.now() - ts) / (1000 * 60);
  return diffMinutes <= maxAgeMinutes;
}
