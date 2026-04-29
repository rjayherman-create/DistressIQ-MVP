import { useState, useEffect, useRef } from "react";
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
  
  // Robust fallback pattern
  const data = query.data ?? mockStockData.filter(s => {
    const matchQuery = !params?.q || `${s.ticker} ${s.company} ${s.industry}`.toLowerCase().includes(params.q.toLowerCase());
    const matchStatus = !params?.status || params.status === 'all' || s.status === params.status;
    return matchQuery && matchStatus;
  }).sort((a, b) => b.bounceProbability - a.bounceProbability);

  return { ...query, data };
}

export function useDashboardAlerts() {
  const query = useListAlerts({ query: { queryKey: getListAlertsQueryKey(), retry: false, staleTime: 60000 } });
  return { ...query, data: query.data ?? mockAlerts };
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

// Probe tickers used solely to check whether the live price feed is reachable
const PROBE_TICKERS = "MVST,MULN,IDEX";

export type DataFeedStatus = "live" | "stale" | "error" | "loading";

export interface DataFeedState {
  status: DataFeedStatus;
  lastUpdatedAt: number | null; // epoch ms of most recent successful fetch
  isFetching: boolean;
}

/**
 * Polls /api/prices every 60 seconds to determine whether the app is
 * receiving real-time stock data.
 */
export function useDataFeedStatus(): DataFeedState {
  const lastSuccessRef = useRef<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const { isFetching, isError, isSuccess } = useQuery<Record<string, number>>({
    queryKey: ["data-feed-probe"],
    queryFn: async () => {
      const res = await fetch(`/api/prices?tickers=${PROBE_TICKERS}`);
      if (!res.ok) throw new Error(`prices probe failed: ${res.status}`);
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (isSuccess) {
      const now = Date.now();
      lastSuccessRef.current = now;
      setLastUpdatedAt(now);
    }
  }, [isSuccess]);

  let status: DataFeedStatus = "loading";
  if (isError) {
    status = lastSuccessRef.current ? "stale" : "error";
  } else if (isSuccess) {
    status = "live";
  } else if (isFetching) {
    status = "loading";
  }

  return { status, lastUpdatedAt, isFetching };
}

// Custom hook to manage watchlist, falling back to localStorage if API is unavailable
export function useLocalWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('distressiq-watchlist') : null;
    return saved ? JSON.parse(saved) : mockWatchlist;
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
