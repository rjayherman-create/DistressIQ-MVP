import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Bell, TrendingUp, TrendingDown, AlertTriangle, 
  Filter, BarChart3, Activity, DollarSign, ShieldAlert, 
  Building2, Users, Briefcase, Newspaper, ExternalLink, Info
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useDashboardStocks, useDashboardAlerts, useLocalWatchlist, useStockNews, type StockNewsItem } from '@/hooks/use-distressiq';
import { statusPill } from '@/lib/scoring';
import { ScoreCard } from './score-card';
import { PeerComparison } from './peer-comparison';
import { CycleScanner } from './cycle-scanner';
import { SignalAlertsPanel, useAlertCount } from './signal-alerts-panel';
import { historicalData, stockEvents, eventTypeConfig, PERIODS, periodDescriptions, type Period } from '@/lib/history-data';
import type { Stock } from '@workspace/api-client-react';

// ---------------------------------------------------------------------------
// Stat trend tracking — persists a snapshot to localStorage so the UI can
// show how today's counts compare to the previous session.
// ---------------------------------------------------------------------------

const SNAPSHOT_KEY = 'distressiq-stat-snapshot';

interface StatSnapshot {
  activeSetups: number;
  highQuality: number;
  highRisk: number;
  triggeredAlerts: number;
  savedAt: string; // ISO date string
}

function loadSnapshot(): StatSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as StatSnapshot) : null;
  } catch {
    return null;
  }
}

function saveSnapshot(snap: StatSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
  } catch { /* storage unavailable */ }
}

export function DistressIQDashboard() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [strategyMode, setStrategyMode] = useState('balanced');
  const [activeTab, setActiveTab] = useState('scanner');
  const [chartPeriod, setChartPeriod] = useState<Period>('3M');
  const [showAlerts, setShowAlerts] = useState(false);
  const alertCount = useAlertCount();

  const [now, setNow] = useState(() => new Date());
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setLastRefreshed(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = now.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const lastRefreshedString = lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /** Returns a valid Date or null if the ISO string is missing or unparseable. */
  const parseTimestamp = (ts: string | undefined): Date | null => {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  };

  const { data: stocks = [], isLiveData: stocksLive } = useDashboardStocks({ q: query, status: statusFilter });
  const { data: alerts = [], isLiveData: alertsLive } = useDashboardAlerts();
  // isLiveData reflects only the stock scanner feed so the badge accurately
  // shows whether scored stock data (not just the static alerts list) is live.
  const isLiveData = stocksLive;
  const { watchlist, toggleWatchlist } = useLocalWatchlist();

  // ---------------------------------------------------------------------------
  // Stat counts & trend tracking
  // ---------------------------------------------------------------------------
  const activeSetups = stocks.length;
  const highQuality = stocks.filter(s => s.bounceProbability >= 65).length;
  const highRisk = stocks.filter(s => s.delistingRisk >= 60).length;
  const triggeredAlerts = alerts.length;

  // Load the previous-session snapshot once on mount so the delta is stable.
  const prevSnapshotRef = useRef<StatSnapshot | null>(null);
  useEffect(() => {
    prevSnapshotRef.current = loadSnapshot();
  }, []);

  // Persist the current counts whenever the data changes.
  useEffect(() => {
    if (stocks.length === 0 && alerts.length === 0) return;
    saveSnapshot({
      activeSetups,
      highQuality,
      highRisk,
      triggeredAlerts,
      savedAt: new Date().toISOString(),
    });
  }, [activeSetups, highQuality, highRisk, triggeredAlerts]);

  const prev = prevSnapshotRef.current;

  // Safely get selected stock or fallback to first
  const selected = useMemo(() => {
    return stocks.find(s => s.ticker === selectedTicker) || stocks[0];
  }, [stocks, selectedTicker]);

  const { news: stockNews, isLoading: newsLoading } = useStockNews(selected?.ticker);

  const topSetups = stocks.slice(0, 3);

  const adjustedTradePlan = useMemo(() => {
    if (!selected) return null;
    const plans = {
      conservative: {
        label: 'Conservative',
        entry: selected.entryZone,
        target: selected.targetZone,
        stop: selected.stopZone,
        sizing: 'Risk 1–2% of account'
      },
      balanced: {
        label: 'Balanced',
        entry: selected.entryZone,
        target: selected.targetZone,
        stop: selected.stopZone,
        sizing: 'Risk 2–4% of account'
      },
      aggressive: {
        label: 'Aggressive',
        entry: selected.entryZone,
        target: selected.targetZone,
        stop: selected.stopZone,
        sizing: 'Risk 4–6% of account'
      }
    };
    return plans[strategyMode as keyof typeof plans];
  }, [selected, strategyMode]);

  const handleRowClick = (stock: Stock) => {
    setSelectedTicker(stock.ticker);
    setActiveTab('detail');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-12">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex flex-col gap-5 rounded-[2rem] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200/60 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/50">
                  <Activity className="h-3.5 w-3.5" />
                  DistressIQ MVP
                </div>
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${isLiveData ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60' : 'bg-amber-50 text-amber-700 ring-amber-200/60'}`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveData ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveData ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </span>
                  {isLiveData ? 'Live data' : 'Demo data'}
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl font-display">
                Pre-delisting opportunity intelligence
              </h1>
              <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-slate-500 md:text-base">
                Rank sub-$2 distressed stocks by bounce probability, delisting risk, operator quality, business strength, and tradability.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col items-end rounded-xl bg-slate-50 px-4 py-2.5 ring-1 ring-slate-200/60 min-w-[140px]">
                <span className="text-xl font-bold tabular-nums text-slate-900 leading-tight">{timeString}</span>
                <span className="text-xs font-medium text-slate-500 mt-0.5">{dateString}</span>
                <span className="text-[10px] font-semibold text-emerald-600 mt-1 uppercase tracking-wide">Real-time</span>
              </div>
              <Button className="rounded-xl px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 transition-all active:scale-95">
                Start Free Trial
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowAlerts(v => !v)}
                  className="rounded-xl px-4 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all active:scale-95 relative"
                >
                  <Bell className="h-4 w-4" />
                  {alertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4.5 min-w-[18px] rounded-full bg-emerald-500 px-1 text-[9px] font-black text-white flex items-center justify-center shadow-sm">
                      {alertCount}
                    </span>
                  )}
                </Button>
                {showAlerts && (
                  <SignalAlertsPanel
                    onClose={() => setShowAlerts(false)}
                    onGoToCycles={() => { setActiveTab('cycles'); setShowAlerts(false); }}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {/* Card helper — renders value, optional delta badge, icon, and a tooltip */}
          {([
            {
              label: 'Active setups',
              value: activeSetups,
              prevValue: prev?.activeSetups ?? null,
              icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
              iconBg: 'bg-blue-50 ring-blue-100',
              tooltip: 'Total sub-$2 stocks currently tracked by DistressIQ that are under active NASDAQ compliance pressure. Each one has been scored for bounce probability and delisting risk.',
              deltaPositiveIsGood: true,
            },
            {
              label: 'High-quality today',
              value: highQuality,
              prevValue: prev?.highQuality ?? null,
              icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
              iconBg: 'bg-emerald-50 ring-emerald-100',
              tooltip: 'Stocks whose bounce probability score is ≥ 65 — meaning the score engine considers them the strongest recovery candidates right now based on price positioning, compliance timeline, and recent price momentum.',
              deltaPositiveIsGood: true,
            },
            {
              label: 'High risk names',
              value: highRisk,
              prevValue: prev?.highRisk ?? null,
              icon: <ShieldAlert className="h-5 w-5 text-rose-600" />,
              iconBg: 'bg-rose-50 ring-rose-100',
              tooltip: 'Stocks whose delisting risk score is ≥ 60 — names approaching or past compliance deadlines with weak financials and limited runway. These are high-risk/high-volatility setups that require tighter risk management.',
              deltaPositiveIsGood: false,
            },
            {
              label: 'Triggered alerts',
              value: triggeredAlerts,
              prevValue: prev?.triggeredAlerts ?? null,
              icon: <Bell className="h-5 w-5 text-amber-600" />,
              iconBg: 'bg-amber-50 ring-amber-100',
              tooltip: 'Real-time alerts fired based on live price conditions: stocks near $1 compliance threshold, price entering entry zones, prices breaching stop levels, and deadline urgency warnings.',
              deltaPositiveIsGood: false,
            },
          ] satisfies Array<{
            label: string;
            value: number;
            prevValue: number | null;
            icon: React.ReactNode;
            iconBg: string;
            tooltip: string;
            deltaPositiveIsGood: boolean;
          }>).map(({ label, value, prevValue, icon, iconBg, tooltip, deltaPositiveIsGood }) => {
            const delta = prevValue !== null ? value - prevValue : null;
            const showDelta = delta !== null && delta !== 0;
            const deltaUp = delta !== null && delta > 0;
            const isPositive = deltaUp === deltaPositiveIsGood;
            return (
              <Card key={label} className="rounded-[1.5rem] shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors focus:outline-none" aria-label={`About ${label}`}>
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[260px] leading-relaxed whitespace-normal">
                            {tooltip}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="mt-1.5 flex items-end gap-2">
                        <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
                        {showDelta && (
                          <span className={`mb-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60'
                          }`}>
                            {deltaUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                            {deltaUp ? '+' : ''}{delta}
                          </span>
                        )}
                      </div>
                      {prevValue !== null && (
                        <p className="mt-1 text-[10px] text-slate-400">vs {prevValue} last session</p>
                      )}
                    </div>
                    <div className={`rounded-2xl p-3 ring-1 shrink-0 ${iconBg}`}>{icon}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Real-time refresh indicator */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveData ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isLiveData ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
          {isLiveData
            ? <>Data refreshes every 60 seconds &mdash; last updated at {lastRefreshedString}</>
            : <>Showing demo data &mdash; live API unavailable</>
          }
        </div>

        {/* Main Interface Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-white p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/60 md:w-[680px] h-auto">
            <TabsTrigger value="scanner" className="rounded-xl py-2.5 text-sm font-medium data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-none">Scanner</TabsTrigger>
            <TabsTrigger value="detail" className="rounded-xl py-2.5 text-sm font-medium data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-none">Stock Detail</TabsTrigger>
            <TabsTrigger value="cycles" className="rounded-xl py-2.5 text-sm font-medium data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-none">Cycle Scanner</TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-xl py-2.5 text-sm font-medium data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-none">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              {/* Left Panel: Scanner Table */}
              <Card className="rounded-[2rem] shadow-sm border-slate-200/60 flex flex-col">
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <CardTitle className="text-xl font-display font-bold">Opportunity scanner</CardTitle>
                      <p className="mt-1.5 text-sm text-slate-500">Filter for orderly sub-$2 names with compliance pressure.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input 
                          value={query} 
                          onChange={(e) => setQuery(e.target.value)} 
                          placeholder="Search ticker or company" 
                          className="rounded-xl pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-slate-200" 
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[200px] rounded-xl bg-slate-50/50 border-slate-200 focus:ring-slate-200">
                          <Filter className="mr-2 h-4 w-4 text-slate-400" />
                          <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="Recovery Candidate">Recovery Candidate</SelectItem>
                          <SelectItem value="Management Action Likely">Management Action Likely</SelectItem>
                          <SelectItem value="High Delisting Risk">High Delisting Risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Status color legend */}
                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Color key</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                      Recovery Candidate
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
                      Management Action Likely
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                      High Delisting Risk
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 flex-1">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold text-slate-600">Ticker</TableHead>
                          <TableHead className="font-semibold text-slate-600">Status</TableHead>
                          <TableHead className="font-semibold text-slate-600">Price</TableHead>
                          <TableHead className="font-semibold text-slate-600">Days &lt; $1</TableHead>
                          <TableHead className="font-semibold text-slate-600">Bounce %</TableHead>
                          <TableHead className="font-semibold text-slate-600">Tradability</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stocks.map((stock) => (
                          <TableRow 
                            key={stock.ticker} 
                            className="cursor-pointer hover:bg-slate-50/80 transition-colors" 
                            onClick={() => handleRowClick(stock)}
                          >
                            <TableCell className="py-4">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{stock.ticker}</span>
                                  <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">{stock.exchange}</span>
                                </div>
                                <div className="text-xs text-slate-500 font-medium">{stock.company}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 font-medium whitespace-nowrap ${statusPill(stock.status)}`}>
                                {stock.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-semibold text-slate-700">${stock.price.toFixed(2)}</span>
                                {(() => { const ts = parseTimestamp(stock.priceTimestamp); return ts ? (
                                  <p className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                                    {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                ) : null; })()}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">{stock.daysUnderOne}</TableCell>
                            <TableCell>
                              <span className={`font-bold ${stock.bounceProbability >= 65 ? 'text-emerald-600' : stock.bounceProbability >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {stock.bounceProbability}%
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-slate-600">{stock.tradabilityScore}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100">Open</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {stocks.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                              No setups found matching your filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Right Panel: Top Setups & Alerts */}
              <div className="space-y-6">
                <Card className="rounded-[2rem] shadow-sm border-slate-200/60">
                  <CardHeader className="pt-6 px-6 pb-4">
                    <CardTitle className="text-xl font-display font-bold">Top setups today</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-6 pb-6">
                    {topSetups.map((stock) => (
                      <button
                        key={stock.ticker}
                        onClick={() => handleRowClick(stock)}
                        className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl font-bold font-display text-slate-900">{stock.ticker}</span>
                              <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${statusPill(stock.status)}`}>{stock.status}</Badge>
                            </div>
                            <p className="mt-1 text-sm font-medium text-slate-500">{stock.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bounce</p>
                            <p className="text-2xl font-bold text-slate-900">{stock.bounceProbability}<span className="text-base text-slate-400">%</span></p>
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 group-hover:bg-white group-hover:ring-slate-200 transition-colors">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entry</p>
                            <p className="mt-1 font-bold text-slate-700">{stock.entryZone}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 group-hover:bg-white group-hover:ring-slate-200 transition-colors">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target</p>
                            <p className="mt-1 font-bold text-slate-700">{stock.targetZone}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 group-hover:bg-white group-hover:ring-slate-200 transition-colors">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Window</p>
                            <p className="mt-1 font-bold text-slate-700">{stock.tradeWindow}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] shadow-sm border-slate-200/60">
                  <CardHeader className="pt-6 px-6 pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-xl font-display font-bold">Today’s triggered alerts</CardTitle>
                      <Badge variant="outline" className="rounded-lg px-2.5 py-1 font-semibold bg-slate-50 text-slate-600 border-slate-200">
                        Watchlist: {watchlist.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    {alerts.slice(0, 4).map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                        <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${alert.severity === 'critical' ? 'text-rose-500' : alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                              {alert.ticker}
                            </span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                              alert.severity === 'critical' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              alert.severity === 'warning'  ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                              'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-auto tabular-nums">
                              {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-relaxed text-slate-700">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detail" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            {selected ? (
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                {/* Left side: Stock Stats & Chart */}
                <div className="space-y-6">
                  <Card className="rounded-[2rem] shadow-sm border-slate-200/60">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h2 className="text-4xl font-bold font-display tracking-tight text-slate-900">{selected.ticker}</h2>
                            <Badge variant="outline" className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${statusPill(selected.status)}`}>{selected.status}</Badge>
                          </div>
                          <p className="text-base font-medium text-slate-500">{selected.company} • {selected.exchange} • {selected.industry}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 min-w-[120px]">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">${selected.price.toFixed(2)}</p>
                            {(() => { const ts = parseTimestamp(selected.priceTimestamp); return ts ? (
                              <p className="mt-1 text-[10px] text-slate-400 tabular-nums">
                                as of {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </p>
                            ) : null; })()}
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 min-w-[120px]">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{selected.volume}</p>
                            {(() => { const ts = parseTimestamp(selected.priceTimestamp); return ts ? (
                              <p className="mt-1 text-[10px] text-slate-400 tabular-nums">
                                {ts.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </p>
                            ) : null; })()}
                          </div>
                        </div>
                      </div>

                      {/* Period selector */}
                      <div className="mt-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                          {PERIODS.map((p) => (
                            <button
                              key={p.value}
                              onClick={() => setChartPeriod(p.value)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                chartPeriod === p.value
                                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 hidden sm:block">{periodDescriptions[chartPeriod]}</p>
                      </div>

                      {/* Chart */}
                      <div className="mt-4 h-[320px] rounded-2xl bg-white border border-slate-100 shadow-inner shadow-slate-100/50 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={historicalData[selected.ticker]?.[chartPeriod] ?? selected.chart}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#475569" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#475569" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                              dataKey="d"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                              dy={10}
                              interval={chartPeriod === '1W' ? 0 : chartPeriod === '1M' ? 3 : chartPeriod === '3M' ? 1 : chartPeriod === '6M' ? 3 : 0}
                            />
                            <YAxis
                              domain={['dataMin - 0.1', 'dataMax + 0.2']}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                              tickFormatter={(val) => `$${val.toFixed(2)}`}
                            />
                            <RechartsTooltip
                              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                            />
                            <ReferenceLine
                              y={1}
                              stroke="#ef4444"
                              strokeDasharray="4 4"
                              label={{ position: 'insideTopLeft', value: '$1 Compliance line', fill: '#ef4444', fontSize: 11, fontWeight: 600, dy: -10 }}
                            />
                            {/* Alert event markers — vertical lines at event dates */}
                            {(stockEvents[selected.ticker]?.[chartPeriod] ?? []).map((ev, i) => (
                              <ReferenceLine
                                key={i}
                                x={ev.d}
                                stroke={eventTypeConfig[ev.type].stroke}
                                strokeDasharray="3 3"
                                strokeOpacity={0.7}
                                strokeWidth={1.5}
                              />
                            ))}
                            <Area
                              type="monotone"
                              dataKey="p"
                              stroke="#334155"
                              fill="url(#priceFill)"
                              strokeWidth={2.5}
                              activeDot={{ r: 5, strokeWidth: 0, fill: '#0f172a' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Event timeline for this period */}
                      {(stockEvents[selected.ticker]?.[chartPeriod] ?? []).length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Events this period</p>
                          <div className="space-y-1.5">
                            {(stockEvents[selected.ticker]?.[chartPeriod] ?? []).map((ev, i) => {
                              const cfg = eventTypeConfig[ev.type];
                              return (
                                <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 ${cfg.bg} ${cfg.border}`}>
                                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cfg.color }} />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-slate-500 mr-2">{ev.d}</span>
                                    <span className={`text-xs font-semibold ${cfg.text}`}>{ev.message}</span>
                                  </div>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                    {cfg.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="rounded-[1.5rem] shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <p className="text-sm font-medium text-slate-500">Days under $1</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{selected.daysUnderOne}</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-[1.5rem] shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <p className="text-sm font-medium text-slate-500">Days to deadline</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{selected.daysToDeadline}</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-[1.5rem] shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <p className="text-sm font-medium text-slate-500">Bounce probability</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{selected.bounceProbability}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Score color legend */}
                  <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Score key</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                      Strong &nbsp;(≥ 70)
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
                      Mixed &nbsp;(50–69)
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                      Weak &nbsp;(&lt; 50)
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <ScoreCard title="Compliance Score" value={selected.complianceScore} icon={TrendingUp} note="Tracks price proximity to $1, time pressure, and cure path quality." />
                    <ScoreCard title="Financial Strength" value={selected.financialScore} icon={DollarSign} note={selected.financialNote} />
                    <ScoreCard title="Operator Score" value={selected.operatorScore} icon={Users} note={selected.operatorNote} />
                    <ScoreCard title="Industry Survival" value={selected.industryScore} icon={Briefcase} note="Some sectors like biotech and EV have structurally worse survival odds." />
                    <ScoreCard title="Pattern Score" value={selected.patternScore} icon={TrendingDown} note="Flags dilution loops, reverse split tendencies, and pop-and-fade behavior." />
                    <ScoreCard title="Tradability" value={selected.tradabilityScore} icon={Building2} note="Measures range quality, liquidity, spread, and movement structure." />
                  </div>

                  {/* Peer comparison */}
                  <PeerComparison
                    selected={selected}
                    allStocks={stocks}
                    onSelect={(stock) => setSelectedTicker(stock.ticker)}
                  />
                </div>

                {/* Right side: Trade Plan & Notes */}
                <div className="space-y-6">
                  <Card className="rounded-[2rem] shadow-sm border-slate-200/60">
                    <CardHeader className="pt-6 px-6 pb-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-xl font-display font-bold">Suggested trade plan</CardTitle>
                        <Select value={strategyMode} onValueChange={setStrategyMode}>
                          <SelectTrigger className="w-[170px] rounded-xl bg-slate-50/50 border-slate-200">
                            <SelectValue placeholder="Strategy mode" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200">
                            <SelectItem value="conservative">Conservative</SelectItem>
                            <SelectItem value="balanced">Balanced</SelectItem>
                            <SelectItem value="aggressive">Aggressive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5 px-6 pb-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-blue-50/50 p-4 ring-1 ring-blue-100">
                          <p className="text-xs font-semibold text-blue-600/70 uppercase tracking-wider">Entry zone</p>
                          <p className="mt-1.5 text-lg font-bold text-slate-900">{adjustedTradePlan?.entry}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50/50 p-4 ring-1 ring-emerald-100">
                          <p className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">Target zone</p>
                          <p className="mt-1.5 text-lg font-bold text-slate-900">{adjustedTradePlan?.target}</p>
                        </div>
                        <div className="rounded-2xl bg-rose-50/50 p-4 ring-1 ring-rose-100">
                          <p className="text-xs font-semibold text-rose-600/70 uppercase tracking-wider">Stop</p>
                          <p className="mt-1.5 text-lg font-bold text-slate-900">{adjustedTradePlan?.stop}</p>
                        </div>
                        <div className="rounded-2xl bg-amber-50/50 p-4 ring-1 ring-amber-100">
                          <p className="text-xs font-semibold text-amber-600/70 uppercase tracking-wider">Time window</p>
                          <p className="mt-1.5 text-lg font-bold text-slate-900">{selected.tradeWindow}</p>
                        </div>
                      </div>
                      
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-5">
                        <p className="text-sm font-bold text-slate-900">Interpretation</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          This is a probability-driven setup, not a guarantee. The model favors structured entries before a potential compliance push and exits into strength rather than long-term holding.
                        </p>
                      </div>
                      
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-5">
                        <p className="text-sm font-bold text-slate-900">Position sizing</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{adjustedTradePlan?.sizing}</p>
                      </div>
                      
                      <Button 
                        size="lg"
                        className={`w-full rounded-xl font-bold transition-all shadow-sm ${
                          watchlist.includes(selected.ticker) 
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300' 
                            : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md'
                        }`}
                        onClick={() => toggleWatchlist(selected.ticker)}
                      >
                        {watchlist.includes(selected.ticker) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2rem] shadow-sm border-slate-200/60">
                    <CardHeader className="pt-6 px-6 pb-4">
                      <CardTitle className="text-xl font-display font-bold">Model notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 px-6 pb-6 text-sm text-slate-600">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
                        <p className="font-bold text-slate-900">Why this score is not higher</p>
                        <p className="mt-2 leading-relaxed">Low-priced names can still fail even when they approach $1, especially if business quality is weak or dilution pressure returns.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
                        <p className="font-bold text-slate-900">What would improve this setup</p>
                        <p className="mt-2 leading-relaxed">Tighter price action near support, improving dollar volume, cleaner capital behavior, and signs the company can regain compliance without extreme corporate actions.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
                        <p className="font-bold text-slate-900">What would break the thesis</p>
                        <p className="mt-2 leading-relaxed">Fresh dilution, failed support zones, worsening runway, or additional exchange deficiencies beyond price.</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live News Card */}
                  <Card className="rounded-[2rem] shadow-sm border-slate-200/60">
                    <CardHeader className="pt-6 px-6 pb-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-xl bg-blue-50 p-2 ring-1 ring-blue-100">
                            <Newspaper className="h-4 w-4 text-blue-600" />
                          </div>
                          <CardTitle className="text-xl font-display font-bold">Live news</CardTitle>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${stockNews.length > 0 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60' : 'bg-slate-50 text-slate-500 ring-slate-200/60'}`}>
                          <span className="relative flex h-1.5 w-1.5">
                            {stockNews.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${stockNews.length > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          </span>
                          {stockNews.length > 0 ? 'Live' : 'No feed'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      {newsLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-4 h-20" />
                          ))}
                        </div>
                      ) : stockNews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 py-8 text-center">
                          <Newspaper className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-sm font-medium text-slate-500">No recent news found for {selected.ticker}</p>
                          <p className="text-xs text-slate-400 mt-1">Try again later or check external sources</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {stockNews.map((item: StockNewsItem) => (
                            <a
                              key={item.id}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            >
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover bg-slate-100"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                                    {item.title}
                                  </p>
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-blue-400 mt-0.5 transition-colors" />
                                </div>
                                {item.summary && (
                                  <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">{item.summary}</p>
                                )}
                                <div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-slate-400">
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.source}</span>
                                  <span>·</span>
                                  <span className="tabular-nums">
                                    {new Date(item.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <p className="text-slate-500 font-medium">Select a setup from the Scanner to view details.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cycles" className="focus-visible:outline-none focus-visible:ring-0">
            <CycleScanner />
          </TabsContent>

          <TabsContent value="pricing" className="focus-visible:outline-none focus-visible:ring-0">
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto py-8">
              {[
                {
                  title: 'Starter',
                  price: '$49',
                  description: 'Perfect for part-time traders looking for the best daily setups.',
                  items: ['Live scanner', 'Daily ranked list', 'Basic watchlist', 'Core scoring model'],
                  button: 'Start Trial',
                  popular: false
                },
                {
                  title: 'Pro Signals',
                  price: '$149',
                  description: 'Complete intelligence for dedicated small-cap operators.',
                  items: ['Everything in Starter', 'Trade plan module', 'Real-time alerts', 'Top setups feed'],
                  button: 'Upgrade to Pro',
                  popular: true
                },
                {
                  title: 'Desk / API',
                  price: '$799',
                  description: 'Institutional-grade data access and customized filtering.',
                  items: ['Everything in Pro', 'API access', 'Bulk exports', 'Advanced analytics'],
                  button: 'Contact Sales',
                  popular: false
                }
              ].map((plan, idx) => (
                <motion.div 
                  key={plan.title} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                  className="relative h-full"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                      <span className="rounded-full bg-slate-900 px-4 py-1 text-xs font-bold text-white shadow-md">Most Popular</span>
                    </div>
                  )}
                  <Card className={`h-full rounded-[2rem] shadow-sm transition-all duration-300 hover:shadow-xl ${plan.popular ? 'border-slate-400 ring-2 ring-slate-900/5' : 'border-slate-200/60'}`}>
                    <CardHeader className="p-8 pb-4 text-center">
                      <CardTitle className="text-2xl font-display font-bold text-slate-900">{plan.title}</CardTitle>
                      <p className="mt-2 text-sm text-slate-500 px-4">{plan.description}</p>
                      <div className="mt-6 flex items-baseline justify-center">
                        <span className="text-5xl font-extrabold tracking-tight text-slate-900">{plan.price}</span>
                        <span className="ml-1 text-base font-medium text-slate-500">/ month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 flex flex-col h-[calc(100%-200px)]">
                      <div className="space-y-4 flex-1 mt-4">
                        {plan.items.map((item) => (
                          <div key={item} className="flex items-center gap-3">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100">
                              <svg className="h-3 w-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="text-sm font-medium text-slate-600">{item}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        size="lg" 
                        className={`w-full mt-8 rounded-xl font-bold ${plan.popular ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                      >
                        {plan.button}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
