import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Pencil, Check, X, Star, TrendingUp, TrendingDown,
  BookMarked, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { statusPill } from '@/lib/scoring';
import type { WatchlistEntry } from '@/hooks/use-distressiq';
import type { Stock } from '@workspace/api-client-react';

interface WatchlistTabProps {
  watchlists: WatchlistEntry[];
  activeListId: string;
  setActiveListId: (id: string) => void;
  activeList: WatchlistEntry | undefined;
  stocks: Stock[];
  onToggleTicker: (ticker: string, listId?: string) => void;
  onCreateWatchlist: (name: string) => void;
  onDeleteWatchlist: (id: string) => void;
  onRenameWatchlist: (id: string, name: string) => void;
  onViewDetail: (ticker: string) => void;
}

export function WatchlistTab({
  watchlists,
  activeListId,
  setActiveListId,
  activeList,
  stocks,
  onToggleTicker,
  onCreateWatchlist,
  onDeleteWatchlist,
  onRenameWatchlist,
  onViewDetail,
}: WatchlistTabProps) {
  const [newListName, setNewListName] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [addTickerValue, setAddTickerValue] = useState('');

  const tickers = activeList?.tickers ?? [];
  const watchedStocks = stocks.filter(s => tickers.includes(s.ticker));

  // Stocks tracked in the watchlist but not returned by the scanner (e.g. filtered out)
  const missingTickers = tickers.filter(t => !stocks.some(s => s.ticker === t));

  const handleCreateList = () => {
    const name = newListName.trim();
    if (!name) return;
    onCreateWatchlist(name);
    setNewListName('');
    setShowNewListInput(false);
  };

  const handleRenameSubmit = (id: string) => {
    onRenameWatchlist(id, editingName);
    setEditingListId(null);
    setEditingName('');
  };

  const handleAddTicker = () => {
    const t = addTickerValue.trim().toUpperCase();
    if (!t) return;
    if (!tickers.includes(t)) {
      onToggleTicker(t, activeListId);
    }
    setAddTickerValue('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar: Watchlist Selector */}
        <div className="space-y-3">
          <Card className="rounded-[2rem] shadow-sm border-slate-200/60">
            <CardHeader className="pt-6 px-6 pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-display font-bold flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-slate-500" />
                  My Lists
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  onClick={() => setShowNewListInput(v => !v)}
                  title="Create new watchlist"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-4 space-y-1">
              <AnimatePresence>
                {showNewListInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-1.5 pb-2 px-1">
                      <Input
                        autoFocus
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreateList(); if (e.key === 'Escape') { setShowNewListInput(false); setNewListName(''); } }}
                        placeholder="List name…"
                        className="h-8 rounded-lg text-xs bg-slate-50 border-slate-200 focus-visible:ring-slate-200"
                      />
                      <Button size="sm" className="h-8 px-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800" onClick={handleCreateList}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {watchlists.map(list => (
                <div key={list.id} className="group relative">
                  {editingListId === list.id ? (
                    <div className="flex gap-1.5 px-1 py-0.5">
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(list.id); if (e.key === 'Escape') { setEditingListId(null); } }}
                        className="h-8 rounded-lg text-xs bg-slate-50 border-slate-200 focus-visible:ring-slate-200"
                      />
                      <Button size="sm" className="h-8 px-2 rounded-lg" onClick={() => handleRenameSubmit(list.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2 rounded-lg" onClick={() => setEditingListId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveListId(list.id)}
                      className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        activeListId === list.id
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Star className={`h-3.5 w-3.5 shrink-0 ${activeListId === list.id ? 'text-amber-400' : 'text-slate-300'}`} />
                        <span className="text-sm truncate">{list.name}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        activeListId === list.id ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {list.tickers.length}
                      </span>
                    </button>
                  )}

                  {/* Hover actions */}
                  {editingListId !== list.id && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                      <button
                        className="h-6 w-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                        onClick={e => { e.stopPropagation(); setEditingListId(list.id); setEditingName(list.name); }}
                        title="Rename"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      {list.id !== 'default' && (
                        <button
                          className="h-6 w-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          onClick={e => { e.stopPropagation(); onDeleteWatchlist(list.id); }}
                          title="Delete list"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main panel: Tickers in selected list */}
        <Card className="rounded-[2rem] shadow-sm border-slate-200/60 flex flex-col">
          <CardHeader className="pt-6 px-6 pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-display font-bold">
                  {activeList?.name ?? 'Watchlist'}
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  {tickers.length === 0
                    ? 'No tickers tracked yet — add one below.'
                    : `Tracking ${tickers.length} ticker${tickers.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              {/* Add ticker input */}
              <form
                onSubmit={e => { e.preventDefault(); handleAddTicker(); }}
                className="flex gap-2 w-full sm:w-auto"
              >
                <Input
                  value={addTickerValue}
                  onChange={e => setAddTickerValue(e.target.value.toUpperCase())}
                  placeholder="Add ticker (e.g. AAPL)"
                  className="rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-slate-200 w-full sm:w-48 uppercase"
                  maxLength={10}
                />
                <Button
                  type="submit"
                  className="rounded-xl px-4 bg-slate-900 hover:bg-slate-800 text-white shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add
                </Button>
              </form>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6 flex-1">
            {tickers.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                <BookMarked className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-400">Add tickers to get started</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-600">Ticker</TableHead>
                      <TableHead className="font-semibold text-slate-600">Status</TableHead>
                      <TableHead className="font-semibold text-slate-600">Price</TableHead>
                      <TableHead className="font-semibold text-slate-600">Bounce %</TableHead>
                      <TableHead className="font-semibold text-slate-600">Delisting Risk</TableHead>
                      <TableHead className="font-semibold text-slate-600">Entry</TableHead>
                      <TableHead className="font-semibold text-slate-600">Target</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watchedStocks.map(stock => (
                      <TableRow
                        key={stock.ticker}
                        className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                        onClick={() => onViewDetail(stock.ticker)}
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
                          <span className="font-semibold text-slate-700">${stock.price.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${stock.bounceProbability >= 65 ? 'text-emerald-600' : stock.bounceProbability >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {stock.bounceProbability}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${stock.delistingRisk >= 60 ? 'text-rose-600' : stock.delistingRisk >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {stock.delistingRisk}%
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">{stock.entryZone}</TableCell>
                        <TableCell className="text-slate-600 text-sm">{stock.targetZone}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              onClick={e => { e.stopPropagation(); onViewDetail(stock.ticker); }}
                            >
                              Open
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-2"
                              title="Remove from watchlist"
                              onClick={e => { e.stopPropagation(); onToggleTicker(stock.ticker, activeListId); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Tickers not in scanner data */}
                    {missingTickers.map(ticker => (
                      <TableRow key={ticker} className="opacity-60">
                        <TableCell className="py-4">
                          <div>
                            <span className="font-bold text-slate-900">{ticker}</span>
                            <div className="text-xs text-slate-400">Not in scanner</div>
                          </div>
                        </TableCell>
                        <TableCell colSpan={6}>
                          <span className="text-xs text-slate-400">No scanner data available for this ticker</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-2"
                            title="Remove from watchlist"
                            onClick={() => onToggleTicker(ticker, activeListId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
