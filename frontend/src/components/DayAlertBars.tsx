import { useMemo } from "react";
import type { DayStat } from "../types/siem";
import { fmtDay } from "../utils/events";
export default function DayAlertBars({ days }: { days: DayStat[] }) {
  const asc = useMemo(() => [...days].sort((a, b) => (a.day < b.day ? -1 : 1)), [days]);
  if (!asc.length) return null;
  const max = Math.max(1, ...asc.map((d) => d.network_alerts));
  const total = asc.reduce((sum, d) => sum + d.network_alerts, 0);
  return (
    <>
      <h2 style={{ marginTop: 22 }}>Network alerts per day <span className="badge">Suricata, real data</span></h2>
      {total === 0 ? (
        <p className="empty">No network alerts in this range.</p>
      ) : (
        <div className="chart short" role="img" aria-label="Network alerts per day">
          {asc.map((d) => (
            <div key={d.day} className="bar-slot" title={`${fmtDay(d.day)}: ${d.network_alerts} network alerts`}>
              <div className="bar alert" style={{ height: `${(d.network_alerts / max) * 100}%` }} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}