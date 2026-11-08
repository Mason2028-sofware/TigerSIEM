import { useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { API_URL, LIVE_LIMIT, RANGE_LIMIT, LOGO_SRC } from "./config";
import type { SiemEvent, DayStat, Mode } from "./types/siem";
import { useLive } from "./hooks/useLive";
import { useHistorical } from "./hooks/useHistorical";
import { analyze } from "./utils/detection";
import { host, summary, fmtDateTime, fmtTime, fmtDay } from "./utils/events";
import Stat from "./components/Stat";
import EventChart from "./components/EventChart";
import Breakdown from "./components/Breakdown";
import DailyChart from "./components/DailyChart";
import DailyTable from "./components/DailyTable";
import DayAlertBars from "./components/DayAlertBars";
import NetworkAlertsPanel from "./components/NetworkAlertsPanel";
import BenchmarkPanel from "./components/BenchmarkPanel";
import EventDrawer from "./components/EventDrawer";
import "./App.css";

const openPicker = (e: ReactMouseEvent<HTMLInputElement>) => {
  try {
    e.currentTarget.showPicker();
  } catch {}
};

export default function App() {
  const [mode, setMode] = useState<Mode>("live");
  const [running, setRunning] = useState(true);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [visible, setVisible] = useState(100);
  const [selected, setSelected] = useState<SiemEvent | null>(null);
  const isLive = mode === "live";
  const hasRange = Boolean(start || end);
  const rangeInvalid = Boolean(start && end && start > end);
  const limit = isLive ? LIVE_LIMIT : RANGE_LIMIT;
  const live = useLive(isLive && running);
  const hist = useHistorical(!isLive && !rangeInvalid, start, end, refresh);
  const events = isLive ? live.events : hist.events;
  const error = isLive ? live.error : hist.error;
  const updated = isLive ? live.updated : hist.updated;
  const { alerts, failedByIp } = useMemo(() => analyze(events), [events]);
  const alertIps = useMemo(() => alerts.map((a) => a.ip), [alerts]);

  const histSummary = useMemo(() => {
    let total = 0;
    let failed = 0;
    let netAlerts = 0;
    let busiest: DayStat | null = null;
    for (const d of hist.days) {
      total += d.total_events;
      failed += d.failed_logins;
      netAlerts += d.network_alerts;
      if (!busiest || d.total_events > busiest.total_events) busiest = d;
    }
    return { total, failed, busiest, netAlerts };
  }, [hist.days]);

  const tags = useMemo(() => ["all", ...new Set(events.map((e) => e.tag))], [events]);
  const tagCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) c[e.tag] = (c[e.tag] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5) as [string, number][];
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => tag === "all" || e.tag === tag)
      .filter((e) => !q || `${e.tag} ${host(e)} ${summary(e)} ${JSON.stringify(e.data)}`.toLowerCase().includes(q));
  }, [events, query, tag]);
  const rows = filtered.slice(0, visible);

  const status = error ? "error" : isLive ? (running ? "live" : "paused") : hist.loading ? "loading" : "historical";
  const statusLabel = { error: "Can't reach API", live: "Live", paused: "Paused", loading: "Loading…", historical: "Historical" }[status];
  const rangeLabel = isLive? "the latest events, refreshed every few seconds": hasRange ? `${start || "the beginning"} to ${end || "now"}`: "all stored events (newest first)";

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>TigerSIEM Event Monitor</h1>
          <p className="sub">
            {isLive ? "Current data from TigerData" : "Past data from TigerData"}
            {updated && ` · last update ${fmtTime(updated.toISOString())}`}
          </p>
        </div>
        <img className="logo" src={LOGO_SRC} alt="TigerSIEM" />
      </header>

      <section className="toolbar">
        <div className="dates">
          <div className="seg" role="group" aria-label="Data mode">
            <button className={isLive ? "on" : ""} aria-pressed={isLive} onClick={() => setMode("live")}>Live</button>
            <button className={!isLive ? "on" : ""} aria-pressed={!isLive} onClick={() => setMode("historical")}>Historical</button>
          </div>
          {!isLive && (
            <>
              <label className="datefield">
                <span>Start date</span>
                <input type="date" value={start} max={end || undefined}
                  onChange={(e) => setStart(e.target.value)} onClick={openPicker} />
              </label>
              <label className="datefield">
                <span>End date (inclusive)</span>
                <input type="date" value={end} min={start || undefined}
                  onChange={(e) => setEnd(e.target.value)} onClick={openPicker} />
              </label>
              <button className="ghost" disabled={!hasRange} onClick={() => { setStart(""); setEnd(""); }}>
                All time
              </button>
            </>
          )}
        </div>
        <div className="top-actions">
          <span className={`pill ${status}`}>{statusLabel}</span>
          {isLive ? (
            <button onClick={() => setRunning((r) => !r)}>{running ? "Pause updates" : "Resume updates"}</button>
          ) : (
            <button onClick={() => setRefresh((n) => n + 1)} disabled={hist.loading || rangeInvalid}>Refresh</button>
          )}
        </div>
      </section>
      {rangeInvalid && <div className="banner">The start date must be on or before the end date.</div>}
      {error && (
        <div className="banner">
          Could not load data: {error}. Check that the API is running at {API_URL} and allows requests from this page.
        </div>
      )}
      <section className="stats">
        {isLive ? (
          <>
            <Stat label="Total events" value={live.stats ? live.stats.total_events.toLocaleString() : "–"} />
            <Stat label="Failed logins" value={live.stats ? live.stats.failed_auth_events.toLocaleString() : "–"} />
            <Stat label="SSH events" value={live.stats ? live.stats.ssh_events.toLocaleString() : "–"} />
            <Stat label="Network alerts" value={live.stats ? live.stats.network_alerts.toLocaleString() : "–"} />
            <Stat label="Latest event" small value={live.stats?.latest_event ? fmtDateTime(live.stats.latest_event) : "–"} />
          </>
        ) : (
          <>
            <Stat label="Days with data" value={hist.days.length.toLocaleString()} />
            <Stat label="Historical events (simulated)" value={histSummary.total.toLocaleString()} />
            <Stat label="Historical failed logins (simulated)" value={histSummary.failed.toLocaleString()} />
            <Stat label="Network alerts (Suricata)" value={histSummary.netAlerts.toLocaleString()} />
            <Stat label="Busiest day" small
              value={histSummary.busiest ? `${fmtDay(histSummary.busiest.day)} (${histSummary.busiest.total_events.toLocaleString()})` : "–"} />
          </>
        )}
        <Stat
          label={isLive ? "Events loaded" : "Captured events in range"}
          value={events.length.toLocaleString()}
          note={events.length >= limit ? `Capped at ${limit.toLocaleString()}; narrow the range to see the rest` : undefined}
        />
        <Stat label="Open alerts in view" value={alerts.length} note={alerts.length ? "Review below" : "Nothing flagged"} />
      </section>
      <div className="grid">
        {isLive ? (
          <>
            <section className="panel wide">
              <h2>Events over time</h2>
              <EventChart events={events} />
            </section>
            <section className="panel wide">
              <h2>Network alerts</h2>
              <p className="hint">Latest Suricata alerts, including port scans. “Filter log” narrows the event log below to that source IP.</p>
              <NetworkAlertsPanel alerts={live.networkAlerts} onFilter={setQuery} />
            </section>
          </>
        ) : (
          <>
            <section className="panel wide">
              <h2>
                Daily SSH activity
                {hist.simulated && <span className="badge">SSH history is simulated</span>}
              </h2>
              <DailyChart days={hist.days} />
              <DayAlertBars days={hist.days} />
            </section>
            <section className="panel">
              <h2>Daily totals</h2>
              <DailyTable days={hist.days} />
            </section>
            <section className="panel">
              <h2>Query benchmark</h2>
              <BenchmarkPanel start={start} end={end} />
            </section>
          </>
        )}

        <section className="panel alerts">
          <h2>Alerts</h2>
          {alerts.length === 0 ? (
            <p className="empty">No suspicious activity found in these events.</p>
          ) : (
            <ul>
              {alerts.map((a) => (
                <li key={a.id} className={a.severity}>
                  <strong>{a.title}</strong>
                  <span>{a.detail}</span>
                  <button onClick={() => setQuery(a.ip)}>Show events</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>Events by tag</h2>
          {tagCounts.length ? <Breakdown items={tagCounts} total={events.length} /> : <p className="empty">No events in view.</p>}
          <h2 style={{ marginTop: 20 }}>Failed logins by source IP</h2>
          {failedByIp.length ? (
            <Breakdown items={failedByIp} total={failedByIp[0][1]} />
          ) : (
            <p className="empty">No failed logins in these events.</p>
          )}
        </section>

        <section className="panel wide">
          <div className="table-head">
            <div>
              <h2>Event log</h2>
              <p className="hint" style={{ margin: 0 }}>Showing {rangeLabel}. Click an event for full details.</p>
            </div>
            <div className="filters">
              <input
                type="search" placeholder="Filter by message, host or tag"
                value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter events"
              />
              <select value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag">
                {tags.map((t) => <option key={t} value={t}>{t === "all" ? "All tags" : t}</option>)}
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Time</th><th>Tag</th><th>Host</th><th>Message</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      {events.length ? "No events match these filters." : !isLive && hasRange ? "No captured events in this date range." : "No events yet."}
                    </td>
                  </tr>
                )}
                {rows.map((e, i) => {
                  const m = summary(e);
                  return (
                    <tr
                      key={`${e.time}-${i}`} tabIndex={0}
                      className={alertIps.some((ip) => m.includes(ip)) ? "flagged" : ""}
                      onClick={() => setSelected(e)}
                      onKeyDown={(ev) => ev.key === "Enter" && setSelected(e)}
                    >
                      <td>{fmtDateTime(e.time)}</td>
                      <td>{e.tag}</td>
                      <td>{host(e) || "unknown"}</td>
                      <td className="msg" title={m}>{m || "no message"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-foot">
            <p className="hint" style={{ margin: 0 }}>
              Showing {rows.length} of {filtered.length} matching events. Rows with a red edge mention an IP with an open alert.
            </p>
            {filtered.length > visible && (
              <button className="ghost" onClick={() => setVisible((v) => v + 100)}>Show 100 more</button>
            )}
          </div>
        </section>
      </div>
      <EventDrawer event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
