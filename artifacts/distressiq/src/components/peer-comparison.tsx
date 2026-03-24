import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { statusPill } from '@/lib/scoring';
import { historicalData } from '@/lib/history-data';
import type { Stock } from '@workspace/api-client-react';

interface PeerComparisonProps {
  selected: Stock;
  allStocks: Stock[];
  onSelect: (stock: Stock) => void;
}

function getPeers(selected: Stock, allStocks: Stock[]): Stock[] {
  const others = allStocks.filter(s => s.ticker !== selected.ticker);
  const sameIndustry = others.filter(s => s.industry === selected.industry);
  const sameStatus = others.filter(s => s.status === selected.status && s.industry !== selected.industry);
  const rest = others.filter(s => s.status !== selected.status && s.industry !== selected.industry);
  return [...sameIndustry, ...sameStatus, ...rest].slice(0, 3);
}

function MiniSparkline({ ticker, color }: { ticker: string; color: string }) {
  const data = historicalData[ticker]?.['3M'] ?? [];
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <Line
          type="monotone"
          dataKey="p"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          activeDot={false}
        />
        <Tooltip
          contentStyle={{ display: 'none' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function metricDiff(val: number, refVal: number) {
  const diff = val - refVal;
  if (Math.abs(diff) < 2) return null;
  return diff;
}

export function PeerComparison({ selected, allStocks, onSelect }: PeerComparisonProps) {
  const peers = getPeers(selected, allStocks);

  if (peers.length === 0) return null;

  return (
    <Card className="rounded-[2rem] shadow-sm border-slate-200/60">
      <CardHeader className="pt-6 px-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display font-bold">Peer comparison</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Stocks with similar compliance pressure or sector profile to {selected.ticker}.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        {peers.map((peer) => {
          const sparkColor = peer.bounceProbability >= 65 ? '#10b981' : peer.bounceProbability >= 50 ? '#f59e0b' : '#ef4444';
          const bounceDiff = metricDiff(peer.bounceProbability, selected.bounceProbability);
          const complianceDiff = metricDiff(peer.complianceScore, selected.complianceScore);
          const sameIndustry = peer.industry === selected.industry;

          return (
            <div
              key={peer.ticker}
              className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-slate-900">{peer.ticker}</span>
                    <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${statusPill(peer.status)}`}>
                      {peer.status}
                    </Badge>
                    {sameIndustry && (
                      <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-200">
                        Same sector
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">{peer.company} · {peer.industry}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
                  onClick={() => onSelect(peer)}
                >
                  View <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Sparkline */}
              <div className="mb-3 -mx-1">
                <MiniSparkline ticker={peer.ticker} color={sparkColor} />
              </div>

              {/* Metric comparison grid */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Price */}
                <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Price</p>
                  <p className="mt-1 font-bold text-slate-800">${peer.price.toFixed(2)}</p>
                </div>
                {/* Bounce with diff */}
                <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Bounce %</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className={`font-bold ${peer.bounceProbability >= 65 ? 'text-emerald-600' : peer.bounceProbability >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {peer.bounceProbability}%
                    </span>
                    {bounceDiff !== null && (
                      <span className={`text-[10px] font-semibold flex items-center ${bounceDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {bounceDiff > 0
                          ? <TrendingUp className="h-3 w-3" />
                          : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(bounceDiff)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Compliance with diff */}
                <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Compliance</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="font-bold text-slate-800">{peer.complianceScore}</span>
                    {complianceDiff !== null && (
                      <span className={`text-[10px] font-semibold flex items-center ${complianceDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {complianceDiff > 0
                          ? <TrendingUp className="h-3 w-3" />
                          : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(complianceDiff)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Days under $1 bar */}
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                <span className="font-medium shrink-0">Days under $1:</span>
                <div className="flex-1 rounded-full bg-slate-100 h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${peer.daysUnderOne > 150 ? 'bg-rose-400' : peer.daysUnderOne > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(100, (peer.daysUnderOne / 270) * 100)}%` }}
                  />
                </div>
                <span className="font-bold text-slate-700 shrink-0">{peer.daysUnderOne}d</span>
              </div>
            </div>
          );
        })}

        {/* Sector summary */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mt-2">
          <p className="text-xs font-bold text-slate-700 mb-1">Sector context</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            {selected.industry === 'Biotech' &&
              'Biotech names in compliance distress frequently fail even near the $1 line due to binary pipeline risk. Peer behavior often diverges sharply on data readouts.'}
            {selected.industry === 'EV' &&
              'EV distressed names are heavily retail-driven. Volume spikes are common but rarely sustain. Capital markets remain the primary cure mechanism.'}
            {selected.industry === 'MedTech' &&
              'MedTech names with device-driven revenue can stabilize compliance more predictably than pure biotech. Operator track record matters most here.'}
            {selected.industry === 'Media / Esports' &&
              'Media and esports names under compliance pressure have structurally weak survival odds. Revenues tend to fall faster than management can pivot.'}
            {!['Biotech','EV','MedTech','Media / Esports'].includes(selected.industry) &&
              'Cross-sector peers under compliance pressure tend to share capital markets dependency regardless of underlying business quality.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
