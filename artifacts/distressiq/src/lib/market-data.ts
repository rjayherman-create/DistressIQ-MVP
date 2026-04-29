// ==============================
// MARKET DATA TIMESTAMP ENGINE
// ==============================

const MARKET_CONFIG = {
  maxPriceAgeSeconds: 60,    // prices must be recent
  maxNewsAgeMinutes: 30,     // news freshness
  requireSource: true,
};

export type DataSource = 'polygon' | 'iex' | 'sec' | string;
export type DataType = 'price' | 'news';

export interface MarketTimestamp {
  iso: string;
  unix: number;
  source: DataSource;
  latency_ms: number;
}

export interface StampedMarketData<T> {
  data: T;
  meta: {
    timestamp: MarketTimestamp;
    verified: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface CrossCheckResult {
  valid: boolean;
  reason?: string;
}

export interface VerifyResult<T> {
  success: boolean;
  failures?: string[];
  block?: boolean;
  data?: StampedMarketData<T> & { verified: boolean; verifiedAt: string };
}

// --- Standard market timestamp
export function marketTimestamp(source: DataSource): MarketTimestamp {
  const now = new Date();

  return {
    iso: now.toISOString(),
    unix: now.getTime(),
    source,                  // "polygon", "iex", "sec", etc.
    latency_ms: 0,           // fill if you track API latency
  };
}

// --- Wrap market data (prices, signals, etc.)
export function stampMarketData<T>(data: T, source: DataSource): StampedMarketData<T> {
  return {
    data,
    meta: {
      timestamp: marketTimestamp(source),
      verified: false,
    },
  };
}

// --- HARD VALIDATION (CRITICAL)
export function validateMarketData({
  timestamp,
  source,
  type,
}: {
  timestamp: MarketTimestamp | undefined;
  source: DataSource | undefined;
  type: DataType;
}): ValidationResult {
  if (!timestamp || !timestamp.iso) {
    return { valid: false, reason: 'Missing timestamp' };
  }

  if (MARKET_CONFIG.requireSource && !source) {
    return { valid: false, reason: 'Missing data source' };
  }

  const now = Date.now();
  const ts = new Date(timestamp.iso).getTime();

  const ageSeconds = (now - ts) / 1000;

  // Different rules per data type
  if (type === 'price' && ageSeconds > MARKET_CONFIG.maxPriceAgeSeconds) {
    return { valid: false, reason: 'Price data stale' };
  }

  if (type === 'news' && ageSeconds > MARKET_CONFIG.maxNewsAgeMinutes * 60) {
    return { valid: false, reason: 'News data stale' };
  }

  return { valid: true };
}

// --- CROSS-CHECK PRICES (ANTI-HALLUCINATION)
export function crossCheckPrices(
  priceA: number,
  priceB: number,
  tolerance = 0.02,
): CrossCheckResult {
  if (priceA === 0) {
    return { valid: false, reason: 'Price cross-check failed: priceA is zero' };
  }

  const diff = Math.abs(priceA - priceB) / priceA;

  if (diff > tolerance) {
    return {
      valid: false,
      reason: 'Price mismatch across sources',
    };
  }

  return { valid: true };
}

// --- FINAL VERIFICATION PIPELINE
export function verifyMarketData<T extends { price: number }>({
  primary,
  secondary,
  type = 'price',
}: {
  primary: StampedMarketData<T>;
  secondary?: StampedMarketData<T>;
  type?: DataType;
}): VerifyResult<T> {
  const failures: string[] = [];

  // 1. Validate primary
  const primaryCheck = validateMarketData({
    timestamp: primary.meta.timestamp,
    source: primary.meta.timestamp.source,
    type,
  });

  if (!primaryCheck.valid) failures.push(primaryCheck.reason!);

  // 2. Cross-check (if available)
  if (secondary) {
    const crossCheck = crossCheckPrices(
      primary.data.price,
      secondary.data.price,
    );

    if (!crossCheck.valid) failures.push(crossCheck.reason!);
  }

  // 3. FINAL DECISION
  if (failures.length > 0) {
    return {
      success: false,
      failures,
      block: true, // HARD STOP
    };
  }

  return {
    success: true,
    data: {
      ...primary,
      verified: true,
      verifiedAt: new Date().toISOString(),
    },
  };
}
