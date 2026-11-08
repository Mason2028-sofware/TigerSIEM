import { useEffect, useState } from "react";
import { RANGE_LIMIT } from "../config";
import { getApi, errText, rangeParams } from "../api/client";
import type { SiemEvent, DayStat } from "../types/siem";
export function useHistorical(enabled: boolean, start: string, end: string, refresh: number) {
  const [events, setEvents] = useState<SiemEvent[]>([]);
  const [days, setDays] = useState<DayStat[]>([]);
  const [simulated, setSimulated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    setLoading(true);
    const evParams = rangeParams(start, end);
    evParams.set("limit", String(RANGE_LIMIT));
    Promise.all([
      getApi<SiemEvent[]>(`/api/events?${evParams}`),
      getApi<DayStat[]>(`/api/historical-stats?${rangeParams(start, end)}`),
    ])
      .then(([ev, hs]) => {
        if (stop) return;
        setEvents(ev.data);
        setDays(hs.data);
        setSimulated(Boolean(hs.simulated));
        setError(null);
        setUpdated(new Date());
      })
      .catch((e) => !stop && setError(errText(e)))
      .finally(() => !stop && setLoading(false));
    return () => {
      stop = true;
    };
  }, [enabled, start, end, refresh]);
  return { events, days, simulated, loading, error, updated };
}