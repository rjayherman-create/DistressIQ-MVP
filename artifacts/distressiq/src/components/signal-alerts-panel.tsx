import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, TrendingUp, TrendingDown, Minus, X, ShieldCheck } from 'lucide-react';
import { cyclicStocks } from '@/lib/cycle-data';
import {
  buildSignalAlerts, requestPushPermission, getPushPermission,
  fireWatchedNotifications, getWatchedTickers, toggleWatch,
  type SignalAlert,
} from '@/lib/notification-system';

function alertColor(type: SignalAlert['type']) {
  if (type === 'buy')     return { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: '#10b981', label: 'BUY' };
  if (type === 'sell')    return { bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100  text-amber-700',  dot: '#f59e0b', label: 'SELL' };
  if (type === 'rising')  return { bg: 'bg-sky-50',     border: 'border-sky-200',     badge: 'bg-sky-100    text-sky-700',    dot: '#0ea5e9', label: 'RISE' };
  return                         { bg: 'bg-slate-50',   border: 'border-slate-200',   badge: 'bg-slate-100  text-slate-600',  dot: '#94a3b8', label: 'INFO' };
}

function AlertIcon({ type }: { type: SignalAlert['type'] }) {
  if (type === 'buy')    return <TrendingUp  className="h-3.5 w-3.5 text-emerald-600" />;
  if (type === 'sell')   return <TrendingDown className="h-3.5 w-3.5 text-amber-600" />;
  if (type === 'rising') return <TrendingUp  className="h-3.5 w-3.5 text-sky-600" />;
  return <Minus className="h-3.5 w-3.5 text-slate-400" />;
}

function SignalStrengthBar({ value, type }: { value: number; type: SignalAlert['type'] }) {
  const c = alertColor(type);
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-14 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: c.dot }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color: c.dot }}>{value}</span>
    </div>
  );
}

interface SignalAlertsPanelProps {
  onClose: () => void;
  onGoToCycles: () => void;
}

export function SignalAlertsPanel({ onClose, onGoToCycles }: SignalAlertsPanelProps) {
  const [alerts, setAlerts] = useState<SignalAlert[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [watchedCount, setWatchedCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'watched'>('all');

  const refresh = useCallback(() => {
    setAlerts(buildSignalAlerts(cyclicStocks));
    setPermission(getPushPermission());
    setWatchedCount(getWatchedTickers().length);
  }, []);

  useEffect(() => {
    refresh();
    // Also fire any pending push notifications for watched tickers
    fireWatchedNotifications(cyclicStocks);
  }, [refresh]);

  const handleToggleWatch = (ticker: string) => {
    toggleWatch(ticker);
    refresh();
  };

  const handleEnablePush = async () => {
    const result = await requestPushPermission();
    setPermission(result);
    if (result === 'granted') {
      fireWatchedNotifications(cyclicStocks);
    }
  };

  const filtered = alerts.filter(a => {
    if (filter === 'buy') return a.type === 'buy';
    if (filter === 'sell') return a.type === 'sell';
    if (filter === 'watched') return a.watched;
    return true;
  });

  const buyCount   = alerts.filter(a => a.type === 'buy').length;
  const sellCount  = alerts.filter(a => a.type === 'sell').length;
  const risingCount = alerts.filter(a => a.type === 'rising').length;

  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-[400px] max-h-[80vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/60">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-black text-slate-900">Signal Alerts</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {buyCount} buy · {sellCount} sell · {risingCount} rising
          </p>
        </div>
        <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-slate-100 transition-colors">
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Push notification banner */}
      {permission !== 'granted' && (
        <div className="mx-4 mt-4 rounded-2xl bg-slate-900 p-4 flex items-start gap-3">
          <Bell className="h-4 w-4 text-white shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-white">Get push notifications</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Watch individual stocks and receive a browser alert the moment they enter your buy zone.
            </p>
          </div>
          <button
            onClick={handleEnablePush}
            disabled={permission === 'denied'}
            className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-[11px] font-bold text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {permission === 'denied' ? 'Blocked' : 'Enable'}
          </button>
        </div>
      )}
      {permission === 'granted' && watchedCount > 0 && (
        <div className="mx-4 mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-3 flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 font-semibold">
            Push notifications active — watching {watchedCount} stock{watchedCount !== 1 ? 's' : ''}.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-slate-100">
        {[
          { value: 'all' as const,     label: 'All', count: alerts.length },
          { value: 'buy' as const,     label: 'Buy',  count: buyCount },
          { value: 'sell' as const,    label: 'Sell', count: sellCount },
          { value: 'watched' as const, label: 'Watched', count: watchedCount },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              filter === f.value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {f.label} <span className="opacity-60">{f.count}</span>
          </button>
        ))}
        <button
          onClick={onGoToCycles}
          className="ml-auto text-[11px] font-semibold text-slate-400 hover:text-slate-700 underline underline-offset-2"
        >
          Open scanner →
        </button>
      </div>

      {/* Alerts list */}
      <div className="overflow-y-auto flex-1 py-2 px-2">
        {filtered.length === 0 && (
          <div className="py-10 text-center">
            <BellOff className="mx-auto h-8 w-8 text-slate-200 mb-2" />
            <p className="text-sm text-slate-400">
              {filter === 'watched' ? 'No watched stocks have active signals.' : 'No signals match this filter.'}
            </p>
          </div>
        )}
        {filtered.map(alert => {
          const c = alertColor(alert.type);
          return (
            <div
              key={`${alert.ticker}-${alert.type}`}
              className={`flex items-start gap-3 rounded-2xl border p-3.5 mb-2 ${c.bg} ${c.border}`}
            >
              <div className="shrink-0 rounded-xl p-1.5" style={{ backgroundColor: c.dot + '22' }}>
                <AlertIcon type={alert.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-black text-slate-900">{alert.ticker}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${c.badge}`}>
                    {c.label}
                  </span>
                  {alert.watched && (
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-violet-100 text-violet-700">
                      Watching
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <SignalStrengthBar value={alert.signalStrength} type={alert.type} />
                  <span className="text-[10px] text-slate-400">${alert.price.toFixed(3)} now</span>
                </div>
              </div>
              <button
                onClick={() => handleToggleWatch(alert.ticker)}
                title={alert.watched ? 'Stop watching' : 'Watch this stock'}
                className={`shrink-0 rounded-xl p-1.5 transition-all ${
                  alert.watched
                    ? 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                    : 'bg-white/70 text-slate-400 hover:text-slate-700 hover:bg-white'
                }`}
              >
                {alert.watched ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center">
          Signals update each session · Push alerts fire when watched stocks enter buy or sell zones
        </p>
      </div>
    </div>
  );
}

// Exported hook for getting the live alert count badge
export function useAlertCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const alerts = buildSignalAlerts(cyclicStocks);
    setCount(alerts.filter(a => a.type === 'buy' || a.type === 'sell').length);
  }, []);
  return count;
}
