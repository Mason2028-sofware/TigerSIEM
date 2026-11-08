import { useMemo } from "react";
import type { SiemEvent } from "../types/siem";
import { BUCKETS } from "../config";
import { fmtDateTime, fmtDuration } from "../utils/events";
export default function EventChart({ events }: { events: SiemEvent[] }) {
  const chart = useMemo(() => {
    if (!events.length) return null;
    const times = events.map((e) => new Date(e.time).getTime());
    const from = Math.min(...times);
    const to = Math.max(...times);
    const size = Math.max(to - from, 60_000) / BUCKETS;
    const bars = Array.from({ length: BUCKETS }, (_, i) => ({ t: from + i * size, count: 0 }));
    for (const t of times) bars[Math.min(BUCKETS - 1, Math.floor((t - from) / size))].count++;
    return { bars, max: Math.max(1, ...bars.map((b) => b.count)), from, to, size };
  }, [events]);

  if(!chart){
    return <p className="empty">No events to chart.</p>;
  }
  return (
    <>
      <p className="hint">Each bar covers about {fmtDuration(chart.size)}. Oldest on the left, newest on the right.</p>
      <div className="chart" role="img" aria-label="Number of events over the time span shown">
        {chart.bars.map((b) => (
          <div key={b.t} className="bar-slot" title={`${fmtDateTime(new Date(b.t).toISOString())}: ${b.count} events`}>
            <div className="bar" style={{ height: `${(b.count / chart.max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="chart-axis">
        <span>{fmtDateTime(new Date(chart.from).toISOString())}</span>
        <span>{fmtDateTime(new Date(chart.to).toISOString())}</span>
      </div>
    </>
  );
}
