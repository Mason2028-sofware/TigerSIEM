import type { DayStat } from "../types/siem";
import { fmtDay } from "../utils/events";
export default function DailyTable({ days }: { days: DayStat[] }) {
  if (!days.length) return <p className="empty">No daily data in this range.</p>;
  return (
    <div className="table-wrap" style={{ maxHeight: 260 }}>
      <table>
        <thead>
          <tr><th>Day</th><th>Events</th><th>Failed logins</th><th>Failure rate</th><th>Network alerts</th></tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day} style={{ cursor: "default" }}>
              <td>{fmtDay(d.day)}</td>
              <td>{d.total_events.toLocaleString()}</td>
              <td>{d.failed_logins.toLocaleString()}</td>
              <td>{d.total_events ? `${Math.round((d.failed_logins / d.total_events) * 100)}%` : "0%"}</td>
              <td>{d.network_alerts.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}