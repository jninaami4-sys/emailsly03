import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Silently refreshes React Query caches every minute so the app stays snappy
 * without a visible reload. Also prunes inactive queries to free memory.
 */
export function CacheJanitor({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tick = () => {
      if (document.hidden) return;
      // Background refetch of active queries — no spinners, no route reload.
      queryClient.invalidateQueries({ refetchType: "active" });
      // Drop cached data for queries no component is currently observing.
      queryClient.getQueryCache().getAll().forEach((q) => {
        if (q.getObserversCount() === 0) queryClient.removeQueries({ queryKey: q.queryKey, exact: true });
      });
    };

    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [queryClient, intervalMs]);

  return null;
}
