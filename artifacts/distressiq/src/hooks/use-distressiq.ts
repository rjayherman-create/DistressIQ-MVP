import { useState, useEffect } from "react";
import { 
  useListStocks, 
  useListAlerts, 
  useGetWatchlist,
  useAddToWatchlist,
  useRemoveFromWatchlist
} from "@workspace/api-client-react";
import { mockStockData, mockAlerts, mockWatchlist } from "@/lib/mock-data";

export function useDashboardStocks(params?: { q?: string; status?: string }) {
  const query = useListStocks(params, { query: { retry: false, staleTime: 60000 } });
  
  // Robust fallback pattern
  const data = query.data ?? mockStockData.filter(s => {
    const matchQuery = !params?.q || `${s.ticker} ${s.company} ${s.industry}`.toLowerCase().includes(params.q.toLowerCase());
    const matchStatus = !params?.status || params.status === 'all' || s.status === params.status;
    return matchQuery && matchStatus;
  }).sort((a, b) => b.bounceProbability - a.bounceProbability);

  return { ...query, data };
}

export function useDashboardAlerts() {
  const query = useListAlerts({ query: { retry: false, staleTime: 60000 } });
  return { ...query, data: query.data ?? mockAlerts };
}

// Custom hook to manage watchlist, falling back to localStorage if API is unavailable
export function useLocalWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('distressiq-watchlist') : null;
    return saved ? JSON.parse(saved) : mockWatchlist;
  });

  const apiQuery = useGetWatchlist({ query: { retry: false, staleTime: 60000 } });
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
