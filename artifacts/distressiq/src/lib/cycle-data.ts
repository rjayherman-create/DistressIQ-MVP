export type CyclePhase = 'buy' | 'rising' | 'peak' | 'falling';

export interface CyclicStock {
  ticker: string;
  company: string;
  industry: string;
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
  low: number;
  high: number;
  cycleDays: number;
  phaseAngle: number;
  consistency: number;
}

const STOCK_DEFS: StockDef[] = [
  // BUY ZONE — phaseAngle ≈ 4.7–5.3 (sin ≈ -1, bottom of cycle)
  { ticker: 'MVST', company: 'Microvast Holdings',      industry: 'EV Battery',    low: 0.42, high: 0.71, cycleDays: 52, phaseAngle: 4.71, consistency: 82 },
  { ticker: 'GOEV', company: 'Canoo Inc',                industry: 'EV Vans',       low: 0.29, high: 0.54, cycleDays: 35, phaseAngle: 4.85, consistency: 78 },
  { ticker: 'IDEX', company: 'Ideanomics Inc',           industry: 'Fintech EV',    low: 0.22, high: 0.42, cycleDays: 34, phaseAngle: 4.95, consistency: 74 },
  { ticker: 'AVDL', company: 'Avadel Pharma',            industry: 'Rare Disease',  low: 0.29, high: 0.51, cycleDays: 32, phaseAngle: 5.05, consistency: 88 },
  { ticker: 'SINT', company: 'SINTX Technologies',       industry: 'Advanced Mat.', low: 0.19, high: 0.38, cycleDays: 29, phaseAngle: 5.15, consistency: 72 },
  { ticker: 'TTOO', company: 'T2 Biosystems',            industry: 'Med Devices',   low: 0.22, high: 0.43, cycleDays: 32, phaseAngle: 5.20, consistency: 80 },
  { ticker: 'OGEN', company: 'Oragenics Inc',            industry: 'Oral Health',   low: 0.28, high: 0.51, cycleDays: 36, phaseAngle: 5.30, consistency: 76 },
  { ticker: 'MSRT', company: 'MassRoots Inc',            industry: 'Social Media',  low: 0.19, high: 0.38, cycleDays: 28, phaseAngle: 5.05, consistency: 68 },
  { ticker: 'COMS', company: 'COMSovereign Holding',     industry: 'Telecom',       low: 0.25, high: 0.48, cycleDays: 35, phaseAngle: 4.75, consistency: 75 },
  { ticker: 'BNET', company: 'Benefytt Technologies',    industry: 'Insurtech',     low: 0.25, high: 0.47, cycleDays: 34, phaseAngle: 5.00, consistency: 71 },
  { ticker: 'SNPX', company: 'Synapse Energy',           industry: 'Energy AI',     low: 0.29, high: 0.53, cycleDays: 36, phaseAngle: 4.88, consistency: 79 },
  { ticker: 'KTTA', company: 'Pasithea Therapeutics',    industry: 'Mental Health', low: 0.22, high: 0.42, cycleDays: 31, phaseAngle: 5.10, consistency: 73 },
  { ticker: 'ATOS', company: 'Athenex Inc',              industry: 'Pharma Mfg',   low: 0.42, high: 0.71, cycleDays: 47, phaseAngle: 4.80, consistency: 83 },
  { ticker: 'GORO', company: 'Gold Resource Corp',       industry: 'Gold Mining',   low: 0.45, high: 0.76, cycleDays: 58, phaseAngle: 5.25, consistency: 86 },
  { ticker: 'LIQT', company: 'LiqTech International',    industry: 'Filtration',    low: 0.38, high: 0.65, cycleDays: 48, phaseAngle: 5.18, consistency: 81 },

  // RISING — phaseAngle ≈ 0–0.6 (sin going from -1 toward +1, cos > 0)
  { ticker: 'NKLA', company: 'Nikola Corporation',       industry: 'EV Trucks',     low: 0.38, high: 0.68, cycleDays: 45, phaseAngle: 0.10, consistency: 80 },
  { ticker: 'RIDE', company: 'Lordstown Motors',          industry: 'EV Trucks',     low: 0.55, high: 0.88, cycleDays: 60, phaseAngle: 0.20, consistency: 77 },
  { ticker: 'HYMC', company: 'Hycroft Mining',            industry: 'Gold/Silver',   low: 0.28, high: 0.52, cycleDays: 40, phaseAngle: 0.30, consistency: 84 },
  { ticker: 'SOLO', company: 'Electrameccanica',          industry: 'EV Micro',      low: 0.33, high: 0.58, cycleDays: 42, phaseAngle: 0.40, consistency: 76 },
  { ticker: 'GLYC', company: 'GlycoMimetics',            industry: 'Biotech',       low: 0.41, high: 0.69, cycleDays: 40, phaseAngle: 0.52, consistency: 82 },
  { ticker: 'HEXO', company: 'HEXO Corp',                 industry: 'Cannabis',      low: 0.31, high: 0.56, cycleDays: 43, phaseAngle: 0.15, consistency: 78 },
  { ticker: 'BBBY', company: 'Beyond Basics Inc',         industry: 'Retail',        low: 0.29, high: 0.55, cycleDays: 38, phaseAngle: 0.25, consistency: 70 },
  { ticker: 'MEGL', company: 'Magic Empire Global',       industry: 'HK Finance',    low: 0.32, high: 0.58, cycleDays: 42, phaseAngle: 0.35, consistency: 72 },
  { ticker: 'CUEN', company: 'Cuentas Mobile',            industry: 'Mobile Pay',    low: 0.28, high: 0.51, cycleDays: 38, phaseAngle: 0.45, consistency: 74 },
  { ticker: 'RELI', company: 'Reliance Global',           industry: 'Insurance',     low: 0.28, high: 0.52, cycleDays: 38, phaseAngle: 0.55, consistency: 73 },
  { ticker: 'DPRO', company: 'Draganfly Inc',             industry: 'Drones',        low: 0.32, high: 0.58, cycleDays: 43, phaseAngle: 0.08, consistency: 77 },
  { ticker: 'WKSP', company: 'Workhorse Group',           industry: 'EV Delivery',   low: 0.42, high: 0.71, cycleDays: 50, phaseAngle: 0.18, consistency: 79 },
  { ticker: 'TPST', company: 'Tempest Therapeutics',      industry: 'Immunology',    low: 0.38, high: 0.65, cycleDays: 47, phaseAngle: 0.28, consistency: 80 },
  { ticker: 'BFRI', company: 'Biofrontera Inc',           industry: 'Dermatology',   low: 0.35, high: 0.62, cycleDays: 46, phaseAngle: 0.38, consistency: 75 },
  { ticker: 'MYNZ', company: 'Mainz Biomed',              industry: 'Cancer Diag.',  low: 0.35, high: 0.62, cycleDays: 45, phaseAngle: 0.48, consistency: 78 },

  // NEAR PEAK — phaseAngle ≈ 1.2–1.8 (sin ≈ +1, top of cycle)
  { ticker: 'FFIE', company: 'Faraday Future',            industry: 'EV Luxury',     low: 0.28, high: 0.52, cycleDays: 38, phaseAngle: 1.20, consistency: 71 },
  { ticker: 'ARVL', company: 'Arrival SA',                industry: 'EV Vans',       low: 0.31, high: 0.56, cycleDays: 44, phaseAngle: 1.30, consistency: 74 },
  { ticker: 'CYTO', company: 'Cytokinetics Bio',          industry: 'Biotech',       low: 0.52, high: 0.85, cycleDays: 48, phaseAngle: 1.40, consistency: 87 },
  { ticker: 'PRLD', company: 'Prelude Therapeutics',      industry: 'Oncology',      low: 0.35, high: 0.62, cycleDays: 50, phaseAngle: 1.50, consistency: 82 },
  { ticker: 'SNDX', company: 'Syndax Pharma',             industry: 'Oncology',      low: 0.48, high: 0.79, cycleDays: 56, phaseAngle: 1.57, consistency: 85 },
  { ticker: 'APHA', company: 'Aphria Cannabis',           industry: 'Cannabis',      low: 0.48, high: 0.79, cycleDays: 55, phaseAngle: 1.65, consistency: 79 },
  { ticker: 'TLRY', company: 'Tilray Brands',             industry: 'Cannabis',      low: 0.62, high: 0.95, cycleDays: 65, phaseAngle: 1.75, consistency: 83 },
  { ticker: 'IMVT', company: 'Immunovant Inc',            industry: 'Immunology',    low: 0.48, high: 0.78, cycleDays: 50, phaseAngle: 1.80, consistency: 86 },
  { ticker: 'CLPS', company: 'CLPS Technology',           industry: 'IT Services',   low: 0.42, high: 0.69, cycleDays: 45, phaseAngle: 1.35, consistency: 76 },
  { ticker: 'USAS', company: 'Americas Gold & Silver',   industry: 'Silver Mining', low: 0.33, high: 0.58, cycleDays: 44, phaseAngle: 1.45, consistency: 81 },
  { ticker: 'SILV', company: 'SilverCrest Metals',        industry: 'Silver',        low: 0.51, high: 0.83, cycleDays: 53, phaseAngle: 1.55, consistency: 84 },
  { ticker: 'MMLP', company: 'Martin Midstream',          industry: 'Midstream',     low: 0.44, high: 0.72, cycleDays: 56, phaseAngle: 1.25, consistency: 80 },
  { ticker: 'AXSM', company: 'Axsome Therapeutics',       industry: 'CNS Bio',       low: 0.55, high: 0.88, cycleDays: 62, phaseAngle: 1.70, consistency: 88 },
  { ticker: 'WRAP', company: 'Wrap Technologies',         industry: 'LE Tech',       low: 0.44, high: 0.72, cycleDays: 52, phaseAngle: 1.60, consistency: 77 },
  { ticker: 'FWAA', company: 'Fifth Wall Acquisition III',industry: 'PropTech',      low: 0.51, high: 0.82, cycleDays: 55, phaseAngle: 1.42, consistency: 79 },

  // FALLING — phaseAngle ≈ 2.2–3.1 (sin going from +1 toward -1, cos < 0)
  { ticker: 'NXRT', company: 'Nextracker Micro',         industry: 'Solar EV',      low: 0.44, high: 0.74, cycleDays: 55, phaseAngle: 2.20, consistency: 80 },
  { ticker: 'SNDL', company: 'SNDL Inc',                  industry: 'Cannabis',      low: 0.55, high: 0.87, cycleDays: 60, phaseAngle: 2.30, consistency: 82 },
  { ticker: 'ACBFF', company: 'Aurora Cannabis',          industry: 'Cannabis',      low: 0.42, high: 0.71, cycleDays: 50, phaseAngle: 2.40, consistency: 78 },
  { ticker: 'TLRS', company: 'Torchlight Energy',         industry: 'Oil/Gas',       low: 0.25, high: 0.47, cycleDays: 33, phaseAngle: 2.50, consistency: 71 },
  { ticker: 'EXPR', company: 'Expression Retail',         industry: 'Retail Fashion',low: 0.38, high: 0.64, cycleDays: 44, phaseAngle: 2.60, consistency: 75 },
  { ticker: 'BNGO', company: 'Bionano Genomics',          industry: 'Genomics Tech', low: 0.31, high: 0.56, cycleDays: 42, phaseAngle: 2.70, consistency: 83 },
  { ticker: 'TPVG', company: 'Trevena Pharma',            industry: 'CNS Bio',       low: 0.38, high: 0.65, cycleDays: 43, phaseAngle: 2.80, consistency: 79 },
  { ticker: 'MFIN', company: 'Medallion Financial',       industry: 'Finance',       low: 0.38, high: 0.64, cycleDays: 48, phaseAngle: 3.00, consistency: 84 },
  { ticker: 'ONVO', company: 'Organovo Holdings',         industry: 'Bioprinting',   low: 0.22, high: 0.44, cycleDays: 36, phaseAngle: 2.25, consistency: 73 },
  { ticker: 'PULM', company: 'Pulmatrix Inc',             industry: 'Respiratory',   low: 0.31, high: 0.55, cycleDays: 41, phaseAngle: 2.35, consistency: 77 },
  { ticker: 'ZURA', company: 'Zura Bio Limited',          industry: 'Biotech',       low: 0.44, high: 0.73, cycleDays: 52, phaseAngle: 2.45, consistency: 81 },
  { ticker: 'GFAI', company: 'Guardforce AI',             industry: 'AI Security',   low: 0.35, high: 0.61, cycleDays: 46, phaseAngle: 2.55, consistency: 76 },
  { ticker: 'AQST', company: 'Aquestive Therapeutics',    industry: 'Drug Delivery', low: 0.44, high: 0.73, cycleDays: 52, phaseAngle: 2.65, consistency: 82 },
  { ticker: 'CRTX', company: 'Cortexyme Inc',             industry: 'Alzheimers',    low: 0.29, high: 0.54, cycleDays: 39, phaseAngle: 2.90, consistency: 74 },
  { ticker: 'OPGN', company: 'OpGen Inc',                  industry: 'Diagnostics',   low: 0.31, high: 0.56, cycleDays: 40, phaseAngle: 2.75, consistency: 78 },
];

function buildCyclicStock(def: StockDef): CyclicStock {
  const { ticker, company, industry, low, high, cycleDays, phaseAngle, consistency } = def;
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
  let angleToBottom = (normalizedBottom - normalizedAngle + twoPi) % twoPi;
  const nextBuyDays = Math.round((angleToBottom / twoPi) * cycleDays);

  const completedCycles = Math.floor(365 / cycleDays);
  const avgCycleGain = parseFloat((((high - low) / low) * 100).toFixed(1));

  return {
    ticker, company, industry,
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

export const cyclicStocks: CyclicStock[] = STOCK_DEFS.map(buildCyclicStock);

export const phaseConfig: Record<CyclePhase, { bg: string; text: string; border: string; dot: string; label: string }> = {
  buy:     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: '#10b981', label: 'Buy Zone' },
  rising:  { bg: 'bg-sky-50',    text: 'text-sky-700',     border: 'border-sky-200',     dot: '#0ea5e9', label: 'Rising'   },
  peak:    { bg: 'bg-amber-50',  text: 'text-amber-700',   border: 'border-amber-200',   dot: '#f59e0b', label: 'Near Peak'},
  falling: { bg: 'bg-slate-100', text: 'text-slate-600',   border: 'border-slate-300',   dot: '#94a3b8', label: 'Falling'  },
};
