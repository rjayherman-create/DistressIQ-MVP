import crypto from "crypto";
import { type Request, type Response, type NextFunction } from "express";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Timestamp {
  iso: string;
  unix: number;
  readable: string;
}

export interface RequestMeta {
  requestId: string;
  timestamp: Timestamp;
}

declare global {
  namespace Express {
    interface Request {
      meta?: RequestMeta;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a full timestamp object with ISO, unix, and human-readable forms. */
export function getTimestamp(): Timestamp {
  const now = new Date();
  return {
    iso: now.toISOString(),
    unix: Date.now(),
    readable: now.toLocaleString(),
  };
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/** Attaches a unique request ID and timestamp to every incoming request. */
export function timestampMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ts = getTimestamp();

  req.meta = {
    requestId: crypto.randomUUID(),
    timestamp: ts,
  };

  res.setHeader("X-Request-ID", req.meta.requestId);
  res.setHeader("X-Timestamp", ts.iso);

  next();
}

// ---------------------------------------------------------------------------
// AI response wrapper
// ---------------------------------------------------------------------------

export interface StampedAIResponse<T> {
  data: T;
  meta: {
    source: string;
    generatedAt: Timestamp;
    verified: boolean;
  };
}

/**
 * Wraps an AI-generated output with source metadata and a timestamp.
 * Critical for hallucination traceability — every AI response should be stamped.
 */
export function stampAIResponse<T>(output: T, source = "AI"): StampedAIResponse<T> {
  return {
    data: output,
    meta: {
      source,
      generatedAt: getTimestamp(),
      verified: false,
    },
  };
}

// ---------------------------------------------------------------------------
// DB record helpers
// ---------------------------------------------------------------------------

/** Stamps a new DB record with `created_at` and `updated_at` ISO timestamps. */
export function stampDBRecord<T extends object>(data: T): T & { created_at: string; updated_at: string } {
  const ts = getTimestamp();
  return {
    ...data,
    created_at: ts.iso,
    updated_at: ts.iso,
  };
}

/** Updates `updated_at` on an existing record. */
export function touchRecord<T extends object>(data: T): T & { updated_at: string } {
  return {
    ...data,
    updated_at: getTimestamp().iso,
  };
}

// ---------------------------------------------------------------------------
// Freshness check
// ---------------------------------------------------------------------------

/**
 * Returns true if the given ISO timestamp is within `maxAgeMinutes` of now.
 * Use before consuming stored data to prevent stale-data usage.
 */
export function isFresh(timestampISO: string, maxAgeMinutes = 60): boolean {
  const now = Date.now();
  const ts = new Date(timestampISO).getTime();
  if (isNaN(ts)) return false;
  const diffMinutes = (now - ts) / (1000 * 60);
  return diffMinutes <= maxAgeMinutes;
}
