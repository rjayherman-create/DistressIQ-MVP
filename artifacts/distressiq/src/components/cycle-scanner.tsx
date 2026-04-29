import { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight, Activity, Search, ChevronRight, Bell, BellOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cyclicStocks, phaseConfig, type CyclePhase, type CyclicStock } from '@/lib/cycle-data';
import { isWatching, toggleWatch } from '@/lib/notification-system';
import { useCyclicStocks } from '@/hooks/use-distressiq';

type SortKey = 'signal' | 'gain' | 'ticker' | 'consistency';
type FilterPhase = 'all' | CyclePhase;

function SignalBar({ value }: { value: number }) {
  const color = value >= 70 ? '#10b981' : value >= 45 ? '#0ea5e9' : value >= 25 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

function MiniSparkline({ history, phase }: { history: CyclicStock['history']; phase: CyclePhase }) {
  const color = phaseConfig[phase].dot;
  return (
    <ResponsiveContainer width={80} height={30}>
      <AreaChart data={history} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`sg-${phase}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="p" stroke={color} strokeWidth={1.5} fill={`url(#sg-${phase})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CyclePositionBar({ position, phase }: { position: number; phase: CyclePhase }) {
  const pct = Math.round(position * 100);
  const color = phaseConfig[phase].dot;
  return (
    <div className="relative h-2 w-full rounded-full bg-slate-100">
      <div
        className="absolute top-0 left-0 h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.35 }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-white shadow-sm transition-all"
        style={{ left: `calc(${pct}% - 6px)`, backgroundColor: color }}
      />
    </div>
  );
}

function DetailChart({ stock }: { stock: CyclicStock }) {
  const cfg = phaseConfig[stock.phase];

  const buyZones: { x1: string; x2: string }[] = [];
  let inBuyZone = false;
  let zoneStart = '';
  stock.history.forEach((pt, i) => {
    const nearBottom = pt.p <= stock.cycleLow + (stock.cycleHigh - stock.cycleLow) * 0.25;
    if (nearBottom && !inBuyZone) { inBuyZone = true; zoneStart = pt.d; }
    if (!nearBottom && inBuyZone) { inBuyZone = false; buyZones.push({ x1: zoneStart, x2: stock.history[i - 1]?.d || pt.d }); }
  });
  if (inBuyZone && zoneStart) buyZones.push({ x1: zoneStart, x2: stock.history[stock.history.length - 1].d });

  const displayInterval = Math.ceil(stock.history.length / 8);

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={stock.history} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="cycleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={cfg.dot} stopOpacity={0.2} />
              <stop offset="95%" stopColor={cfg.dot} stopOpacity={0} />
            </linearGradient>
          </defs>

          {buyZones.map((z, i) => (
            <ReferenceArea key={i} x1={z.x1} x2={z.x2} fill="#10b981" fillOpacity={0.08} />
          ))}

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} interval={displayInterval} dy={6} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `$${v.toFixed(2)}`} domain={['dataMin - 0.03', 'dataMax + 0.03']} />
          <RechartsTooltip
            contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px' }}
            formatter={(v: number) => [`$${v.toFixed(3)}`, 'Price']}
          />
          <ReferenceLine y={stock.cycleHigh} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
            label={{ position: 'insideTopRight', value: `Resistance $${stock.cycleHigh.toFixed(2)}`, fill: '#f59e0b', fontSize: 10, dx: -4 }} />
          <ReferenceLine y={stock.cycleLow} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5}
            label={{ position: 'insideBottomRight', value: `Support $${stock.cycleLow.toFixed(2)}`, fill: '#10b981', fontSize: 10, dx: -4 }} />
          <Area type="monotone" dataKey="p" stroke={cfg.dot} strokeWidth={2} fill="url(#cycleGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StockDetail({ stock }: { stock: CyclicStock }) {
  const cfg = phaseConfig[stock.phase];
  const stopLoss = parseFloat((stock.cycleLow * 0.93).toFixed(3));
  const gainToHigh = parseFloat((((stock.cycleHigh - stock.currentPrice) / stock.currentPrice) * 100).toFixed(1));
  const riskReward = gainToHigh > 0 ? parseFloat((gainToHigh / 7).toFixed(1)) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-black text-slate-900">{stock.ticker}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 border-blue-100">{stock.exchange}</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{stock.company} · {stock.industry}</p>
          <p className="text-[10px] text-slate-400 mt-1">Tradeable on <span className="font-semibold text-slate-600">Robinhood</span> &amp; <span className="font-semibold text-slate-600">E-Trade</span></p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-slate-900">${stock.currentPrice.toFixed(3)}</p>
          <p className="text-xs text-slate-400">Current price</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Support ${stock.cycleLow.toFixed(2)}</span>
          <span>Cycle position</span>
          <span>Resistance ${stock.cycleHigh.toFixed(2)}</span>
        </div>
        <CyclePositionBar position={stock.positionInCycle} phase={stock.phase} />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Buy Zone</span>
          <span>Near Peak → Sell</span>
        </div>
      </div>

      <DetailChart stock={stock} />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Entry Zone</p>
          <p className="mt-1 text-lg font-black text-emerald-800">${stock.cycleLow.toFixed(2)} – ${(stock.cycleLow * 1.06).toFixed(2)}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Buy near support</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Target Exit</p>
          <p className="mt-1 text-lg font-black text-amber-800">${(stock.cycleHigh * 0.94).toFixed(2)} – ${stock.cycleHigh.toFixed(2)}</p>
          <p className="text-xs text-amber-600 mt-0.5">Sell near resistance</p>
        </div>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Stop Loss</p>
          <p className="mt-1 text-lg font-black text-rose-800">${stopLoss.toFixed(3)}</p>
          <p className="text-xs text-rose-600 mt-0.5">Below support −7%</p>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Cycle Gain</p>
          <p className="mt-1 text-lg font-black text-slate-800">+{stock.avgCycleGain}%</p>
          <p className="text-xs text-slate-500 mt-0.5">Low → high per cycle</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 grid grid-cols-2 gap-x-6 gap-y-3">
        <div>
          <p className="text-xs text-slate-400">Cycle length</p>
          <p className="text-sm font-bold text-slate-800">{stock.cycleLengthDays} days</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Cycles completed (1Y)</p>
          <p className="text-sm font-bold text-slate-800">{stock.completedCycles}×</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Pattern consistency</p>
          <p className="text-sm font-bold text-slate-800">{stock.patternConsistency}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">
            {stock.phase === 'buy' ? 'Upside from here' : 'Next buy zone est.'}
          </p>
          <p className="text-sm font-bold text-slate-800">
            {stock.phase === 'buy' ? `+${gainToHigh}%` : `~${stock.nextBuyDays} days`}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Reward / Risk ratio</p>
          <p className="text-sm font-bold text-slate-800">{riskReward}:1</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Signal strength</p>
          <p className="text-sm font-bold text-slate-800">{stock.signalStrength}/100</p>
        </div>
      </div>

      {stock.phase === 'buy' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex gap-3 items-start">
          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Active buy signal</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              {stock.ticker} is trading near its 1-year support of ${stock.cycleLow.toFixed(2)}.
              Based on {stock.completedCycles} completed cycles, the pattern suggests a move toward
              ${stock.cycleHigh.toFixed(2)} (+{stock.avgCycleGain}%) over the next ~{Math.round(stock.cycleLengthDays / 2)} days.
              Pattern reliability: {stock.patternConsistency}%.
            </p>
          </div>
        </div>
      )}
      {stock.phase === 'peak' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 items-start">
          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
          <div>
            <p className="text-sm font-bold text-amber-800">Near resistance — avoid entry</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {stock.ticker} is approaching its cycle high of ${stock.cycleHigh.toFixed(2)}.
              Wait for the pullback to support (~${stock.cycleLow.toFixed(2)}) before entering.
              Estimated next buy zone: ~{stock.nextBuyDays} days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function CycleScanner() {
  const liveStocks = useCyclicStocks();
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<FilterPhase>('all');
  const [sortKey, setSortKey] = useState<SortKey>('signal');
  const [selectedTicker, setSelectedTicker] = useState<string>(cyclicStocks[0].ticker);
  const [watchedSet, setWatchedSet] = useState<Set<string>>(
    () => new Set(cyclicStocks.filter(s => isWatching(s.ticker)).map(s => s.ticker))
  );

  const handleToggleWatch = useCallback((e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    toggleWatch(ticker);
    setWatchedSet(prev => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker); else next.add(ticker);
      return next;
    });
  }, []);

  const phaseCounts = useMemo(() => ({
    buy: liveStocks.filter(s => s.phase === 'buy').length,
    rising: liveStocks.filter(s => s.phase === 'rising').length,
    peak: liveStocks.filter(s => s.phase === 'peak').length,
    falling: liveStocks.filter(s => s.phase === 'falling').length,
  }), [liveStocks]);

  const filtered = useMemo(() => {
    let list = [...liveStocks];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q));
    }
    if (phaseFilter !== 'all') list = list.filter(s => s.phase === phaseFilter);
    list.sort((a, b) => {
      if (sortKey === 'signal') return b.signalStrength - a.signalStrength;
      if (sortKey === 'gain') return b.potentialGain - a.potentialGain;
      if (sortKey === 'consistency') return b.patternConsistency - a.patternConsistency;
      return a.ticker.localeCompare(b.ticker);
    });
    return list;
  }, [liveStocks, search, phaseFilter, sortKey]);

  const selectedStock = useMemo(
    () => liveStocks.find(s => s.ticker === selectedTicker) || liveStocks[0],
    [liveStocks, selectedTicker],
  );

  const phaseFilters: { value: FilterPhase; label: string; count: number; color: string }[] = [
    { value: 'all',     label: 'All',       count: liveStocks.length, color: 'text-slate-600' },
    { value: 'buy',     label: 'Buy Zone',  count: phaseCounts.buy,     color: 'text-emerald-600' },
    { value: 'rising',  label: 'Rising',    count: phaseCounts.rising,  color: 'text-sky-600' },
    { value: 'peak',    label: 'Near Peak', count: phaseCounts.peak,    color: 'text-amber-600' },
    { value: 'falling', label: 'Falling',   count: phaseCounts.falling, color: 'text-slate-500' },
  ];

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'signal',      label: 'Signal strength' },
    { value: 'gain',        label: 'Potential gain' },
    { value: 'consistency', label: 'Pattern reliability' },
    { value: 'ticker',      label: 'Ticker A–Z' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Cycle Pattern Scanner</h2>
          <p className="text-sm text-slate-500">
            {liveStocks.length} sub-$1 stocks tracked — identifies range-bound oscillators and suggests optimal entry timing.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Buy Zone', count: phaseCounts.buy, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
            { label: 'Rising',   count: phaseCounts.rising, bg: 'bg-sky-50',   text: 'text-sky-700',   border: 'border-sky-200' },
            { label: 'Peak',     count: phaseCounts.peak,  bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
            { label: 'Falling',  count: phaseCounts.falling, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
          ].map(b => (
            <div key={b.label} className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${b.bg} ${b.text} ${b.border}`}>
              {b.count} {b.label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        <Card className="rounded-[2rem] shadow-sm border-slate-200/60 overflow-hidden">
          <CardHeader className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search ticker or company…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm rounded-xl border-slate-200 bg-white"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {phaseFilters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setPhaseFilter(f.value)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    phaseFilter === f.value
                      ? 'bg-slate-900 text-white'
                      : `${f.color} hover:bg-slate-100`
                  }`}
                >
                  {f.label} <span className="opacity-60">{f.count}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sort:</span>
              {sortOptions.map(o => (
                <button
                  key={o.value}
                  onClick={() => setSortKey(o.value)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${
                    sortKey === o.value
                      ? 'bg-slate-200 text-slate-900'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100">
              {filtered.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-400">No stocks match your filters.</p>
              )}
              {filtered.map(stock => {
                const cfg = phaseConfig[stock.phase];
                const isSelected = stock.ticker === selectedTicker;
                const watching = watchedSet.has(stock.ticker);
                return (
                  <div
                    key={stock.ticker}
                    onClick={() => setSelectedTicker(stock.ticker)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedTicker(stock.ticker)}
                    className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${isSelected ? 'bg-slate-50 border-l-2 border-l-slate-700' : ''}`}
                  >
                    <div className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: cfg.dot + '22', color: cfg.dot }}>
                      {stock.ticker.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-slate-900">{stock.ticker}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-100">
                          {stock.exchange}
                        </span>
                        {watching && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-violet-100 text-violet-700">Watch</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{stock.company}</p>
                      <SignalBar value={stock.signalStrength} />
                    </div>
                    <div className="shrink-0 text-right">
                      <MiniSparkline history={stock.history} phase={stock.phase} />
                      <p className="text-xs font-bold text-slate-700 mt-0.5">${stock.currentPrice.toFixed(3)}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">+{stock.avgCycleGain}%</p>
                    </div>
                    <button
                      onClick={e => handleToggleWatch(e, stock.ticker)}
                      title={watching ? 'Stop watching' : 'Watch — get notified on signal change'}
                      className={`shrink-0 rounded-xl p-1.5 transition-all ${
                        watching
                          ? 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                          : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {watching ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                    </button>
                    {isSelected && <ChevronRight className="shrink-0 h-3.5 w-3.5 text-slate-400" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] shadow-sm border-slate-200/60">
          <CardContent className="p-6">
            <StockDetail stock={selectedStock} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
