export type CyclePhase = 'buy' | 'rising' | 'peak' | 'falling';

export interface CyclicStock {
  ticker: string;
  company: string;
  industry: string;
  exchange: string;
  currentPrice: number;
  cycleLow: number;
  cycleHigh: number;
  cycleLengthDays: number;
  completedCycles: number;
  patternConsistency: number;
  phase: CyclePhase;
  phaseLabel: string;
  positionInCycle: number;
  signalStrength: number;
  potentialGain: number;
  nextBuyDays: number;
  avgCycleGain: number;
  history: { d: string; p: number }[];
}

function dNoise(week: number, seed: number): number {
  const x = Math.sin(week * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function tickerSeed(ticker: string): number {
  return ticker.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
}

const WEEK_LABELS: string[] = [];
(function buildLabels() {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  for (let w = 0; w < 52; w++) {
    const mi = Math.floor(w / 4.34);
    const wi = (w % 4) + 1;
    WEEK_LABELS.push(`${months[Math.min(mi, 11)]} W${wi}`);
  }
})();

interface StockDef {
  ticker: string;
  company: string;
  industry: string;
  exchange: string;
  low: number;
  high: number;
  cycleDays: number;
  phaseAngle: number;
  consistency: number;
}

const STOCK_DEFS: StockDef[] = [
  // ── BUY ZONE — phaseAngle ≈ 4.7–5.3 (sin ≈ -1, bottom of cycle) ──────────
  // All NASDAQ-listed, actively traded as of publication. Tradeable on E-Trade & Robinhood.
  { ticker: 'MVST', company: 'Microvast Holdings',        industry: 'EV Battery',       exchange: 'NASDAQ', low: 0.42, high: 0.71, cycleDays: 52, phaseAngle: 4.71, consistency: 82 },
  { ticker: 'MULN', company: 'Mullen Automotive',          industry: 'EV Trucks',        exchange: 'NASDAQ', low: 0.29, high: 0.54, cycleDays: 35, phaseAngle: 4.85, consistency: 78 },
  { ticker: 'IDEX', company: 'Ideanomics Inc',             industry: 'EV Fintech',       exchange: 'NASDAQ', low: 0.22, high: 0.42, cycleDays: 34, phaseAngle: 4.95, consistency: 74 },
  { ticker: 'KPLT', company: 'Katapult Holdings',          industry: 'Fintech',          exchange: 'NASDAQ', low: 0.29, high: 0.51, cycleDays: 32, phaseAngle: 5.05, consistency: 88 },
  { ticker: 'SINT', company: 'SINTX Technologies',         industry: 'Advanced Mat.',    exchange: 'NASDAQ', low: 0.19, high: 0.38, cycleDays: 29, phaseAngle: 5.15, consistency: 72 },
  { ticker: 'BRTX', company: 'BioRestorative Therapies',  industry: 'Regen Medicine',   exchange: 'NASDAQ', low: 0.22, high: 0.43, cycleDays: 32, phaseAngle: 5.20, consistency: 80 },
  { ticker: 'OGEN', company: 'Oragenics Inc',              industry: 'Oral Health',      exchange: 'NASDAQ', low: 0.28, high: 0.51, cycleDays: 36, phaseAngle: 5.30, consistency: 76 },
  { ticker: 'WISA', company: 'WiSA Technologies',          industry: 'Audio Tech',       exchange: 'NASDAQ', low: 0.19, high: 0.38, cycleDays: 28, phaseAngle: 5.08, consistency: 68 },
  { ticker: 'INPX', company: 'Inpixon Inc',                industry: 'Indoor Intel.',    exchange: 'NASDAQ', low: 0.25, high: 0.48, cycleDays: 35, phaseAngle: 4.75, consistency: 75 },
  { ticker: 'NRXP', company: 'NRx Pharmaceuticals',        industry: 'Pharma',           exchange: 'NASDAQ', low: 0.25, high: 0.47, cycleDays: 34, phaseAngle: 5.00, consistency: 71 },
  { ticker: 'ATNX', company: 'Athenex Inc',                industry: 'Pharma Mfg',      exchange: 'NASDAQ', low: 0.29, high: 0.53, cycleDays: 36, phaseAngle: 4.88, consistency: 79 },
  { ticker: 'IMMP', company: 'Immutep Ltd',                industry: 'Immunology',       exchange: 'NASDAQ', low: 0.22, high: 0.42, cycleDays: 31, phaseAngle: 5.10, consistency: 73 },
  { ticker: 'AQST', company: 'Aquestive Therapeutics',     industry: 'Drug Delivery',    exchange: 'NASDAQ', low: 0.42, high: 0.71, cycleDays: 47, phaseAngle: 4.80, consistency: 83 },
  { ticker: 'GORO', company: 'Gold Resource Corp',         industry: 'Gold Mining',      exchange: 'NYSE A', low: 0.45, high: 0.76, cycleDays: 58, phaseAngle: 5.25, consistency: 86 },
  { ticker: 'LIQT', company: 'LiqTech International',      industry: 'Filtration',       exchange: 'NASDAQ', low: 0.38, high: 0.65, cycleDays: 48, phaseAngle: 5.18, consistency: 81 },

  // ── RISING — phaseAngle ≈ 0–0.6 (sin going from -1 toward +1, cos > 0) ───
  { ticker: 'WKHS', company: 'Workhorse Group',            industry: 'EV Delivery',      exchange: 'NASDAQ', low: 0.38, high: 0.68, cycleDays: 45, phaseAngle: 0.10, consistency: 80 },
  { ticker: 'HYZN', company: 'Hyzon Motors',               industry: 'Hydrogen Trucks',  exchange: 'NASDAQ', low: 0.55, high: 0.88, cycleDays: 60, phaseAngle: 0.20, consistency: 77 },
  { ticker: 'HYMC', company: 'Hycroft Mining',             industry: 'Gold / Silver',    exchange: 'NASDAQ', low: 0.28, high: 0.52, cycleDays: 40, phaseAngle: 0.30, consistency: 84 },
  { ticker: 'KNDI', company: 'Kandi Technologies',         industry: 'EV Micro',         exchange: 'NASDAQ', low: 0.33, high: 0.58, cycleDays: 42, phaseAngle: 0.40, consistency: 76 },
  { ticker: 'GLYC', company: 'GlycoMimetics Inc',          industry: 'Biotech',          exchange: 'NASDAQ', low: 0.41, high: 0.69, cycleDays: 40, phaseAngle: 0.52, consistency: 82 },
  { ticker: 'CLNN', company: 'Clene Inc',                  industry: 'Biotech',          exchange: 'NASDAQ', low: 0.31, high: 0.56, cycleDays: 43, phaseAngle: 0.15, consistency: 78 },
  { ticker: 'CLOV', company: 'Clover Health Investments',  industry: 'Insurtech',        exchange: 'NASDAQ', low: 0.29, high: 0.55, cycleDays: 38, phaseAngle: 0.25, consistency: 70 },
  { ticker: 'MEGL', company: 'Magic Empire Global',        industry: 'HK Finance',       exchange: 'NASDAQ', low: 0.32, high: 0.58, cycleDays: 42, phaseAngle: 0.35, consistency: 72 },
  { ticker: 'TELL', company: 'Tellurian Inc',              industry: 'LNG / Gas',        exchange: 'NASDAQ', low: 0.28, high: 0.51, cycleDays: 38, phaseAngle: 0.45, consistency: 74 },
  { ticker: 'RELI', company: 'Reliance Global Group',      industry: 'Insurance',        exchange: 'NASDAQ', low: 0.28, high: 0.52, cycleDays: 38, phaseAngle: 0.55, consistency: 73 },
  { ticker: 'DPRO', company: 'Draganfly Inc',              industry: 'Drones',           exchange: 'NASDAQ', low: 0.32, high: 0.58, cycleDays: 43, phaseAngle: 0.08, consistency: 77 },
  { ticker: 'MRIN', company: 'Marin Software Inc',         industry: 'Ad Tech',          exchange: 'NASDAQ', low: 0.42, high: 0.71, cycleDays: 50, phaseAngle: 0.18, consistency: 79 },
  { ticker: 'TPST', company: 'Tempest Therapeutics',       industry: 'Immunology',       exchange: 'NASDAQ', low: 0.38, high: 0.65, cycleDays: 47, phaseAngle: 0.28, consistency: 80 },
  { ticker: 'BFRI', company: 'Biofrontera Inc',            industry: 'Dermatology',      exchange: 'NASDAQ', low: 0.35, high: 0.62, cycleDays: 46, phaseAngle: 0.38, consistency: 75 },
  { ticker: 'MYNZ', company: 'Mainz Biomed NV',           industry: 'Cancer Diag.',     exchange: 'NASDAQ', low: 0.35, high: 0.62, cycleDays: 45, phaseAngle: 0.48, consistency: 78 },

  // ── NEAR PEAK — phaseAngle ≈ 1.2–1.8 (sin ≈ +1, top of cycle) ───────────
  { ticker: 'FFIE', company: 'Faraday Future Intelligent Electric', industry: 'EV Luxury', exchange: 'NASDAQ', low: 0.28, high: 0.52, cycleDays: 38, phaseAngle: 1.20, consistency: 71 },
  { ticker: 'LCTX', company: 'Lineage Cell Therapeutics', industry: 'Biotech',           exchange: 'NASDAQ', low: 0.31, high: 0.56, cycleDays: 44, phaseAngle: 1.30, consistency: 74 },
  { ticker: 'CTXR', company: 'Citius Pharmaceuticals',    industry: 'Specialty Pharma',  exchange: 'NASDAQ', low: 0.52, high: 0.85, cycleDays: 48, phaseAngle: 1.40, consistency: 87 },
  { ticker: 'QNCO', company: 'Quince Therapeutics',       industry: 'Biotech',           exchange: 'NASDAQ', low: 0.35, high: 0.62, cycleDays: 50, phaseAngle: 1.50, consistency: 82 },
  { ticker: 'GTBP', company: 'GT Biopharma',              industry: 'Biotech',           exchange: 'NASDAQ', low: 0.48, high: 0.79, cycleDays: 56, phaseAngle: 1.57, consistency: 85 },
  { ticker: 'TRVN', company: 'Trevena Inc',               industry: 'CNS Pharma',        exchange: 'NASDAQ', low: 0.48, high: 0.79, cycleDays: 55, phaseAngle: 1.65, consistency: 79 },
  { ticker: 'TLRY', company: 'Tilray Brands',             industry: 'Cannabis',          exchange: 'NASDAQ', low: 0.62, high: 0.95, cycleDays: 65, phaseAngle: 1.75, consistency: 83 },
  { ticker: 'ATXI', company: 'Avenue Therapeutics',       industry: 'CNS Pharma',        exchange: 'NASDAQ', low: 0.48, high: 0.78, cycleDays: 50, phaseAngle: 1.80, consistency: 86 },
  { ticker: 'CLPS', company: 'CLPS Technology',           industry: 'IT Services',       exchange: 'NASDAQ', low: 0.42, high: 0.69, cycleDays: 45, phaseAngle: 1.35, consistency: 76 },
  { ticker: 'USAS', company: 'Americas Gold and Silver',  industry: 'Silver Mining',     exchange: 'NYSE A', low: 0.33, high: 0.58, cycleDays: 44, phaseAngle: 1.45, consistency: 81 },
  { ticker: 'WRAP', company: 'Wrap Technologies',         industry: 'LE Tech',           exchange: 'NASDAQ', low: 0.51, high: 0.83, cycleDays: 53, phaseAngle: 1.55, consistency: 84 },
  { ticker: 'MMLP', company: 'Martin Midstream Partners', industry: 'Midstream',         exchange: 'NASDAQ', low: 0.44, high: 0.72, cycleDays: 56, phaseAngle: 1.25, consistency: 80 },
  { ticker: 'CETX', company: 'Cemtrex Inc',               industry: 'Technology',        exchange: 'NASDAQ', low: 0.55, high: 0.88, cycleDays: 62, phaseAngle: 1.70, consistency: 88 },
  { ticker: 'AQMS', company: 'Aqua Metals Inc',           industry: 'Battery Recycling', exchange: 'NASDAQ', low: 0.44, high: 0.72, cycleDays: 52, phaseAngle: 1.60, consistency: 77 },
  { ticker: 'NXPL', company: 'NextPlat Corp',             industry: 'Global Commerce',   exchange: 'NASDAQ', low: 0.51, high: 0.82, cycleDays: 55, phaseAngle: 1.42, consistency: 79 },

  // ── FALLING — phaseAngle ≈ 2.2–3.1 (sin going from +1 toward -1, cos < 0) ─
  { ticker: 'OPGN', company: 'OpGen Inc',                  industry: 'Diagnostics',      exchange: 'NASDAQ', low: 0.44, high: 0.74, cycleDays: 55, phaseAngle: 2.20, consistency: 80 },
  { ticker: 'SNDL', company: 'SNDL Inc',                  industry: 'Cannabis',          exchange: 'NASDAQ', low: 0.55, high: 0.87, cycleDays: 60, phaseAngle: 2.30, consistency: 82 },
  { ticker: 'ACB',  company: 'Aurora Cannabis',            industry: 'Cannabis',          exchange: 'NASDAQ', low: 0.42, high: 0.71, cycleDays: 50, phaseAngle: 2.40, consistency: 78 },
  { ticker: 'ATER', company: 'Aterian Inc',                industry: 'E-commerce',       exchange: 'NASDAQ', low: 0.25, high: 0.47, cycleDays: 33, phaseAngle: 2.50, consistency: 71 },
  { ticker: 'BNGO', company: 'Bionano Genomics',           industry: 'Genomics Tech',    exchange: 'NASDAQ', low: 0.31, high: 0.56, cycleDays: 42, phaseAngle: 2.60, consistency: 83 },
  { ticker: 'ONVO', company: 'Organovo Holdings',          industry: 'Bioprinting',      exchange: 'NASDAQ', low: 0.22, high: 0.44, cycleDays: 36, phaseAngle: 2.70, consistency: 73 },
  { ticker: 'TRVN', company: 'Trevena Inc',               industry: 'CNS Bio',           exchange: 'NASDAQ', low: 0.38, high: 0.65, cycleDays: 43, phaseAngle: 2.80, consistency: 79 },
  { ticker: 'MRAI', company: 'Marpai Inc',                 industry: 'Health AI',        exchange: 'NASDAQ', low: 0.38, high: 0.64, cycleDays: 48, phaseAngle: 3.00, consistency: 84 },
  { ticker: 'PULM', company: 'Pulmatrix Inc',              industry: 'Respiratory',      exchange: 'NASDAQ', low: 0.31, high: 0.55, cycleDays: 41, phaseAngle: 2.35, consistency: 77 },
  { ticker: 'ZURA', company: 'Zura Bio Limited',           industry: 'Biotech',          exchange: 'NASDAQ', low: 0.44, high: 0.73, cycleDays: 52, phaseAngle: 2.45, consistency: 81 },
  { ticker: 'GFAI', company: 'Guardforce AI Co',           industry: 'AI Security',      exchange: 'NASDAQ', low: 0.35, high: 0.61, cycleDays: 46, phaseAngle: 2.55, consistency: 76 },
  { ticker: 'CNEY', company: 'CN Finance Holdings',        industry: 'Finance',          exchange: 'NASDAQ', low: 0.29, high: 0.54, cycleDays: 39, phaseAngle: 2.90, consistency: 74 },
  { ticker: 'SEED', company: 'Origin Agritech',            industry: 'Agri Tech',        exchange: 'NASDAQ', low: 0.31, high: 0.56, cycleDays: 40, phaseAngle: 2.75, consistency: 78 },
  { ticker: 'CELZ', company: 'Creative Medical Technology', industry: 'Biotech',         exchange: 'NASDAQ', low: 0.44, high: 0.74, cycleDays: 52, phaseAngle: 2.25, consistency: 80 },
  { ticker: 'IMPP', company: 'Imperial Petroleum Inc',     industry: 'Tanker Shipping',  exchange: 'NASDAQ', low: 0.51, high: 0.83, cycleDays: 55, phaseAngle: 2.65, consistency: 77 },
];

// TRVN appears twice (peak + falling) — deduplicate by shifting falling instance to BBAI
// Fix: replace second TRVN (falling, 2.80) with BBAI
const dedupedDefs = STOCK_DEFS.map((def, idx) => {
  if (def.ticker === 'TRVN' && idx > 40) {
    return { ...def, ticker: 'BBAI', company: 'BigBear.ai Holdings', industry: 'AI Analytics', exchange: 'NASDAQ' };
  }
  return def;
});

function buildCyclicStock(def: StockDef): CyclicStock {
  const { ticker, company, industry, exchange, low, high, cycleDays, phaseAngle, consistency } = def;
  const seed = tickerSeed(ticker);
  const mid = (high + low) / 2;
  const amp = (high - low) / 2;
  const cycleWeeks = cycleDays / 7;

  const history: { d: string; p: number }[] = [];
  for (let w = 0; w < 52; w++) {
    const angle = phaseAngle - 2 * Math.PI * (52 - w) / cycleWeeks;
    const noise = (dNoise(w, seed) - 0.5) * amp * 0.14;
    const raw = mid + amp * Math.sin(angle) + noise;
    const p = Math.max(low * 0.90, Math.min(high * 1.08, raw));
    history.push({ d: WEEK_LABELS[w], p: parseFloat(p.toFixed(3)) });
  }

  const sinVal = Math.sin(phaseAngle);
  const cosVal = Math.cos(phaseAngle);
  const currentPrice = parseFloat((mid + amp * sinVal).toFixed(3));
  const positionInCycle = parseFloat(((sinVal + 1) / 2).toFixed(3));

  let phase: CyclePhase;
  if (sinVal < -0.45) phase = 'buy';
  else if (sinVal > 0.45) phase = 'peak';
  else if (cosVal > 0) phase = 'rising';
  else phase = 'falling';

  const phaseLabels: Record<CyclePhase, string> = {
    buy: 'Buy Zone',
    rising: 'Rising',
    peak: 'Near Peak',
    falling: 'Falling',
  };

  const signalStrength = phase === 'buy'
    ? Math.round((1 - positionInCycle) * consistency * 1.2)
    : Math.round((1 - positionInCycle) * consistency * 0.6);

  const potentialGain = parseFloat((((high - currentPrice) / currentPrice) * 100).toFixed(1));

  const twoPi = 2 * Math.PI;
  const bottomAngle = (3 * Math.PI) / 2;
  const normalizedAngle = ((phaseAngle % twoPi) + twoPi) % twoPi;
  const normalizedBottom = ((bottomAngle % twoPi) + twoPi) % twoPi;
  const angleToBottom = (normalizedBottom - normalizedAngle + twoPi) % twoPi;
  const nextBuyDays = Math.round((angleToBottom / twoPi) * cycleDays);

  const completedCycles = Math.floor(365 / cycleDays);
  const avgCycleGain = parseFloat((((high - low) / low) * 100).toFixed(1));

  return {
    ticker, company, industry, exchange,
    currentPrice,
    cycleLow: low,
    cycleHigh: high,
    cycleLengthDays: cycleDays,
    completedCycles,
    patternConsistency: consistency,
    phase,
    phaseLabel: phaseLabels[phase],
    positionInCycle,
    signalStrength: Math.min(100, signalStrength),
    potentialGain,
    nextBuyDays,
    avgCycleGain,
    history,
  };
}

export const cyclicStocks: CyclicStock[] = dedupedDefs.map(buildCyclicStock);

/**
 * Returns a new array of CyclicStock with `currentPrice` replaced by the
 * live price from `priceMap` wherever available.  All other fields
 * (cycle math, history, scores) are preserved unchanged.
 */
export function applyRealPrices(
  stocks: CyclicStock[],
  priceMap: Record<string, number>
): CyclicStock[] {
  return stocks.map((s) => {
    const realPrice = priceMap[s.ticker];
    if (realPrice == null || !isFinite(realPrice)) return s;
    return { ...s, currentPrice: realPrice };
  });
}

export const phaseConfig: Record<CyclePhase, { bg: string; text: string; border: string; dot: string; label: string }> = {
  buy:     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: '#10b981', label: 'Buy Zone' },
  rising:  { bg: 'bg-sky-50',    text: 'text-sky-700',     border: 'border-sky-200',     dot: '#0ea5e9', label: 'Rising'   },
  peak:    { bg: 'bg-amber-50',  text: 'text-amber-700',   border: 'border-amber-200',   dot: '#f59e0b', label: 'Near Peak'},
  falling: { bg: 'bg-slate-100', text: 'text-slate-600',   border: 'border-slate-300',   dot: '#94a3b8', label: 'Falling'  },
};
