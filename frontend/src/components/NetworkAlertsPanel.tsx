import type { NetworkAlert } from "../types/siem";
import { fmtDateTime, sevLabel } from "../utils/events";
export default function NetworkAlertsPanel({ alerts, onFilter }: { alerts: NetworkAlert[]; onFilter: (ip: string) => void }) {
  if (!alerts.length) return <p className="empty">No network alerts yet.</p>;
  return (
    <div className="table-wrap" style={{ maxHeight: 280 }}>
      <table>
        <thead>
          <tr><th>Time</th><th>Severity</th><th>Alert</th><th>Source</th><th>Destination</th><th></th></tr>
        </thead>
        <tbody>
          {alerts.map((a, i) => {
            const ip = a.source_ip;
            return (
              <tr key={`${a.time}-${i}`} style={{ cursor: "default" }}>
                <td>{fmtDateTime(a.time)}</td>
                <td><span className={`badge sev-${a.severity ?? "x"}`}>{sevLabel(a.severity)}</span></td>
                <td className="msg" title={a.alert ?? ""}>{a.alert ?? "unknown"}</td>
                <td className="mono">{ip ?? "unknown"}</td>
                <td className="mono">
                  {a.destination_ip ?? "unknown"}{a.destination_port ? `:${a.destination_port}` : ""}
                </td>
                <td>{ip && <button className="small" onClick={() => onFilter(ip)}>Filter log</button>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}