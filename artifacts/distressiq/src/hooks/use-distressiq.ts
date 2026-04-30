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
  useRemoveFromWatchlist,
  useGetStockNews,
  getGetStockNewsQueryKey,
  type StockNewsItem,
} from "@workspace/api-client-react";
import { mockStockData, mockAlerts, mockWatchlist } from "@/lib/mock-data";
import { cyclicStocks, applyRealPrices, type CyclicStock } from "@/lib/cycle-data";

export { type StockNewsItem };

export function useDashboardStocks(params?: { q?: string; status?: string }) {
  const query = useListStocks(params, { query: { queryKey: getListStocksQueryKey(params), retry: 2, staleTime: 60000, refetchInterval: 60_000 } });
  
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
    refetchInterval: 60_000,
    retry: 2,
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
  const query = useListAlerts({ query: { queryKey: getListAlertsQueryKey(), retry: 2, staleTime: 60000, refetchInterval: 60_000 } });
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
    refetchInterval: 60_000,
    retry: 2,
  });

  if (!priceMap) return cyclicStocks;
  return applyRealPrices(cyclicStocks, priceMap);
}

// Custom hook to manage watchlist, falling back to localStorage if API is unavailable
export function useLocalWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('distressiq-watchlist') : null;
    return saved ? JSON.parse(saved) : mockWatchlist;
  });

  const apiQuery = useGetWatchlist({ query: { queryKey: getGetWatchlistQueryKey(), retry: 2, staleTime: 60000, refetchInterval: 60_000 } });
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

/**
 * Fetch live news for a specific stock ticker.
 * Returns an empty array when the ticker is not provided or the API is unavailable.
 */
export function useStockNews(ticker: string | undefined, limit = 8) {
  const query = useGetStockNews(
    ticker ?? "",
    { limit },
    {
      query: {
        queryKey: getGetStockNewsQueryKey(ticker ?? "", { limit }),
        enabled: !!ticker,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
      },
    },
  );
  return { news: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}
