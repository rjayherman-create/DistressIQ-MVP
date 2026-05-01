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

  MULN: {
    '1Y': [
      { d: 'Apr', p: 0.41 }, { d: 'May', p: 0.35 }, { d: 'Jun', p: 0.28 },
      { d: 'Jul', p: 0.23 }, { d: 'Aug', p: 0.19 }, { d: 'Sep', p: 0.15 },
      { d: 'Oct', p: 0.12 }, { d: 'Nov', p: 0.10 }, { d: 'Dec', p: 0.09 },
      { d: 'Jan', p: 0.11 }, { d: 'Feb', p: 0.10 }, { d: 'Mar', p: 0.09 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.12 }, { d: 'Oct W2', p: 0.11 }, { d: 'Oct W3', p: 0.11 }, { d: 'Oct W4', p: 0.10 },
      { d: 'Nov W1', p: 0.10 }, { d: 'Nov W2', p: 0.10 }, { d: 'Nov W3', p: 0.09 }, { d: 'Nov W4', p: 0.09 },
      { d: 'Dec W1', p: 0.09 }, { d: 'Dec W2', p: 0.09 }, { d: 'Dec W3', p: 0.08 }, { d: 'Dec W4', p: 0.09 },
      { d: 'Jan W1', p: 0.11 }, { d: 'Jan W2', p: 0.12 }, { d: 'Jan W3', p: 0.11 }, { d: 'Jan W4', p: 0.10 },
      { d: 'Feb W1', p: 0.10 }, { d: 'Feb W2', p: 0.10 }, { d: 'Feb W3', p: 0.09 }, { d: 'Feb W4', p: 0.09 },
      { d: 'Mar W1', p: 0.09 }, { d: 'Mar W2', p: 0.09 }, { d: 'Mar W3', p: 0.08 }, { d: 'Mar W4', p: 0.09 },
      { d: 'Mar W5', p: 0.09 },
    ],
    '3M': [
      { d: 'W1', p: 0.11 }, { d: 'W2', p: 0.11 }, { d: 'W3', p: 0.10 },
      { d: 'W4', p: 0.10 }, { d: 'W5', p: 0.10 }, { d: 'W6', p: 0.09 },
      { d: 'W7', p: 0.09 }, { d: 'W8', p: 0.09 }, { d: 'W9', p: 0.08 },
      { d: 'W10', p: 0.09 }, { d: 'W11', p: 0.09 }, { d: 'W12', p: 0.09 },
      { d: 'W13', p: 0.09 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.10 }, { d: 'Mar 4', p: 0.10 }, { d: 'Mar 5', p: 0.09 }, { d: 'Mar 6', p: 0.09 },
      { d: 'Mar 7', p: 0.09 }, { d: 'Mar 10', p: 0.09 }, { d: 'Mar 11', p: 0.09 }, { d: 'Mar 12', p: 0.08 },
      { d: 'Mar 13', p: 0.09 }, { d: 'Mar 14', p: 0.09 }, { d: 'Mar 17', p: 0.09 }, { d: 'Mar 18', p: 0.09 },
      { d: 'Mar 19', p: 0.09 }, { d: 'Mar 20', p: 0.09 }, { d: 'Mar 21', p: 0.08 }, { d: 'Mar 24', p: 0.08 },
      { d: 'Mar 25', p: 0.09 }, { d: 'Mar 26', p: 0.09 }, { d: 'Mar 27', p: 0.09 }, { d: 'Mar 28', p: 0.09 },
    ],
    '1W': [
      { d: 'Mon', p: 0.09 }, { d: 'Tue', p: 0.08 }, { d: 'Wed', p: 0.09 },
      { d: 'Thu', p: 0.09 }, { d: 'Fri', p: 0.09 },
    ],
  },

  NKLA: {
    '1Y': [
      { d: 'Apr', p: 1.18 }, { d: 'May', p: 1.04 }, { d: 'Jun', p: 0.92 },
      { d: 'Jul', p: 0.80 }, { d: 'Aug', p: 0.71 }, { d: 'Sep', p: 0.62 },
      { d: 'Oct', p: 0.56 }, { d: 'Nov', p: 0.51 }, { d: 'Dec', p: 0.48 },
      { d: 'Jan', p: 0.46 }, { d: 'Feb', p: 0.45 }, { d: 'Mar', p: 0.44 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.56 }, { d: 'Oct W2', p: 0.55 }, { d: 'Oct W3', p: 0.54 }, { d: 'Oct W4', p: 0.53 },
      { d: 'Nov W1', p: 0.52 }, { d: 'Nov W2', p: 0.52 }, { d: 'Nov W3', p: 0.51 }, { d: 'Nov W4', p: 0.50 },
      { d: 'Dec W1', p: 0.50 }, { d: 'Dec W2', p: 0.49 }, { d: 'Dec W3', p: 0.49 }, { d: 'Dec W4', p: 0.48 },
      { d: 'Jan W1', p: 0.48 }, { d: 'Jan W2', p: 0.47 }, { d: 'Jan W3', p: 0.47 }, { d: 'Jan W4', p: 0.46 },
      { d: 'Feb W1', p: 0.46 }, { d: 'Feb W2', p: 0.46 }, { d: 'Feb W3', p: 0.45 }, { d: 'Feb W4', p: 0.45 },
      { d: 'Mar W1', p: 0.45 }, { d: 'Mar W2', p: 0.44 }, { d: 'Mar W3', p: 0.44 }, { d: 'Mar W4', p: 0.43 },
      { d: 'Mar W5', p: 0.44 },
    ],
    '3M': [
      { d: 'W1', p: 0.47 }, { d: 'W2', p: 0.47 }, { d: 'W3', p: 0.47 },
      { d: 'W4', p: 0.46 }, { d: 'W5', p: 0.46 }, { d: 'W6', p: 0.46 },
      { d: 'W7', p: 0.45 }, { d: 'W8', p: 0.45 }, { d: 'W9', p: 0.45 },
      { d: 'W10', p: 0.44 }, { d: 'W11', p: 0.44 }, { d: 'W12', p: 0.43 },
      { d: 'W13', p: 0.44 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.46 }, { d: 'Mar 4', p: 0.46 }, { d: 'Mar 5', p: 0.45 }, { d: 'Mar 6', p: 0.45 },
      { d: 'Mar 7', p: 0.45 }, { d: 'Mar 10', p: 0.45 }, { d: 'Mar 11', p: 0.45 }, { d: 'Mar 12', p: 0.44 },
      { d: 'Mar 13', p: 0.44 }, { d: 'Mar 14', p: 0.45 }, { d: 'Mar 17', p: 0.44 }, { d: 'Mar 18', p: 0.44 },
      { d: 'Mar 19', p: 0.44 }, { d: 'Mar 20', p: 0.43 }, { d: 'Mar 21', p: 0.43 }, { d: 'Mar 24', p: 0.43 },
      { d: 'Mar 25', p: 0.44 }, { d: 'Mar 26', p: 0.44 }, { d: 'Mar 27', p: 0.44 }, { d: 'Mar 28', p: 0.44 },
    ],
    '1W': [
      { d: 'Mon', p: 0.44 }, { d: 'Tue', p: 0.43 }, { d: 'Wed', p: 0.44 },
      { d: 'Thu', p: 0.45 }, { d: 'Fri', p: 0.44 },
    ],
  },

  AEYE: {
    '1Y': [
      { d: 'Apr', p: 1.37 }, { d: 'May', p: 1.26 }, { d: 'Jun', p: 1.18 },
      { d: 'Jul', p: 1.10 }, { d: 'Aug', p: 1.04 }, { d: 'Sep', p: 0.99 },
      { d: 'Oct', p: 0.95 }, { d: 'Nov', p: 0.91 }, { d: 'Dec', p: 0.87 },
      { d: 'Jan', p: 0.84 }, { d: 'Feb', p: 0.82 }, { d: 'Mar', p: 0.81 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.95 }, { d: 'Oct W2', p: 0.94 }, { d: 'Oct W3', p: 0.93 }, { d: 'Oct W4', p: 0.92 },
      { d: 'Nov W1', p: 0.91 }, { d: 'Nov W2', p: 0.91 }, { d: 'Nov W3', p: 0.90 }, { d: 'Nov W4', p: 0.89 },
      { d: 'Dec W1', p: 0.89 }, { d: 'Dec W2', p: 0.88 }, { d: 'Dec W3', p: 0.88 }, { d: 'Dec W4', p: 0.87 },
      { d: 'Jan W1', p: 0.86 }, { d: 'Jan W2', p: 0.86 }, { d: 'Jan W3', p: 0.85 }, { d: 'Jan W4', p: 0.84 },
      { d: 'Feb W1', p: 0.84 }, { d: 'Feb W2', p: 0.83 }, { d: 'Feb W3', p: 0.83 }, { d: 'Feb W4', p: 0.82 },
      { d: 'Mar W1', p: 0.82 }, { d: 'Mar W2', p: 0.81 }, { d: 'Mar W3', p: 0.80 }, { d: 'Mar W4', p: 0.81 },
      { d: 'Mar W5', p: 0.81 },
    ],
    '3M': [
      { d: 'W1', p: 0.85 }, { d: 'W2', p: 0.84 }, { d: 'W3', p: 0.84 },
      { d: 'W4', p: 0.84 }, { d: 'W5', p: 0.83 }, { d: 'W6', p: 0.83 },
      { d: 'W7', p: 0.82 }, { d: 'W8', p: 0.82 }, { d: 'W9', p: 0.81 },
      { d: 'W10', p: 0.81 }, { d: 'W11', p: 0.80 }, { d: 'W12', p: 0.81 },
      { d: 'W13', p: 0.81 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.83 }, { d: 'Mar 4', p: 0.82 }, { d: 'Mar 5', p: 0.82 }, { d: 'Mar 6', p: 0.83 },
      { d: 'Mar 7', p: 0.82 }, { d: 'Mar 10', p: 0.82 }, { d: 'Mar 11', p: 0.81 }, { d: 'Mar 12', p: 0.81 },
      { d: 'Mar 13', p: 0.81 }, { d: 'Mar 14', p: 0.82 }, { d: 'Mar 17', p: 0.81 }, { d: 'Mar 18', p: 0.80 },
      { d: 'Mar 19', p: 0.80 }, { d: 'Mar 20', p: 0.81 }, { d: 'Mar 21', p: 0.80 }, { d: 'Mar 24', p: 0.80 },
      { d: 'Mar 25', p: 0.80 }, { d: 'Mar 26', p: 0.81 }, { d: 'Mar 27', p: 0.81 }, { d: 'Mar 28', p: 0.81 },
    ],
    '1W': [
      { d: 'Mon', p: 0.80 }, { d: 'Tue', p: 0.80 }, { d: 'Wed', p: 0.81 },
      { d: 'Thu', p: 0.81 }, { d: 'Fri', p: 0.81 },
    ],
  },

  NRSN: {
    '1Y': [
      { d: 'Apr', p: 1.28 }, { d: 'May', p: 1.16 }, { d: 'Jun', p: 1.07 },
      { d: 'Jul', p: 0.99 }, { d: 'Aug', p: 0.93 }, { d: 'Sep', p: 0.87 },
      { d: 'Oct', p: 0.83 }, { d: 'Nov', p: 0.80 }, { d: 'Dec', p: 0.77 },
      { d: 'Jan', p: 0.75 }, { d: 'Feb', p: 0.73 }, { d: 'Mar', p: 0.71 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.83 }, { d: 'Oct W2', p: 0.82 }, { d: 'Oct W3', p: 0.82 }, { d: 'Oct W4', p: 0.81 },
      { d: 'Nov W1', p: 0.80 }, { d: 'Nov W2', p: 0.80 }, { d: 'Nov W3', p: 0.79 }, { d: 'Nov W4', p: 0.79 },
      { d: 'Dec W1', p: 0.78 }, { d: 'Dec W2', p: 0.78 }, { d: 'Dec W3', p: 0.77 }, { d: 'Dec W4', p: 0.77 },
      { d: 'Jan W1', p: 0.76 }, { d: 'Jan W2', p: 0.76 }, { d: 'Jan W3', p: 0.75 }, { d: 'Jan W4', p: 0.75 },
      { d: 'Feb W1', p: 0.74 }, { d: 'Feb W2', p: 0.74 }, { d: 'Feb W3', p: 0.73 }, { d: 'Feb W4', p: 0.73 },
      { d: 'Mar W1', p: 0.72 }, { d: 'Mar W2', p: 0.72 }, { d: 'Mar W3', p: 0.71 }, { d: 'Mar W4', p: 0.71 },
      { d: 'Mar W5', p: 0.71 },
    ],
    '3M': [
      { d: 'W1', p: 0.75 }, { d: 'W2', p: 0.75 }, { d: 'W3', p: 0.74 },
      { d: 'W4', p: 0.74 }, { d: 'W5', p: 0.74 }, { d: 'W6', p: 0.73 },
      { d: 'W7', p: 0.73 }, { d: 'W8', p: 0.72 }, { d: 'W9', p: 0.72 },
      { d: 'W10', p: 0.72 }, { d: 'W11', p: 0.71 }, { d: 'W12', p: 0.71 },
      { d: 'W13', p: 0.71 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.73 }, { d: 'Mar 4', p: 0.73 }, { d: 'Mar 5', p: 0.73 }, { d: 'Mar 6', p: 0.72 },
      { d: 'Mar 7', p: 0.72 }, { d: 'Mar 10', p: 0.72 }, { d: 'Mar 11', p: 0.72 }, { d: 'Mar 12', p: 0.71 },
      { d: 'Mar 13', p: 0.72 }, { d: 'Mar 14', p: 0.72 }, { d: 'Mar 17', p: 0.71 }, { d: 'Mar 18', p: 0.71 },
      { d: 'Mar 19', p: 0.72 }, { d: 'Mar 20', p: 0.71 }, { d: 'Mar 21', p: 0.71 }, { d: 'Mar 24', p: 0.71 },
      { d: 'Mar 25', p: 0.71 }, { d: 'Mar 26', p: 0.71 }, { d: 'Mar 27', p: 0.71 }, { d: 'Mar 28', p: 0.71 },
    ],
    '1W': [
      { d: 'Mon', p: 0.71 }, { d: 'Tue', p: 0.70 }, { d: 'Wed', p: 0.71 },
      { d: 'Thu', p: 0.71 }, { d: 'Fri', p: 0.71 },
    ],
  },

  BNGO: {
    '1Y': [
      { d: 'Apr', p: 1.02 }, { d: 'May', p: 0.83 }, { d: 'Jun', p: 0.68 },
      { d: 'Jul', p: 0.56 }, { d: 'Aug', p: 0.47 }, { d: 'Sep', p: 0.41 },
      { d: 'Oct', p: 0.37 }, { d: 'Nov', p: 0.34 }, { d: 'Dec', p: 0.31 },
      { d: 'Jan', p: 0.33 }, { d: 'Feb', p: 0.32 }, { d: 'Mar', p: 0.31 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.37 }, { d: 'Oct W2', p: 0.36 }, { d: 'Oct W3', p: 0.36 }, { d: 'Oct W4', p: 0.35 },
      { d: 'Nov W1', p: 0.34 }, { d: 'Nov W2', p: 0.34 }, { d: 'Nov W3', p: 0.34 }, { d: 'Nov W4', p: 0.33 },
      { d: 'Dec W1', p: 0.33 }, { d: 'Dec W2', p: 0.32 }, { d: 'Dec W3', p: 0.31 }, { d: 'Dec W4', p: 0.31 },
      { d: 'Jan W1', p: 0.33 }, { d: 'Jan W2', p: 0.34 }, { d: 'Jan W3', p: 0.33 }, { d: 'Jan W4', p: 0.32 },
      { d: 'Feb W1', p: 0.32 }, { d: 'Feb W2', p: 0.32 }, { d: 'Feb W3', p: 0.31 }, { d: 'Feb W4', p: 0.31 },
      { d: 'Mar W1', p: 0.31 }, { d: 'Mar W2', p: 0.30 }, { d: 'Mar W3', p: 0.29 }, { d: 'Mar W4', p: 0.30 },
      { d: 'Mar W5', p: 0.31 },
    ],
    '3M': [
      { d: 'W1', p: 0.33 }, { d: 'W2', p: 0.33 }, { d: 'W3', p: 0.32 },
      { d: 'W4', p: 0.32 }, { d: 'W5', p: 0.32 }, { d: 'W6', p: 0.31 },
      { d: 'W7', p: 0.31 }, { d: 'W8', p: 0.30 }, { d: 'W9', p: 0.30 },
      { d: 'W10', p: 0.30 }, { d: 'W11', p: 0.29 }, { d: 'W12', p: 0.30 },
      { d: 'W13', p: 0.31 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.32 }, { d: 'Mar 4', p: 0.32 }, { d: 'Mar 5', p: 0.31 }, { d: 'Mar 6', p: 0.31 },
      { d: 'Mar 7', p: 0.31 }, { d: 'Mar 10', p: 0.31 }, { d: 'Mar 11', p: 0.30 }, { d: 'Mar 12', p: 0.30 },
      { d: 'Mar 13', p: 0.31 }, { d: 'Mar 14', p: 0.31 }, { d: 'Mar 17', p: 0.30 }, { d: 'Mar 18', p: 0.30 },
      { d: 'Mar 19', p: 0.30 }, { d: 'Mar 20', p: 0.29 }, { d: 'Mar 21', p: 0.29 }, { d: 'Mar 24', p: 0.29 },
      { d: 'Mar 25', p: 0.30 }, { d: 'Mar 26', p: 0.30 }, { d: 'Mar 27', p: 0.31 }, { d: 'Mar 28', p: 0.31 },
    ],
    '1W': [
      { d: 'Mon', p: 0.30 }, { d: 'Tue', p: 0.29 }, { d: 'Wed', p: 0.30 },
      { d: 'Thu', p: 0.31 }, { d: 'Fri', p: 0.31 },
    ],
  },

  SNDL: {
    '1Y': [
      { d: 'Apr', p: 1.21 }, { d: 'May', p: 1.12 }, { d: 'Jun', p: 1.04 },
      { d: 'Jul', p: 0.97 }, { d: 'Aug', p: 0.92 }, { d: 'Sep', p: 0.88 },
      { d: 'Oct', p: 0.84 }, { d: 'Nov', p: 0.81 }, { d: 'Dec', p: 0.78 },
      { d: 'Jan', p: 0.76 }, { d: 'Feb', p: 0.74 }, { d: 'Mar', p: 0.72 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.84 }, { d: 'Oct W2', p: 0.83 }, { d: 'Oct W3', p: 0.83 }, { d: 'Oct W4', p: 0.82 },
      { d: 'Nov W1', p: 0.81 }, { d: 'Nov W2', p: 0.81 }, { d: 'Nov W3', p: 0.80 }, { d: 'Nov W4', p: 0.80 },
      { d: 'Dec W1', p: 0.79 }, { d: 'Dec W2', p: 0.79 }, { d: 'Dec W3', p: 0.78 }, { d: 'Dec W4', p: 0.78 },
      { d: 'Jan W1', p: 0.77 }, { d: 'Jan W2', p: 0.77 }, { d: 'Jan W3', p: 0.76 }, { d: 'Jan W4', p: 0.76 },
      { d: 'Feb W1', p: 0.75 }, { d: 'Feb W2', p: 0.75 }, { d: 'Feb W3', p: 0.74 }, { d: 'Feb W4', p: 0.74 },
      { d: 'Mar W1', p: 0.73 }, { d: 'Mar W2', p: 0.73 }, { d: 'Mar W3', p: 0.72 }, { d: 'Mar W4', p: 0.72 },
      { d: 'Mar W5', p: 0.72 },
    ],
    '3M': [
      { d: 'W1', p: 0.76 }, { d: 'W2', p: 0.76 }, { d: 'W3', p: 0.75 },
      { d: 'W4', p: 0.75 }, { d: 'W5', p: 0.75 }, { d: 'W6', p: 0.74 },
      { d: 'W7', p: 0.74 }, { d: 'W8', p: 0.73 }, { d: 'W9', p: 0.73 },
      { d: 'W10', p: 0.73 }, { d: 'W11', p: 0.72 }, { d: 'W12', p: 0.72 },
      { d: 'W13', p: 0.72 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.74 }, { d: 'Mar 4', p: 0.74 }, { d: 'Mar 5', p: 0.74 }, { d: 'Mar 6', p: 0.73 },
      { d: 'Mar 7', p: 0.73 }, { d: 'Mar 10', p: 0.73 }, { d: 'Mar 11', p: 0.73 }, { d: 'Mar 12', p: 0.72 },
      { d: 'Mar 13', p: 0.72 }, { d: 'Mar 14', p: 0.73 }, { d: 'Mar 17', p: 0.72 }, { d: 'Mar 18', p: 0.72 },
      { d: 'Mar 19', p: 0.72 }, { d: 'Mar 20', p: 0.73 }, { d: 'Mar 21', p: 0.72 }, { d: 'Mar 24', p: 0.72 },
      { d: 'Mar 25', p: 0.72 }, { d: 'Mar 26', p: 0.72 }, { d: 'Mar 27', p: 0.72 }, { d: 'Mar 28', p: 0.72 },
    ],
    '1W': [
      { d: 'Mon', p: 0.72 }, { d: 'Tue', p: 0.71 }, { d: 'Wed', p: 0.72 },
      { d: 'Thu', p: 0.72 }, { d: 'Fri', p: 0.72 },
    ],
  },

  TLRY: {
    '1Y': [
      { d: 'Apr', p: 1.44 }, { d: 'May', p: 1.33 }, { d: 'Jun', p: 1.24 },
      { d: 'Jul', p: 1.16 }, { d: 'Aug', p: 1.09 }, { d: 'Sep', p: 1.03 },
      { d: 'Oct', p: 0.99 }, { d: 'Nov', p: 0.96 }, { d: 'Dec', p: 0.93 },
      { d: 'Jan', p: 0.91 }, { d: 'Feb', p: 0.89 }, { d: 'Mar', p: 0.87 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.99 }, { d: 'Oct W2', p: 0.98 }, { d: 'Oct W3', p: 0.98 }, { d: 'Oct W4', p: 0.97 },
      { d: 'Nov W1', p: 0.96 }, { d: 'Nov W2', p: 0.96 }, { d: 'Nov W3', p: 0.96 }, { d: 'Nov W4', p: 0.95 },
      { d: 'Dec W1', p: 0.95 }, { d: 'Dec W2', p: 0.94 }, { d: 'Dec W3', p: 0.94 }, { d: 'Dec W4', p: 0.93 },
      { d: 'Jan W1', p: 0.93 }, { d: 'Jan W2', p: 0.92 }, { d: 'Jan W3', p: 0.92 }, { d: 'Jan W4', p: 0.91 },
      { d: 'Feb W1', p: 0.91 }, { d: 'Feb W2', p: 0.90 }, { d: 'Feb W3', p: 0.90 }, { d: 'Feb W4', p: 0.89 },
      { d: 'Mar W1', p: 0.89 }, { d: 'Mar W2', p: 0.88 }, { d: 'Mar W3', p: 0.88 }, { d: 'Mar W4', p: 0.87 },
      { d: 'Mar W5', p: 0.87 },
    ],
    '3M': [
      { d: 'W1', p: 0.91 }, { d: 'W2', p: 0.91 }, { d: 'W3', p: 0.90 },
      { d: 'W4', p: 0.90 }, { d: 'W5', p: 0.90 }, { d: 'W6', p: 0.89 },
      { d: 'W7', p: 0.89 }, { d: 'W8', p: 0.89 }, { d: 'W9', p: 0.88 },
      { d: 'W10', p: 0.88 }, { d: 'W11', p: 0.88 }, { d: 'W12', p: 0.87 },
      { d: 'W13', p: 0.87 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.90 }, { d: 'Mar 4', p: 0.90 }, { d: 'Mar 5', p: 0.89 }, { d: 'Mar 6', p: 0.89 },
      { d: 'Mar 7', p: 0.89 }, { d: 'Mar 10', p: 0.89 }, { d: 'Mar 11', p: 0.89 }, { d: 'Mar 12', p: 0.88 },
      { d: 'Mar 13', p: 0.88 }, { d: 'Mar 14', p: 0.89 }, { d: 'Mar 17', p: 0.88 }, { d: 'Mar 18', p: 0.88 },
      { d: 'Mar 19', p: 0.88 }, { d: 'Mar 20', p: 0.88 }, { d: 'Mar 21', p: 0.87 }, { d: 'Mar 24', p: 0.87 },
      { d: 'Mar 25', p: 0.87 }, { d: 'Mar 26', p: 0.88 }, { d: 'Mar 27', p: 0.87 }, { d: 'Mar 28', p: 0.87 },
    ],
    '1W': [
      { d: 'Mon', p: 0.87 }, { d: 'Tue', p: 0.87 }, { d: 'Wed', p: 0.88 },
      { d: 'Thu', p: 0.87 }, { d: 'Fri', p: 0.87 },
    ],
  },

  WKHS: {
    '1Y': [
      { d: 'Apr', p: 1.08 }, { d: 'May', p: 0.97 }, { d: 'Jun', p: 0.88 },
      { d: 'Jul', p: 0.79 }, { d: 'Aug', p: 0.73 }, { d: 'Sep', p: 0.67 },
      { d: 'Oct', p: 0.62 }, { d: 'Nov', p: 0.58 }, { d: 'Dec', p: 0.54 },
      { d: 'Jan', p: 0.52 }, { d: 'Feb', p: 0.50 }, { d: 'Mar', p: 0.48 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.62 }, { d: 'Oct W2', p: 0.61 }, { d: 'Oct W3', p: 0.61 }, { d: 'Oct W4', p: 0.60 },
      { d: 'Nov W1', p: 0.59 }, { d: 'Nov W2', p: 0.59 }, { d: 'Nov W3', p: 0.58 }, { d: 'Nov W4', p: 0.58 },
      { d: 'Dec W1', p: 0.57 }, { d: 'Dec W2', p: 0.56 }, { d: 'Dec W3', p: 0.56 }, { d: 'Dec W4', p: 0.54 },
      { d: 'Jan W1', p: 0.54 }, { d: 'Jan W2', p: 0.53 }, { d: 'Jan W3', p: 0.52 }, { d: 'Jan W4', p: 0.52 },
      { d: 'Feb W1', p: 0.51 }, { d: 'Feb W2', p: 0.51 }, { d: 'Feb W3', p: 0.50 }, { d: 'Feb W4', p: 0.50 },
      { d: 'Mar W1', p: 0.50 }, { d: 'Mar W2', p: 0.49 }, { d: 'Mar W3', p: 0.49 }, { d: 'Mar W4', p: 0.48 },
      { d: 'Mar W5', p: 0.48 },
    ],
    '3M': [
      { d: 'W1', p: 0.52 }, { d: 'W2', p: 0.52 }, { d: 'W3', p: 0.51 },
      { d: 'W4', p: 0.51 }, { d: 'W5', p: 0.51 }, { d: 'W6', p: 0.50 },
      { d: 'W7', p: 0.50 }, { d: 'W8', p: 0.50 }, { d: 'W9', p: 0.49 },
      { d: 'W10', p: 0.49 }, { d: 'W11', p: 0.49 }, { d: 'W12', p: 0.48 },
      { d: 'W13', p: 0.48 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.51 }, { d: 'Mar 4', p: 0.51 }, { d: 'Mar 5', p: 0.50 }, { d: 'Mar 6', p: 0.50 },
      { d: 'Mar 7', p: 0.50 }, { d: 'Mar 10', p: 0.50 }, { d: 'Mar 11', p: 0.50 }, { d: 'Mar 12', p: 0.49 },
      { d: 'Mar 13', p: 0.49 }, { d: 'Mar 14', p: 0.50 }, { d: 'Mar 17', p: 0.49 }, { d: 'Mar 18', p: 0.49 },
      { d: 'Mar 19', p: 0.49 }, { d: 'Mar 20', p: 0.49 }, { d: 'Mar 21', p: 0.48 }, { d: 'Mar 24', p: 0.48 },
      { d: 'Mar 25', p: 0.48 }, { d: 'Mar 26', p: 0.49 }, { d: 'Mar 27', p: 0.48 }, { d: 'Mar 28', p: 0.48 },
    ],
    '1W': [
      { d: 'Mon', p: 0.48 }, { d: 'Tue', p: 0.48 }, { d: 'Wed', p: 0.49 },
      { d: 'Thu', p: 0.48 }, { d: 'Fri', p: 0.48 },
    ],
  },

  ATER: {
    '1Y': [
      { d: 'Apr', p: 0.91 }, { d: 'May', p: 0.79 }, { d: 'Jun', p: 0.69 },
      { d: 'Jul', p: 0.60 }, { d: 'Aug', p: 0.54 }, { d: 'Sep', p: 0.49 },
      { d: 'Oct', p: 0.46 }, { d: 'Nov', p: 0.43 }, { d: 'Dec', p: 0.41 },
      { d: 'Jan', p: 0.40 }, { d: 'Feb', p: 0.39 }, { d: 'Mar', p: 0.38 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.46 }, { d: 'Oct W2', p: 0.45 }, { d: 'Oct W3', p: 0.45 }, { d: 'Oct W4', p: 0.44 },
      { d: 'Nov W1', p: 0.44 }, { d: 'Nov W2', p: 0.43 }, { d: 'Nov W3', p: 0.43 }, { d: 'Nov W4', p: 0.43 },
      { d: 'Dec W1', p: 0.42 }, { d: 'Dec W2', p: 0.42 }, { d: 'Dec W3', p: 0.41 }, { d: 'Dec W4', p: 0.41 },
      { d: 'Jan W1', p: 0.40 }, { d: 'Jan W2', p: 0.40 }, { d: 'Jan W3', p: 0.40 }, { d: 'Jan W4', p: 0.40 },
      { d: 'Feb W1', p: 0.39 }, { d: 'Feb W2', p: 0.39 }, { d: 'Feb W3', p: 0.39 }, { d: 'Feb W4', p: 0.39 },
      { d: 'Mar W1', p: 0.39 }, { d: 'Mar W2', p: 0.38 }, { d: 'Mar W3', p: 0.38 }, { d: 'Mar W4', p: 0.37 },
      { d: 'Mar W5', p: 0.38 },
    ],
    '3M': [
      { d: 'W1', p: 0.40 }, { d: 'W2', p: 0.40 }, { d: 'W3', p: 0.40 },
      { d: 'W4', p: 0.40 }, { d: 'W5', p: 0.39 }, { d: 'W6', p: 0.39 },
      { d: 'W7', p: 0.39 }, { d: 'W8', p: 0.38 }, { d: 'W9', p: 0.38 },
      { d: 'W10', p: 0.38 }, { d: 'W11', p: 0.37 }, { d: 'W12', p: 0.37 },
      { d: 'W13', p: 0.38 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.39 }, { d: 'Mar 4', p: 0.39 }, { d: 'Mar 5', p: 0.39 }, { d: 'Mar 6', p: 0.38 },
      { d: 'Mar 7', p: 0.38 }, { d: 'Mar 10', p: 0.38 }, { d: 'Mar 11', p: 0.38 }, { d: 'Mar 12', p: 0.38 },
      { d: 'Mar 13', p: 0.38 }, { d: 'Mar 14', p: 0.38 }, { d: 'Mar 17', p: 0.38 }, { d: 'Mar 18', p: 0.37 },
      { d: 'Mar 19', p: 0.38 }, { d: 'Mar 20', p: 0.38 }, { d: 'Mar 21', p: 0.37 }, { d: 'Mar 24', p: 0.37 },
      { d: 'Mar 25', p: 0.37 }, { d: 'Mar 26', p: 0.38 }, { d: 'Mar 27', p: 0.38 }, { d: 'Mar 28', p: 0.38 },
    ],
    '1W': [
      { d: 'Mon', p: 0.38 }, { d: 'Tue', p: 0.37 }, { d: 'Wed', p: 0.38 },
      { d: 'Thu', p: 0.38 }, { d: 'Fri', p: 0.38 },
    ],
  },

  CLOV: {
    '1Y': [
      { d: 'Apr', p: 1.05 }, { d: 'May', p: 0.96 }, { d: 'Jun', p: 0.88 },
      { d: 'Jul', p: 0.80 }, { d: 'Aug', p: 0.74 }, { d: 'Sep', p: 0.69 },
      { d: 'Oct', p: 0.64 }, { d: 'Nov', p: 0.60 }, { d: 'Dec', p: 0.56 },
      { d: 'Jan', p: 0.52 }, { d: 'Feb', p: 0.49 }, { d: 'Mar', p: 0.45 },
    ],
    '6M': [
      { d: 'Oct W1', p: 0.64 }, { d: 'Oct W2', p: 0.63 }, { d: 'Oct W3', p: 0.63 }, { d: 'Oct W4', p: 0.62 },
      { d: 'Nov W1', p: 0.61 }, { d: 'Nov W2', p: 0.61 }, { d: 'Nov W3', p: 0.60 }, { d: 'Nov W4', p: 0.59 },
      { d: 'Dec W1', p: 0.59 }, { d: 'Dec W2', p: 0.58 }, { d: 'Dec W3', p: 0.57 }, { d: 'Dec W4', p: 0.56 },
      { d: 'Jan W1', p: 0.55 }, { d: 'Jan W2', p: 0.54 }, { d: 'Jan W3', p: 0.53 }, { d: 'Jan W4', p: 0.52 },
      { d: 'Feb W1', p: 0.51 }, { d: 'Feb W2', p: 0.51 }, { d: 'Feb W3', p: 0.50 }, { d: 'Feb W4', p: 0.49 },
      { d: 'Mar W1', p: 0.49 }, { d: 'Mar W2', p: 0.48 }, { d: 'Mar W3', p: 0.47 }, { d: 'Mar W4', p: 0.46 },
      { d: 'Mar W5', p: 0.45 },
    ],
    '3M': [
      { d: 'W1', p: 0.52 }, { d: 'W2', p: 0.52 }, { d: 'W3', p: 0.51 },
      { d: 'W4', p: 0.51 }, { d: 'W5', p: 0.50 }, { d: 'W6', p: 0.50 },
      { d: 'W7', p: 0.49 }, { d: 'W8', p: 0.49 }, { d: 'W9', p: 0.48 },
      { d: 'W10', p: 0.47 }, { d: 'W11', p: 0.47 }, { d: 'W12', p: 0.46 },
      { d: 'W13', p: 0.45 },
    ],
    '1M': [
      { d: 'Mar 3', p: 0.50 }, { d: 'Mar 4', p: 0.49 }, { d: 'Mar 5', p: 0.49 }, { d: 'Mar 6', p: 0.49 },
      { d: 'Mar 7', p: 0.49 }, { d: 'Mar 10', p: 0.48 }, { d: 'Mar 11', p: 0.48 }, { d: 'Mar 12', p: 0.48 },
      { d: 'Mar 13', p: 0.48 }, { d: 'Mar 14', p: 0.47 }, { d: 'Mar 17', p: 0.47 }, { d: 'Mar 18', p: 0.47 },
      { d: 'Mar 19', p: 0.47 }, { d: 'Mar 20', p: 0.46 }, { d: 'Mar 21', p: 0.46 }, { d: 'Mar 24', p: 0.46 },
      { d: 'Mar 25', p: 0.45 }, { d: 'Mar 26', p: 0.46 }, { d: 'Mar 27', p: 0.45 }, { d: 'Mar 28', p: 0.45 },
    ],
    '1W': [
      { d: 'Mon', p: 0.45 }, { d: 'Tue', p: 0.45 }, { d: 'Wed', p: 0.46 },
      { d: 'Thu', p: 0.45 }, { d: 'Fri', p: 0.45 },
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

  MULN: {
    '1Y': [
      { d: 'May', message: 'Third reverse split in 18 months — compliance attempt failed again', type: 'compliance' },
      { d: 'Aug', message: 'Production facility indefinitely halted; layoffs announced', type: 'management' },
      { d: 'Dec', message: 'NASDAQ final compliance warning issued', type: 'compliance' },
    ],
    '6M': [
      { d: 'Oct W4', message: 'SEC subpoena issued — governance overhang elevated', type: 'compliance' },
      { d: 'Dec W2', message: 'Price fell to all-time low below $0.10', type: 'price' },
      { d: 'Jan W2', message: 'Short squeeze attempt — volume 8× average, faded by close', type: 'volume' },
    ],
    '3M': [
      { d: 'W5', message: 'Failed to hold $0.10 support — new 52-week low', type: 'price' },
      { d: 'W9', message: 'Speculative spike 3× volume; no catalyst identified', type: 'volume' },
    ],
    '1M': [
      { d: 'Mar 12', message: 'Volume collapse — daily volume fell to record low', type: 'volume' },
    ],
    '1W': [
      { d: 'Wed', message: 'Intraday low of $0.08 tested; held by day-traders', type: 'price' },
    ],
  },

  NKLA: {
    '1Y': [
      { d: 'Apr', message: 'New CEO appointed following founder fraud conviction', type: 'management' },
      { d: 'Sep', message: 'NASDAQ compliance notice — price below $1 for 30 consecutive days', type: 'compliance' },
      { d: 'Feb', message: 'Restructuring plan announced; 30% workforce reduction', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W3', message: '180-day cure period officially begins', type: 'compliance' },
      { d: 'Dec W1', message: 'Hydrogen truck deliveries delayed by supply chain issues', type: 'management' },
      { d: 'Feb W1', message: 'Cost reduction plan filed — aiming for Q3 breakeven', type: 'management' },
      { d: 'Mar W2', message: 'Price below $0.45; compliance cure window narrowing', type: 'price' },
    ],
    '3M': [
      { d: 'W3', message: 'Volume surge 2× average — speculative interest in restructuring news', type: 'volume' },
      { d: 'W8', message: 'Failed to hold $0.45 support; new lows set', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 7', message: 'Analyst downgrade — price target removed', type: 'management' },
      { d: 'Mar 21', message: 'Support at $0.43 tested three times this week', type: 'price' },
    ],
    '1W': [
      { d: 'Tue', message: 'Intraday bounce to $0.46 faded on light volume', type: 'volume' },
    ],
  },

  AEYE: {
    '1Y': [
      { d: 'May', message: 'ADA compliance regulation update — positive tailwind for platform', type: 'management' },
      { d: 'Oct', message: 'NASDAQ compliance notice received; 180-day window begins', type: 'compliance' },
      { d: 'Jan', message: 'ARR growth 22% YoY — best quarter since IPO', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W2', message: 'Compliance notice filed — stock has traded below $1 for 31 days', type: 'compliance' },
      { d: 'Dec W3', message: 'Enterprise contract win with top-20 bank disclosed', type: 'management' },
      { d: 'Feb W4', message: 'Price approaching $1 recovery line from below', type: 'price' },
      { d: 'Mar W4', message: 'Support band held above $0.79 for 3 consecutive weeks', type: 'price' },
    ],
    '3M': [
      { d: 'W4', message: 'Volume expansion 1.7× average — institutional accumulation possible', type: 'volume' },
      { d: 'W10', message: 'Tightest weekly range in 6 months — coiling near $0.81', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 6', message: 'New enterprise deal announced — ARR expanding', type: 'management' },
      { d: 'Mar 20', message: 'Volume 1.5× average; held gains through close', type: 'volume' },
    ],
    '1W': [
      { d: 'Thu', message: 'Closed above $0.81 — recovery candidate pattern intact', type: 'price' },
    ],
  },

  NRSN: {
    '1Y': [
      { d: 'Jun', message: 'Phase 2 ALS trial enrollment complete', type: 'management' },
      { d: 'Oct', message: 'NASDAQ compliance notice — 180-day window begins', type: 'compliance' },
      { d: 'Feb', message: 'Data readout expected within 60 days — key catalyst', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W4', message: 'Compliance notice officially submitted', type: 'compliance' },
      { d: 'Jan W2', message: 'Phase 2 interim data shows trend toward efficacy', type: 'management' },
      { d: 'Feb W3', message: 'Volume 2.4× average on trial update speculation', type: 'volume' },
      { d: 'Mar W3', message: 'Price held above $0.70 — support band forming', type: 'price' },
    ],
    '3M': [
      { d: 'W6', message: 'Trial update filing expected within 30 days', type: 'management' },
      { d: 'W11', message: 'Price briefly above $0.73 on volume; failed to sustain', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 4', message: 'Analyst initiation with speculative buy rating', type: 'management' },
      { d: 'Mar 19', message: 'Volume 1.9× average ahead of data readout window', type: 'volume' },
    ],
    '1W': [
      { d: 'Mon', message: 'Data readout window opens — elevated event risk', type: 'management' },
      { d: 'Wed', message: 'Price held $0.70 support intraday on light selling', type: 'price' },
    ],
  },

  BNGO: {
    '1Y': [
      { d: 'Jun', message: 'Revenue miss — annual guidance cut by 40%', type: 'management' },
      { d: 'Sep', message: 'NASDAQ compliance notice received', type: 'compliance' },
      { d: 'Jan', message: 'At-the-market offering of 50M shares completed — dilutive', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W1', message: '180-day compliance cure period initiated', type: 'compliance' },
      { d: 'Dec W2', message: 'Price fell below $0.35 — compliance worsening', type: 'price' },
      { d: 'Jan W2', message: 'ATM offering dilutes shareholders — $12M raised', type: 'management' },
      { d: 'Mar W2', message: 'Price at 52-week low; compliance runway under 45 days', type: 'price' },
    ],
    '3M': [
      { d: 'W2', message: 'Extension request filed with NASDAQ', type: 'compliance' },
      { d: 'W7', message: 'Volume 2× average — short covering bounce attempt', type: 'volume' },
    ],
    '1M': [
      { d: 'Mar 7', message: 'SEC 8-K compliance update filed', type: 'compliance' },
      { d: 'Mar 21', message: 'Brief bounce to $0.34 — failed to hold', type: 'price' },
    ],
    '1W': [
      { d: 'Mon', message: 'Opened near 52-week low on no news', type: 'price' },
      { d: 'Thu', message: 'Volume spike 1.3× — fade by EOD', type: 'volume' },
    ],
  },

  SNDL: {
    '1Y': [
      { d: 'May', message: 'Spirits retail acquisition expands non-cannabis revenue', type: 'management' },
      { d: 'Sep', message: 'NASDAQ compliance notice — 180-day window begins', type: 'compliance' },
      { d: 'Feb', message: 'Q4 revenue growth 18% YoY — cannabis segment improving', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W3', message: 'Compliance notice officially submitted to NASDAQ', type: 'compliance' },
      { d: 'Dec W1', message: 'Canadian cannabis reform tailwind — market optimism brief', type: 'management' },
      { d: 'Feb W2', message: 'Revenue beat modest consensus — stock held gains 2 days', type: 'management' },
      { d: 'Mar W1', message: 'Price held above $0.70 — potential base forming', type: 'price' },
    ],
    '3M': [
      { d: 'W5', message: 'Volume 1.8× average on M&A speculation', type: 'volume' },
      { d: 'W11', message: 'Support at $0.71 held for 3 consecutive weeks', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 5', message: 'Insider purchase of $80K at open market', type: 'management' },
      { d: 'Mar 19', message: 'Volume 1.6× average; price held above $0.71', type: 'volume' },
    ],
    '1W': [
      { d: 'Tue', message: 'Held above $0.71 support intraday', type: 'price' },
      { d: 'Fri', message: 'Closed above weekly open — constructive weekly candle', type: 'price' },
    ],
  },

  TLRY: {
    '1Y': [
      { d: 'Apr', message: 'Craft beer pivot accelerating — SweetWater and Montauk brands growing', type: 'management' },
      { d: 'Aug', message: 'NASDAQ compliance notice — price dipped below $1', type: 'compliance' },
      { d: 'Jan', message: 'Cost restructuring cuts SG&A by 25% — profitability closer', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W2', message: 'Compliance notice submitted — 180-day cure window active', type: 'compliance' },
      { d: 'Nov W3', message: 'US cannabis legalization bill reintroduced — speculation spike', type: 'management' },
      { d: 'Feb W1', message: 'Quarterly revenue beat by 8% — beer segment leading', type: 'management' },
      { d: 'Mar W3', message: 'Price approaching $1 compliance threshold — 87¢ close', type: 'price' },
    ],
    '3M': [
      { d: 'W3', message: 'Highest volume week in 4 months — institutional reentry?', type: 'volume' },
      { d: 'W9', message: 'Recovery candidate setup confirmed by 3 consecutive higher lows', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 4', message: 'Beer segment Q3 guidance raised — positive catalyst', type: 'management' },
      { d: 'Mar 21', message: 'Volume 2.1× average; closed at weekly high', type: 'volume' },
      { d: 'Mar 28', message: 'Within 15% of $1.00 recovery threshold', type: 'price' },
    ],
    '1W': [
      { d: 'Wed', message: 'Volume 1.7× average — recovery candidate momentum building', type: 'volume' },
      { d: 'Fri', message: 'Closed near weekly high at $0.87 — constructive action', type: 'price' },
    ],
  },

  WKHS: {
    '1Y': [
      { d: 'Jun', message: 'FAA drone delivery approval delayed — stock -18% in session', type: 'management' },
      { d: 'Sep', message: 'NASDAQ compliance notice received', type: 'compliance' },
      { d: 'Jan', message: 'First commercial drone delivery order — 200 units', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W1', message: '180-day compliance cure window begins', type: 'compliance' },
      { d: 'Dec W2', message: 'Government contract bid submitted — outcome Q2 expected', type: 'management' },
      { d: 'Feb W3', message: 'First drone delivery route certified in Ohio — milestone', type: 'management' },
      { d: 'Mar W2', message: 'Support at $0.48 held after compliance update', type: 'price' },
    ],
    '3M': [
      { d: 'W4', message: 'Volume 2.3× average on FAA partial approval news', type: 'volume' },
      { d: 'W9', message: 'Price held above $0.48 through 3 sell-off attempts', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 6', message: 'New delivery partnership with regional pharmacy chain', type: 'management' },
      { d: 'Mar 20', message: 'Volume 1.5× average; price bounced off $0.48 support', type: 'volume' },
    ],
    '1W': [
      { d: 'Tue', message: 'Intraday dip to $0.46 absorbed — support holding', type: 'price' },
      { d: 'Thu', message: 'Bounced to $0.50 on volume; failed to hold above $0.49', type: 'price' },
    ],
  },

  ATER: {
    '1Y': [
      { d: 'May', message: 'Amazon seller derank — top product category revenue -35%', type: 'management' },
      { d: 'Oct', message: 'NASDAQ compliance notice received', type: 'compliance' },
      { d: 'Feb', message: 'Cost reduction plan — headcount cut 40%, SG&A down 30%', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W2', message: 'Compliance notice — price below $1 for 32 days', type: 'compliance' },
      { d: 'Dec W1', message: 'Holiday revenue miss — Q4 guidance cut significantly', type: 'management' },
      { d: 'Feb W1', message: 'Restructuring plan filed — AI product personalization pivot', type: 'management' },
      { d: 'Mar W3', message: 'Price at 52-week low; 47 days remaining in cure window', type: 'price' },
    ],
    '3M': [
      { d: 'W3', message: 'Extension request filed with NASDAQ compliance', type: 'compliance' },
      { d: 'W8', message: 'Volume 1.6× average — speculative bounce attempt', type: 'volume' },
    ],
    '1M': [
      { d: 'Mar 5', message: 'New AI product listing tool launched — limited early traction', type: 'management' },
      { d: 'Mar 21', message: 'Failed to hold $0.39 support; new 52-week low', type: 'price' },
    ],
    '1W': [
      { d: 'Mon', message: 'Gap down on earnings pre-announcement — no guidance given', type: 'price' },
      { d: 'Wed', message: 'Intraday bounce to $0.40 — absorbed on light volume', type: 'volume' },
    ],
  },

  CLOV: {
    '1Y': [
      { d: 'May', message: 'CMS Medicare Advantage rate update — neutral to slightly positive', type: 'management' },
      { d: 'Sep', message: 'NASDAQ compliance notice — price fell below $1', type: 'compliance' },
      { d: 'Feb', message: 'Medical loss ratio improved to 88% — best in 3 years', type: 'management' },
    ],
    '6M': [
      { d: 'Oct W1', message: '180-day cure window begins formally', type: 'compliance' },
      { d: 'Nov W3', message: 'Open enrollment growth 12% — member count expanding', type: 'management' },
      { d: 'Feb W2', message: 'Q4 results — first quarter of positive operating cash flow', type: 'management' },
      { d: 'Mar W4', message: 'Price at $0.45 — compliance cure window at 101 days', type: 'price' },
    ],
    '3M': [
      { d: 'W3', message: 'Volume 1.9× average — institution reentry speculated', type: 'volume' },
      { d: 'W10', message: 'Price held above $0.46 for 4 consecutive sessions', type: 'price' },
    ],
    '1M': [
      { d: 'Mar 7', message: 'CMS risk adjustment payment received — cash position improves', type: 'management' },
      { d: 'Mar 20', message: 'Volume 1.7× average; closed near session high', type: 'volume' },
    ],
    '1W': [
      { d: 'Tue', message: 'Intraday high of $0.47 — highest in 2 weeks', type: 'price' },
      { d: 'Thu', message: 'Volume 1.4× average; held gains into close', type: 'volume' },
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
