import { useMemo } from "react";
import type { DayStat } from "../types/siem";
import { fmtDay } from "../utils/events";
export default function DailyChart({ days }: { days: DayStat[] }) {
  const asc = useMemo(() => [...days].sort((a, b) => (a.day < b.day ? -1 : 1)), [days]);
  if (!asc.length) return <p className="empty">No daily data in this range.</p>;
  const max = Math.max(1, ...asc.map((d) => d.total_events));
  return (
    <>
      <div className="legend">
        <span><i className="sw" /> All events</span>
        <span><i className="sw fail" /> Failed logins</span>
      </div>
      <div className="chart" role="img" aria-label="Events and failed logins per day">
        {asc.map((d) => (
          <div key={d.day} className="bar-slot"
            title={`${fmtDay(d.day)}: ${d.total_events} events, ${d.failed_logins} failed logins`}>
            <div className="bar stack" style={{ height: `${(d.total_events / max) * 100}%` }}>
              <div className="bar-fail" style={{ height: `${d.total_events ? (d.failed_logins / d.total_events) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="chart-axis">
        <span>{fmtDay(asc[0].day)}</span>
        <span>{fmtDay(asc[asc.length - 1].day)}</span>
      </div>
    </>
  );
}
