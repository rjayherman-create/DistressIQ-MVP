export type Period = '1W' | '1M' | '3M' | '6M' | '1Y';

export type PricePoint = { d: string; p: number };

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
      { d: 'W8', message: 'Volume spike 1.8× average — possible accumulation', type: 'volume' },
      { d: 'W11', message: 'Support band near $0.79 holds for second week', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 6', message: 'Volume 1.7× average — buying interest near $0.82', type: 'volume' },
      { d: 'Mar 19', message: 'Support held near $0.79 for three sessions', type: 'price' },
    ],
    '1W': [
      { d: 'Tue', message: 'Brief intraday dip to $0.79 support — recovered', type: 'price' },
    ],
  },

  GAME: {
    '1Y': [
      { d: 'Jul', message: 'NASDAQ compliance notice received', type: 'compliance' },
      { d: 'Sep', message: 'Reverse split 1:10 executed to regain compliance', type: 'management' },
      { d: 'Nov', message: 'Second compliance breach — extension period active', type: 'compliance' },
    ],
    '6M': [
      { d: 'Nov W1', message: 'Extension window entered — 180 days remaining', type: 'compliance' },
      { d: 'Jan W3', message: 'Capital raise attempt announced — delayed', type: 'management' },
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

  FFAI: {
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
