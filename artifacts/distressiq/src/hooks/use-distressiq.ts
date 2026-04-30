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
import { cyclicStocks, applyRealPrices, type CyclicStock } from "@/lib/cycle-data";
import type { Period } from "@/lib/history-data";

export function useDashboardStocks(params?: { q?: string; status?: string }) {
  const query = useListStocks(params, { query: { queryKey: getListStocksQueryKey(params), retry: false, staleTime: 60000 } });
  
  const stocks = query.data ?? [];

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

  return { ...query, data, isLiveData: query.data != null };
}

export function useDashboardAlerts() {
  const query = useListAlerts({ query: { queryKey: getListAlertsQueryKey(), retry: false, staleTime: 60000 } });
  return { ...query, data: query.data ?? [], isLiveData: query.data != null };
}

/**
 * Fetches live price history for a given ticker and UI period.
 * Falls back to an empty array when the API is unavailable.
 */
export function useStockHistory(ticker: string | undefined, period: Period) {
  const staleTimes: Record<Period, number> = {
    "1W": 5 * 60_000,
    "1M": 30 * 60_000,
    "3M": 2 * 60 * 60_000,
    "6M": 4 * 60 * 60_000,
    "1Y": 6 * 60 * 60_000,
  };
  return useQuery<{ d: string; p: number }[]>({
    queryKey: ["stock-history", ticker, period],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${ticker}/history?period=${period}`);
      if (!res.ok) throw new Error(`history fetch failed: ${res.status} ${res.statusText}`);
      return res.json();
    },
    staleTime: staleTimes[period] ?? 60_000,
    retry: false,
    enabled: !!ticker,
  });
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

// Custom hook to manage watchlist, falling back to localStorage if API is unavailable
export function useLocalWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('distressiq-watchlist') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const apiQuery = useGetWatchlist({ query: { queryKey: getGetWatchlistQueryKey(), retry: false, staleTime: 60000 } });
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  // Sync from API to local state if API succeeds
  useEffect(() => {
    if (apiQuery.data?.tickers) {
      setWatchlist(apiQuery.data.tickers);
    }
  }, [apiQuery.data]);

  // Sync to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('distressiq-watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist]);

  const toggleWatchlist = async (ticker: string) => {
    const isTracked = watchlist.includes(ticker);
    
    // Optimistic local update
    setWatchlist(prev => 
      isTracked ? prev.filter(t => t !== ticker) : [...prev, ticker]
    );

    // Attempt API update
    try {
      if (isTracked) {
        await removeMutation.mutateAsync({ ticker });
      } else {
        await addMutation.mutateAsync({ ticker });
      }
    } catch (e) {
      // API silently fails, we rely on optimistic local state
      console.warn("API watchlist update failed, using local state", e);
    }
  };

  return { watchlist, toggleWatchlist };
}
