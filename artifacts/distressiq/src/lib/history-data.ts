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

  FFAI: {
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
