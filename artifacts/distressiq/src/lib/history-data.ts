export type Period = '1W' | '1M' | '3M' | '6M' | '1Y';

export type PricePoint = { d: string; p: number };

export type StockHistory = Record<Period, PricePoint[]>;

export const historicalData: Record<string, StockHistory> = {
  TELA: {
    '1Y': [
      { d: 'Apr', p: 4.12 }, { d: 'May', p: 3.65 }, { d: 'Jun', p: 3.21 },
      { d: 'Jul', p: 2.87 }, { d: 'Aug', p: 2.54 }, { d: 'Sep', p: 2.11 },
      { d: 'Oct', p: 1.78 }, { d: 'Nov', p: 1.44 }, { d: 'Dec', p: 1.27 },
      { d: 'Jan', p: 1.09 }, { d: 'Feb', p: 0.95 }, { d: 'Mar', p: 0.83 },
    ],
    '6M': [
      { d: 'Oct W1', p: 1.78 }, { d: 'Oct W2', p: 1.71 }, { d: 'Oct W3', p: 1.65 }, { d: 'Oct W4', p: 1.58 },
      { d: 'Nov W1', p: 1.54 }, { d: 'Nov W2', p: 1.49 }, { d: 'Nov W3', p: 1.44 }, { d: 'Nov W4', p: 1.41 },
      { d: 'Dec W1', p: 1.38 }, { d: 'Dec W2', p: 1.34 }, { d: 'Dec W3', p: 1.30 }, { d: 'Dec W4', p: 1.27 },
      { d: 'Jan W1', p: 1.23 }, { d: 'Jan W2', p: 1.18 }, { d: 'Jan W3', p: 1.14 }, { d: 'Jan W4', p: 1.09 },
      { d: 'Feb W1', p: 1.04 }, { d: 'Feb W2', p: 0.99 }, { d: 'Feb W3', p: 0.95 }, { d: 'Feb W4', p: 0.91 },
      { d: 'Mar W1', p: 0.88 }, { d: 'Mar W2', p: 0.84 }, { d: 'Mar W3', p: 0.79 }, { d: 'Mar W4', p: 0.82 },
      { d: 'Mar W5', p: 0.83 },
    ],
    '3M': [
      { d: 'W1', p: 1.14 }, { d: 'W2', p: 1.09 }, { d: 'W3', p: 1.06 },
      { d: 'W4', p: 1.03 }, { d: 'W5', p: 0.99 }, { d: 'W6', p: 0.95 },
      { d: 'W7', p: 0.92 }, { d: 'W8', p: 0.88 }, { d: 'W9', p: 0.84 },
      { d: 'W10', p: 0.87 }, { d: 'W11', p: 0.85 }, { d: 'W12', p: 0.82 },
      { d: 'W13', p: 0.83 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.98 }, { d: 'Mar 4', p: 0.96 }, { d: 'Mar 5', p: 0.94 }, { d: 'Mar 6', p: 0.97 },
      { d: 'Mar 7', p: 0.93 }, { d: 'Mar 10', p: 0.91 }, { d: 'Mar 11', p: 0.89 }, { d: 'Mar 12', p: 0.87 },
      { d: 'Mar 13', p: 0.90 }, { d: 'Mar 14', p: 0.88 }, { d: 'Mar 17', p: 0.86 }, { d: 'Mar 18', p: 0.84 },
      { d: 'Mar 19', p: 0.87 }, { d: 'Mar 20', p: 0.85 }, { d: 'Mar 21', p: 0.83 }, { d: 'Mar 24', p: 0.81 },
      { d: 'Mar 25', p: 0.80 }, { d: 'Mar 26', p: 0.82 }, { d: 'Mar 27', p: 0.84 }, { d: 'Mar 28', p: 0.83 },
    ],
    '1W': [
      { d: 'Mon', p: 0.81 }, { d: 'Tue', p: 0.79 }, { d: 'Wed', p: 0.82 },
      { d: 'Thu', p: 0.84 }, { d: 'Fri', p: 0.83 },
    ],
  },

  GAME: {
    '1Y': [
      { d: 'Apr', p: 2.95 }, { d: 'May', p: 2.61 }, { d: 'Jun', p: 2.24 },
      { d: 'Jul', p: 1.87 }, { d: 'Aug', p: 1.53 }, { d: 'Sep', p: 1.21 },
      { d: 'Oct', p: 0.92 }, { d: 'Nov', p: 0.74 }, { d: 'Dec', p: 0.56 },
      { d: 'Jan', p: 0.43 }, { d: 'Feb', p: 0.35 }, { d: 'Mar', p: 0.29 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.92 }, { d: 'Oct W2', p: 0.87 }, { d: 'Oct W3', p: 0.83 }, { d: 'Oct W4', p: 0.79 },
      { d: 'Nov W1', p: 0.74 }, { d: 'Nov W2', p: 0.70 }, { d: 'Nov W3', p: 0.66 }, { d: 'Nov W4', p: 0.63 },
      { d: 'Dec W1', p: 0.60 }, { d: 'Dec W2', p: 0.56 }, { d: 'Dec W3', p: 0.53 }, { d: 'Dec W4', p: 0.51 },
      { d: 'Jan W1', p: 0.48 }, { d: 'Jan W2', p: 0.46 }, { d: 'Jan W3', p: 0.44 }, { d: 'Jan W4', p: 0.43 },
      { d: 'Feb W1', p: 0.41 }, { d: 'Feb W2', p: 0.39 }, { d: 'Feb W3', p: 0.37 }, { d: 'Feb W4', p: 0.35 },
      { d: 'Mar W1', p: 0.33 }, { d: 'Mar W2', p: 0.31 }, { d: 'Mar W3', p: 0.29 }, { d: 'Mar W4', p: 0.27 },
      { d: 'Mar W5', p: 0.29 },
    ],
    '3M': [
      { d: 'W1', p: 0.51 }, { d: 'W2', p: 0.48 }, { d: 'W3', p: 0.46 },
      { d: 'W4', p: 0.44 }, { d: 'W5', p: 0.42 }, { d: 'W6', p: 0.40 },
      { d: 'W7', p: 0.38 }, { d: 'W8', p: 0.36 }, { d: 'W9', p: 0.34 },
      { d: 'W10', p: 0.32 }, { d: 'W11', p: 0.30 }, { d: 'W12', p: 0.27 },
      { d: 'W13', p: 0.29 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.36 }, { d: 'Mar 4', p: 0.35 }, { d: 'Mar 5', p: 0.34 }, { d: 'Mar 6', p: 0.33 },
      { d: 'Mar 7', p: 0.35 }, { d: 'Mar 10', p: 0.34 }, { d: 'Mar 11', p: 0.32 }, { d: 'Mar 12', p: 0.31 },
      { d: 'Mar 13', p: 0.30 }, { d: 'Mar 14', p: 0.32 }, { d: 'Mar 17', p: 0.31 }, { d: 'Mar 18', p: 0.30 },
      { d: 'Mar 19', p: 0.29 }, { d: 'Mar 20', p: 0.28 }, { d: 'Mar 21', p: 0.30 }, { d: 'Mar 24', p: 0.29 },
      { d: 'Mar 25', p: 0.27 }, { d: 'Mar 26', p: 0.28 }, { d: 'Mar 27', p: 0.30 }, { d: 'Mar 28', p: 0.29 },
    ],
    '1W': [
      { d: 'Mon', p: 0.29 }, { d: 'Tue', p: 0.27 }, { d: 'Wed', p: 0.28 },
      { d: 'Thu', p: 0.30 }, { d: 'Fri', p: 0.29 },
    ],
  },

  FFIE: {
    '1Y': [
      { d: 'Apr', p: 3.87 }, { d: 'May', p: 2.94 }, { d: 'Jun', p: 2.15 },
      { d: 'Jul', p: 1.68 }, { d: 'Aug', p: 2.11 }, { d: 'Sep', p: 1.54 },
      { d: 'Oct', p: 1.11 }, { d: 'Nov', p: 0.78 }, { d: 'Dec', p: 0.52 },
      { d: 'Jan', p: 0.61 }, { d: 'Feb', p: 0.45 }, { d: 'Mar', p: 0.35 },
    ],
    '6M': [
      { d: 'Oct W1', p: 1.11 }, { d: 'Oct W2', p: 1.04 }, { d: 'Oct W3', p: 0.97 }, { d: 'Oct W4', p: 0.91 },
      { d: 'Nov W1', p: 0.85 }, { d: 'Nov W2', p: 0.81 }, { d: 'Nov W3', p: 0.78 }, { d: 'Nov W4', p: 0.73 },
      { d: 'Dec W1', p: 0.67 }, { d: 'Dec W2', p: 0.62 }, { d: 'Dec W3', p: 0.57 }, { d: 'Dec W4', p: 0.52 },
      { d: 'Jan W1', p: 0.58 }, { d: 'Jan W2', p: 0.63 }, { d: 'Jan W3', p: 0.61 }, { d: 'Jan W4', p: 0.57 },
      { d: 'Feb W1', p: 0.53 }, { d: 'Feb W2', p: 0.49 }, { d: 'Feb W3', p: 0.46 }, { d: 'Feb W4', p: 0.44 },
      { d: 'Mar W1', p: 0.42 }, { d: 'Mar W2', p: 0.40 }, { d: 'Mar W3', p: 0.37 }, { d: 'Mar W4', p: 0.34 },
      { d: 'Mar W5', p: 0.35 },
    ],
    '3M': [
      { d: 'W1', p: 0.63 }, { d: 'W2', p: 0.61 }, { d: 'W3', p: 0.58 },
      { d: 'W4', p: 0.57 }, { d: 'W5', p: 0.53 }, { d: 'W6', p: 0.51 },
      { d: 'W7', p: 0.48 }, { d: 'W8', p: 0.45 }, { d: 'W9', p: 0.43 },
      { d: 'W10', p: 0.40 }, { d: 'W11', p: 0.38 }, { d: 'W12', p: 0.34 },
      { d: 'W13', p: 0.35 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.44 }, { d: 'Mar 4', p: 0.46 }, { d: 'Mar 5', p: 0.43 }, { d: 'Mar 6', p: 0.41 },
      { d: 'Mar 7', p: 0.44 }, { d: 'Mar 10', p: 0.42 }, { d: 'Mar 11', p: 0.40 }, { d: 'Mar 12', p: 0.39 },
      { d: 'Mar 13', p: 0.37 }, { d: 'Mar 14', p: 0.39 }, { d: 'Mar 17', p: 0.38 }, { d: 'Mar 18', p: 0.36 },
      { d: 'Mar 19', p: 0.35 }, { d: 'Mar 20', p: 0.37 }, { d: 'Mar 21', p: 0.36 }, { d: 'Mar 24', p: 0.34 },
      { d: 'Mar 25', p: 0.33 }, { d: 'Mar 26', p: 0.35 }, { d: 'Mar 27', p: 0.36 }, { d: 'Mar 28', p: 0.35 },
    ],
    '1W': [
      { d: 'Mon', p: 0.34 }, { d: 'Tue', p: 0.33 }, { d: 'Wed', p: 0.35 },
      { d: 'Thu', p: 0.36 }, { d: 'Fri', p: 0.35 },
    ],
  },

  ALXO: {
    '1Y': [
      { d: 'Apr', p: 5.23 }, { d: 'May', p: 4.87 }, { d: 'Jun', p: 4.12 },
      { d: 'Jul', p: 3.54 }, { d: 'Aug', p: 2.89 }, { d: 'Sep', p: 2.21 },
      { d: 'Oct', p: 1.68 }, { d: 'Nov', p: 1.48 }, { d: 'Dec', p: 1.27 },
      { d: 'Jan', p: 1.14 }, { d: 'Feb', p: 1.03 }, { d: 'Mar', p: 0.96 },
    ],
    '6M': [
      { d: 'Oct W1', p: 1.68 }, { d: 'Oct W2', p: 1.62 }, { d: 'Oct W3', p: 1.57 }, { d: 'Oct W4', p: 1.52 },
      { d: 'Nov W1', p: 1.48 }, { d: 'Nov W2', p: 1.45 }, { d: 'Nov W3', p: 1.42 }, { d: 'Nov W4', p: 1.39 },
      { d: 'Dec W1', p: 1.35 }, { d: 'Dec W2', p: 1.31 }, { d: 'Dec W3', p: 1.28 }, { d: 'Dec W4', p: 1.27 },
      { d: 'Jan W1', p: 1.24 }, { d: 'Jan W2', p: 1.20 }, { d: 'Jan W3', p: 1.17 }, { d: 'Jan W4', p: 1.14 },
      { d: 'Feb W1', p: 1.10 }, { d: 'Feb W2', p: 1.07 }, { d: 'Feb W3', p: 1.04 }, { d: 'Feb W4', p: 1.01 },
      { d: 'Mar W1', p: 0.98 }, { d: 'Mar W2', p: 0.96 }, { d: 'Mar W3', p: 0.93 }, { d: 'Mar W4', p: 0.94 },
      { d: 'Mar W5', p: 0.96 },
    ],
    '3M': [
      { d: 'W1', p: 1.14 }, { d: 'W2', p: 1.11 }, { d: 'W3', p: 1.09 },
      { d: 'W4', p: 1.07 }, { d: 'W5', p: 1.04 }, { d: 'W6', p: 1.02 },
      { d: 'W7', p: 1.00 }, { d: 'W8', p: 0.98 }, { d: 'W9', p: 0.95 },
      { d: 'W10', p: 0.93 }, { d: 'W11', p: 0.94 }, { d: 'W12', p: 0.93 },
      { d: 'W13', p: 0.96 },
    ],
    '1M': [
      { d: 'Mar 3', p: 1.03 }, { d: 'Mar 4', p: 1.01 }, { d: 'Mar 5', p: 0.99 }, { d: 'Mar 6', p: 1.02 },
      { d: 'Mar 7', p: 1.00 }, { d: 'Mar 10', p: 0.98 }, { d: 'Mar 11', p: 0.97 }, { d: 'Mar 12', p: 0.96 },
      { d: 'Mar 13', p: 0.94 }, { d: 'Mar 14', p: 0.95 }, { d: 'Mar 17', p: 0.93 }, { d: 'Mar 18', p: 0.94 },
      { d: 'Mar 19', p: 0.96 }, { d: 'Mar 20', p: 0.95 }, { d: 'Mar 21', p: 0.93 }, { d: 'Mar 24', p: 0.94 },
      { d: 'Mar 25', p: 0.95 }, { d: 'Mar 26', p: 0.97 }, { d: 'Mar 27', p: 0.95 }, { d: 'Mar 28', p: 0.96 },
    ],
    '1W': [
      { d: 'Mon', p: 0.94 }, { d: 'Tue', p: 0.95 }, { d: 'Wed', p: 0.97 },
      { d: 'Thu', p: 0.95 }, { d: 'Fri', p: 0.96 },
    ],
  },
};

export type EventType = 'compliance' | 'volume' | 'management' | 'price';

export interface StockEvent {
  d: string;
  message: string;
  type: EventType;
}

export const stockEvents: Record<string, Record<Period, StockEvent[]>> = {
  TELA: {
    '1Y': [
      { d: 'Oct', message: 'NASDAQ compliance notice received', type: 'compliance' },
      { d: 'Dec', message: 'Price crossed below $1 for the first time', type: 'price' },
      { d: 'Feb', message: 'Capital access still open — secondary filing registered', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W2', message: 'Compliance notice officially filed', type: 'compliance' },
      { d: 'Dec W2', message: 'Broke through $1.25 support level', type: 'price' },
      { d: 'Feb W3', message: 'Volume spike 2.1× average — possible accumulation', type: 'volume' },
      { d: 'Mar W3', message: 'Support band established near $0.79', type: 'price' },
    ],
    '3M': [
      { d: 'W4', message: 'Price crossed below $1 compliance threshold', type: 'compliance' },
      { d: 'W8', message: 'Volume expansion 1.8× — short-term bounce attempt', type: 'volume' },
      { d: 'W9', message: 'Support band held at $0.84', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 12', message: 'Volume spike 1.6× average', type: 'volume' },
      { d: 'Mar 20', message: 'Management filed Form 4 — insider buy', type: 'management' },
      { d: 'Mar 21', message: 'Support held at $0.83, tightest range in weeks', type: 'price' },
    ],
    '1W': [
      { d: 'Tue', message: 'Intraday low of $0.79 tested and held', type: 'price' },
      { d: 'Thu', message: 'Recovery attempt to $0.84, +6% intraday', type: 'price' },
    ],
  },

  GAME: {
    '1Y': [
      { d: 'Sep', message: 'NASDAQ compliance notice — 180-day cure window granted', type: 'compliance' },
      { d: 'Nov', message: 'Extension request filed before initial deadline', type: 'compliance' },
      { d: 'Jan', message: 'Extension window expires — hearing scheduled', type: 'compliance' },
    ],
    '6M': [
      { d: 'Oct W3', message: 'Formal extension request filed with NASDAQ', type: 'compliance' },
      { d: 'Dec W3', message: 'Stock fell below $0.50 for the first time', type: 'price' },
      { d: 'Feb W2', message: 'Volume dropped to 6-month low — illiquidity concern', type: 'volume' },
      { d: 'Mar W3', message: 'Failed to reclaim $0.30 support on two attempts', type: 'price' },
    ],
    '3M': [
      { d: 'W2', message: 'Volume collapse — average daily volume fell 60%', type: 'volume' },
      { d: 'W7', message: 'SEC 8-K filing on compliance status submitted', type: 'compliance' },
      { d: 'W10', message: 'Failed to hold $0.30 support level', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 7', message: 'Brief bounce to $0.35, faded within same session', type: 'price' },
      { d: 'Mar 21', message: 'SEC 8-K compliance status update filed', type: 'compliance' },
      { d: 'Mar 25', message: 'Failed attempt to reclaim $0.30', type: 'price' },
    ],
    '1W': [
      { d: 'Mon', message: 'Opened near 52-week low, minimal buying interest', type: 'price' },
      { d: 'Thu', message: 'Volume spike 1.4× — faded by close', type: 'volume' },
    ],
  },

  FFIE: {
    '1Y': [
      { d: 'Aug', message: 'Short squeeze event — +38% intraday before reversal', type: 'volume' },
      { d: 'Oct', message: 'NASDAQ compliance notice received', type: 'compliance' },
      { d: 'Jan', message: 'Capital raise announced — 40M shares at $0.45', type: 'management' },
    ],
    '6M': [
      { d: 'Jan W1', message: 'Capital raise completed — $18M raised at $0.45, volume 5×', type: 'management' },
      { d: 'Jan W2', message: 'Post-raise drift begins as dilution weighs on price', type: 'price' },
      { d: 'Mar W2', message: 'CEO buyback pledge announced — no timeline given', type: 'management' },
    ],
    '3M': [
      { d: 'W3', message: 'Capital raise closes — $18M raised, compliance attempt likely', type: 'management' },
      { d: 'W6', message: 'Volume spike 2.2× — speculative interest', type: 'volume' },
      { d: 'W9', message: 'Failed to hold $0.43 support', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 4', message: 'Volume 2.8× average — speculative intraday spike', type: 'volume' },
      { d: 'Mar 19', message: 'New monthly low of $0.35 set', type: 'price' },
      { d: 'Mar 26', message: 'Volume 2.5× average — short covering observed', type: 'volume' },
    ],
    '1W': [
      { d: 'Tue', message: 'Intraday low of $0.32 tested and held', type: 'price' },
      { d: 'Wed', message: 'Volume expanded 2.5×, short covering activity', type: 'volume' },
    ],
  },

  ALXO: {
    '1Y': [
      { d: 'Jun', message: 'Phase 2 pipeline data disappoints — stock -28% in session', type: 'management' },
      { d: 'Oct', message: 'NASDAQ compliance notice received', type: 'compliance' },
      { d: 'Feb', message: 'Management insider purchase — $150K at open market', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W4', message: 'Compliance notice formally filed with NASDAQ', type: 'compliance' },
      { d: 'Feb W2', message: 'Insider purchase of $150K signals management confidence', type: 'management' },
      { d: 'Mar W2', message: 'Price approaching $1 compliance line from below', type: 'price' },
      { d: 'Mar W4', message: 'Held above $0.94 for 5 consecutive sessions', type: 'price' },
    ],
    '3M': [
      { d: 'W7', message: 'Price crossed below $1 compliance line', type: 'compliance' },
      { d: 'W11', message: 'Insider buy event stabilizes price — support at $0.93', type: 'management' },
      { d: 'W13', message: 'Within 4% of $1 recovery threshold', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 6', message: 'Held above $1.00 for 2 consecutive days before fade', type: 'price' },
      { d: 'Mar 19', message: 'Volume 1.9× average — possible catalyst or accumulation', type: 'volume' },
      { d: 'Mar 28', message: 'Tightest daily range in 3 weeks — coiling behavior', type: 'price' },
    ],
    '1W': [
      { d: 'Wed', message: 'Volume above average — compliance optimism building', type: 'volume' },
      { d: 'Fri', message: 'Closed near weekly high — constructive action', type: 'price' },
    ],
  },
};

export const eventTypeConfig: Record<EventType, { color: string; stroke: string; label: string; bg: string; text: string; border: string }> = {
  compliance: { color: '#f59e0b', stroke: '#f59e0b', label: 'Compliance', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  volume:     { color: '#3b82f6', stroke: '#3b82f6', label: 'Volume',     bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200'  },
  management: { color: '#8b5cf6', stroke: '#8b5cf6', label: 'Management', bg: 'bg-violet-50',text: 'text-violet-700',border: 'border-violet-200'},
  price:      { color: '#ef4444', stroke: '#ef4444', label: 'Price',      bg: 'bg-rose-50',  text: 'text-rose-700',  border: 'border-rose-200'  },
};

export const PERIODS: { label: string; value: Period }[] = [
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
];

export const periodDescriptions: Record<Period, string> = {
  '1W': 'Last 5 trading days',
  '1M': 'Last 22 trading days',
  '3M': 'Last 13 weeks',
  '6M': 'Last 26 weeks',
  '1Y': 'Last 12 months',
};
