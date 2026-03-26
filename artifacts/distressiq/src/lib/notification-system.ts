import type { CyclicStock } from './cycle-data';

const WATCHED_KEY = 'distressiq-watched-tickers';
const LAST_NOTIFIED_KEY = 'distressiq-last-notified';
const NOTIF_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours per ticker

export function getWatchedTickers(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WATCHED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function setWatchedTickers(tickers: string[]): void {
  localStorage.setItem(WATCHED_KEY, JSON.stringify(tickers));
}

export function isWatching(ticker: string): boolean {
  return getWatchedTickers().includes(ticker);
}

export function toggleWatch(ticker: string): boolean {
  const current = getWatchedTickers();
  const next = current.includes(ticker)
    ? current.filter(t => t !== ticker)
    : [...current, ticker];
  setWatchedTickers(next);
  return next.includes(ticker);
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function getPushPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

function getLastNotified(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LAST_NOTIFIED_KEY) || '{}');
  } catch {
    return {};
  }
}

function setLastNotified(map: Record<string, number>): void {
  localStorage.setItem(LAST_NOTIFIED_KEY, JSON.stringify(map));
}

function canNotify(ticker: string): boolean {
  const last = getLastNotified();
  const ts = last[ticker];
  if (!ts) return true;
  return Date.now() - ts > NOTIF_COOLDOWN_MS;
}

function markNotified(ticker: string): void {
  const last = getLastNotified();
  last[ticker] = Date.now();
  setLastNotified(last);
}

function sendBrowserNotif(title: string, body: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/favicon.ico', silent: false });
  } catch {
    // some browsers block Notification in iframes
  }
}

export interface SignalAlert {
  ticker: string;
  company: string;
  type: 'buy' | 'sell' | 'rising' | 'falling';
  message: string;
  price: number;
  target: number;
  signalStrength: number;
  watched: boolean;
}

export function buildSignalAlerts(stocks: CyclicStock[]): SignalAlert[] {
  const watched = getWatchedTickers();
  return stocks
    .filter(s => s.phase === 'buy' || s.phase === 'peak' || s.phase === 'rising')
    .map(s => {
      if (s.phase === 'buy') {
        return {
          ticker: s.ticker, company: s.company, type: 'buy' as const,
          message: `Near support $${s.cycleLow.toFixed(2)} — target $${s.cycleHigh.toFixed(2)} (+${s.avgCycleGain}%)`,
          price: s.currentPrice, target: s.cycleHigh, signalStrength: s.signalStrength,
          watched: watched.includes(s.ticker),
        };
      }
      if (s.phase === 'peak') {
        return {
          ticker: s.ticker, company: s.company, type: 'sell' as const,
          message: `Approaching resistance $${s.cycleHigh.toFixed(2)} — consider exiting`,
          price: s.currentPrice, target: s.cycleLow, signalStrength: 100 - s.signalStrength,
          watched: watched.includes(s.ticker),
        };
      }
      return {
        ticker: s.ticker, company: s.company, type: 'rising' as const,
        message: `Rising from support — momentum building toward $${s.cycleHigh.toFixed(2)}`,
        price: s.currentPrice, target: s.cycleHigh, signalStrength: s.signalStrength,
        watched: watched.includes(s.ticker),
      };
    })
    .sort((a, b) => {
      if (a.watched && !b.watched) return -1;
      if (!a.watched && b.watched) return 1;
      if (a.type === 'buy' && b.type !== 'buy') return -1;
      if (b.type === 'buy' && a.type !== 'buy') return 1;
      return b.signalStrength - a.signalStrength;
    });
}

export function fireWatchedNotifications(stocks: CyclicStock[]): void {
  const watched = getWatchedTickers();
  if (watched.length === 0 || getPushPermission() !== 'granted') return;
  for (const stock of stocks) {
    if (!watched.includes(stock.ticker)) continue;
    if (!canNotify(stock.ticker)) continue;
    if (stock.phase === 'buy') {
      sendBrowserNotif(
        `🟢 ${stock.ticker} — Buy Signal`,
        `Trading near support $${stock.cycleLow.toFixed(2)}. Target $${stock.cycleHigh.toFixed(2)} (+${stock.avgCycleGain}%). Signal: ${stock.signalStrength}/100`,
      );
      markNotified(stock.ticker);
    } else if (stock.phase === 'peak') {
      sendBrowserNotif(
        `🟡 ${stock.ticker} — Near Resistance`,
        `Approaching $${stock.cycleHigh.toFixed(2)}. Consider taking profit if holding.`,
      );
      markNotified(stock.ticker);
    }
  }
}
