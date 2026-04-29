import { useEffect, useState } from 'react';
import { useDataFeedStatus } from '@/hooks/use-distressiq';

function useElapsedSeconds(epochMs: number | null): number | null {
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    if (epochMs === null) {
      setElapsed(null);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - epochMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [epochMs]);

  return elapsed;
}

function formatElapsed(seconds: number): string {
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m ago`;
}

export function LiveDataIndicator() {
  const { status, lastUpdatedAt, isFetching } = useDataFeedStatus();
  const elapsed = useElapsedSeconds(lastUpdatedAt);

  const config = {
    live: {
      dot: 'bg-emerald-500',
      pulse: 'animate-ping bg-emerald-400',
      label: isFetching ? 'Updating…' : 'Live data',
      text: 'text-emerald-700',
      ring: 'ring-emerald-100',
      bg: 'bg-emerald-50',
    },
    stale: {
      dot: 'bg-amber-400',
      pulse: 'bg-amber-300',
      label: 'Data delayed',
      text: 'text-amber-700',
      ring: 'ring-amber-100',
      bg: 'bg-amber-50',
    },
    error: {
      dot: 'bg-rose-500',
      pulse: 'bg-rose-400',
      label: 'Feed offline',
      text: 'text-rose-700',
      ring: 'ring-rose-100',
      bg: 'bg-rose-50',
    },
    loading: {
      dot: 'bg-slate-400',
      pulse: 'animate-ping bg-slate-300',
      label: 'Connecting…',
      text: 'text-slate-600',
      ring: 'ring-slate-200',
      bg: 'bg-slate-100',
    },
  } as const;

  const cfg = config[status];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full ${cfg.bg} px-3 py-1.5 text-xs font-semibold ${cfg.text} ring-1 ${cfg.ring}`}
      title={lastUpdatedAt ? `Last price update: ${new Date(lastUpdatedAt).toLocaleTimeString()}` : undefined}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.pulse}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
      </span>

      <span>{cfg.label}</span>

      {elapsed !== null && status !== 'error' && (
        <span className="opacity-60">{formatElapsed(elapsed)}</span>
      )}
    </div>
  );
}
