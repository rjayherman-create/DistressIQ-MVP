import { type Request, type Response, type NextFunction } from "express";

// ---------------------------------------------------------------------------
// Disclaimer text (source of truth)
// ---------------------------------------------------------------------------

export const DISCLAIMER_TEXT = `This application provides financial data, risk indicators, and informational content only.

It does NOT provide:
- Investment advice
- Recommendations to buy or sell securities
- Financial, legal, or tax advice

All information is:
- Provided "as is"
- May be incomplete, delayed, or inaccurate
- Derived from third-party and automated systems

You are solely responsible for:
- Your investment decisions
- Any financial losses incurred

By using this application, you agree:
- The creators are not liable for any losses
- This tool is for informational and research purposes only

Use at your own risk.`;

// ---------------------------------------------------------------------------
// Middleware: enforce disclaimer acceptance
// ---------------------------------------------------------------------------

/**
 * Blocks API access unless the client sends `x-disclaimer-accepted: true`.
 * Apply to protected API routes after the public accept-disclaimer route.
 */
export function disclaimerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const accepted = req.headers["x-disclaimer-accepted"];

  if (!accepted || accepted !== "true") {
    res.status(403).json({
      error: "DISCLAIMER_NOT_ACCEPTED",
      message: "You must accept the disclaimer before using this app.",
      disclaimer: DISCLAIMER_TEXT,
    });
    return;
  }

  next();
}

// ---------------------------------------------------------------------------
// Middleware: inject disclaimer into every JSON response
// ---------------------------------------------------------------------------

/**
 * Wraps `res.json` so every response includes the disclaimer text and a
 * timestamp.  Apply globally before route handlers.
 */
export function injectDisclaimer(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const originalJson = res.json.bind(res);

  res.json = function (data: unknown) {
    const enriched =
      data !== null && typeof data === "object" && !Array.isArray(data)
        ? {
            ...(data as Record<string, unknown>),
            disclaimer: DISCLAIMER_TEXT,
            timestamp: new Date().toISOString(),
          }
        : data;
    return originalJson(enriched);
  };

  next();
}

// ---------------------------------------------------------------------------
// Route handler: log disclaimer acceptance
// ---------------------------------------------------------------------------

interface AcceptanceRecord {
  ip: string | undefined;
  userAgent: string | undefined;
  timestamp: string;
}

const acceptanceLog: AcceptanceRecord[] = [];

/**
 * POST /api/accept-disclaimer
 * Records that the user accepted the disclaimer and returns confirmation.
 */
export function logDisclaimerAcceptance(req: Request, res: Response): void {
  const record: AcceptanceRecord = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    timestamp: new Date().toISOString(),
  };

  acceptanceLog.push(record);

  res.json({
    success: true,
    message: "Disclaimer accepted",
    record,
  });
}
