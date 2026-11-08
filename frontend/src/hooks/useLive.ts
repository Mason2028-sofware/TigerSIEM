import { useEffect, useState } from "react";
import { POLL_MS, LIVE_LIMIT } from "../config";
import { getApi, errText } from "../api/client";
import type { SiemEvent, Stats, NetworkAlert } from "../types/siem";
export function useLive(enabled: boolean) {
  const [events, setEvents] = useState<SiemEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [networkAlerts, setNetworkAlerts] = useState<NetworkAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    const tick = async () => {
      try {
        const [ev, st, na] = await Promise.all([
          getApi<SiemEvent[]>(`/api/events?limit=${LIVE_LIMIT}`),
          getApi<Stats>("/api/stats"),
          getApi<NetworkAlert[]>("/api/network-alerts?limit=100"),
        ]);
        if (stop) return;
        setEvents(ev.data);
        setStats(st.data);
        setNetworkAlerts(na.data);
        setError(null);
        setUpdated(new Date());
      } catch (e) {
        if (!stop) setError(errText(e));
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [enabled]);
  return { events, stats, networkAlerts, error, updated };
}
