import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  useListStocks,
  getListStocksQueryKey,
  useListAlerts,
  getListAlertsQueryKey,
  useGetWatchlist,
  getGetWatchlistQueryKey,
  useAddToWatchlist,
  useRemoveFromWatchlist
} from "@workspace/api-client-react";
import { mockStockData, mockAlerts, mockWatchlist } from "@/lib/mock-data";
import { cyclicStocks, applyRealPrices, type CyclicStock } from "@/lib/cycle-data";

export function useDashboardStocks(params?: { q?: string; status?: string }) {
  const query = useListStocks(params, { query: { queryKey: getListStocksQueryKey(params), retry: false, staleTime: 60000 } });
  
  // Robust fallback pattern — only use mock data once the query has settled
  // (isLoading false).  During the initial fetch we still show mock data so
  // the UI isn't empty, but isLiveData reflects whether the API succeeded.
  const stocks = query.data ?? mockStockData.filter(s => {
    const matchQuery = !params?.q || `${s.ticker} ${s.company} ${s.industry}`.toLowerCase().includes(params.q.toLowerCase());
    const matchStatus = !params?.status || params.status === 'all' || s.status === params.status;
    return matchQuery && matchStatus;
  }).sort((a, b) => b.bounceProbability - a.bounceProbability);

  // Enrich with live prices from /api/prices
  const tickers = stocks.map((s) => s.ticker).join(",");
  const { data: priceMap } = useQuery<Record<string, number>>({
    queryKey: ["dashboard-live-prices", tickers],
    queryFn: async () => {
      const res = await fetch(`/api/prices?tickers=${tickers}`);
      if (!res.ok) throw new Error(`prices fetch failed: ${res.status} ${res.statusText}`);
      return res.json();
    },
    staleTime: 60_000,
    retry: false,
    enabled: tickers.length > 0,
  });

  const now = new Date().toISOString();
  const data = priceMap
    ? stocks.map((s) =>
        priceMap[s.ticker] != null
          ? { ...s, price: priceMap[s.ticker], priceTimestamp: now }
          : s,
      )
    : stocks;

  // isLiveData is true when the API returned real stock data.
  // While the query is still loading we leave it false (UI shows Demo briefly)
  // but once it resolves successfully it flips to true.
  return { ...query, data, isLiveData: query.data != null };
}

export function useDashboardAlerts() {
  const query = useListAlerts({ query: { queryKey: getListAlertsQueryKey(), retry: false, staleTime: 60000 } });
  return { ...query, data: query.data ?? mockAlerts, isLiveData: query.data != null };
}

/**
 * Returns cyclicStocks with currentPrice fields updated from the live
 * /api/prices endpoint.  Falls back to the synthetic prices when the API
 * is unavailable.
 */
export function useCyclicStocks(): CyclicStock[] {
  const tickers = cyclicStocks.map((s) => s.ticker).join(",");

  const { data: priceMap } = useQuery<Record<string, number>>({
    queryKey: ["cyclic-prices", tickers],
    queryFn: async () => {
      const res = await fetch(`/api/prices?tickers=${tickers}`);
      if (!res.ok) throw new Error(`prices fetch failed: ${res.status} ${res.statusText}`);
      return res.json();
    },
    staleTime: 60_000,
    retry: false,
  });

  if (!priceMap) return cyclicStocks;
  return applyRealPrices(cyclicStocks, priceMap);
}

// ---------------------------------------------------------------------------
// Multi-watchlist support
// ---------------------------------------------------------------------------

export interface WatchlistEntry {
  id: string;
  name: string;
  tickers: string[];
  createdAt: string;
}

const WATCHLISTS_KEY = 'distressiq-watchlists';
const DEFAULT_LIST_ID = 'default';

function loadWatchlists(): WatchlistEntry[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(WATCHLISTS_KEY) : null;
    if (raw) return JSON.parse(raw) as WatchlistEntry[];
  } catch { /* ignore */ }
  // Seed with a default list pre-populated from mockWatchlist
  return [
    {
      id: DEFAULT_LIST_ID,
      name: 'My Watchlist',
      tickers: mockWatchlist,
      createdAt: new Date().toISOString(),
    },
  ];
}

function persistWatchlists(lists: WatchlistEntry[]): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WATCHLISTS_KEY, JSON.stringify(lists));
    }
  } catch { /* storage unavailable */ }
}

// Custom hook to manage watchlist, falling back to localStorage if API is unavailable
export function useLocalWatchlist() {
  const [watchlists, setWatchlists] = useState<WatchlistEntry[]>(loadWatchlists);
  const [activeListId, setActiveListId] = useState<string>(DEFAULT_LIST_ID);

  const apiQuery = useGetWatchlist({ query: { queryKey: getGetWatchlistQueryKey(), retry: false, staleTime: 60000 } });
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  // Sync default list from API tickers when API succeeds
  useEffect(() => {
    if (apiQuery.data?.tickers) {
      setWatchlists(prev => {
        const updated = prev.map(l =>
          l.id === DEFAULT_LIST_ID ? { ...l, tickers: apiQuery.data!.tickers } : l
        );
        persistWatchlists(updated);
        return updated;
      });
    }
  }, [apiQuery.data]);

  // Persist any time watchlists change
  useEffect(() => {
    persistWatchlists(watchlists);
  }, [watchlists]);

  // Derive the active list and its tickers
  const activeList = watchlists.find(l => l.id === activeListId) ?? watchlists[0];
  const watchlist = activeList?.tickers ?? [];

  const toggleWatchlist = async (ticker: string, listId?: string) => {
    const targetId = listId ?? activeListId;
    const upper = ticker.toUpperCase();
    // Capture whether the ticker is currently tracked in the target list before updating state
    const targetList = watchlists.find(l => l.id === targetId);
    const wasTracked = targetList?.tickers.includes(upper) ?? false;
    setWatchlists(prev =>
      prev.map(l => {
        if (l.id !== targetId) return l;
        const isTracked = l.tickers.includes(upper);
        return { ...l, tickers: isTracked ? l.tickers.filter(t => t !== upper) : [...l.tickers, upper] };
      })
    );
    // Sync default list with API
    if (targetId === DEFAULT_LIST_ID) {
      try {
        if (wasTracked) {
          await removeMutation.mutateAsync({ ticker: upper });
        } else {
          await addMutation.mutateAsync({ ticker: upper });
        }
      } catch (e) {
        console.warn("API watchlist update failed, using local state", e);
      }
    }
  };

  const createWatchlist = (name: string): WatchlistEntry => {
    const entry: WatchlistEntry = {
      id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'New Watchlist',
      tickers: [],
      createdAt: new Date().toISOString(),
    };
    setWatchlists(prev => [...prev, entry]);
    setActiveListId(entry.id);
    return entry;
  };

  const deleteWatchlist = (id: string) => {
    if (id === DEFAULT_LIST_ID) return; // protect default list
    setWatchlists(prev => {
      const next = prev.filter(l => l.id !== id);
      if (activeListId === id) setActiveListId(next[0]?.id ?? DEFAULT_LIST_ID);
      return next;
    });
  };

  const renameWatchlist = (id: string, name: string) => {
    setWatchlists(prev =>
      prev.map(l => (l.id === id ? { ...l, name: name.trim() || l.name } : l))
    );
  };

  return {
    watchlists,
    activeListId,
    setActiveListId,
    activeList,
    watchlist,
    toggleWatchlist,
    createWatchlist,
    deleteWatchlist,
    renameWatchlist,
  };
}
