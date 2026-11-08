import { useEffect, useState } from "react";
import type { SiemEvent } from "../types/siem";
import { summary, fmtDateTime, host, fieldValue } from "../utils/events";
export default function EventDrawer({ event, onClose }: { event: SiemEvent | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [event, onClose]);

  if(!event){
    return null;
  }
  const fields = Object.entries(event.data ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const json = JSON.stringify({ tag: event.tag, time: event.time, data: event.data }, null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer" aria-label="Event details">
        <div className="drawer-head">
          <h3>Event details</h3>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="msgbox">{summary(event) || "This event has no summary; see the fields below."}</div>
        <h4>Summary</h4>
        <dl className="kv">
          <dt>Time (local)</dt><dd>{fmtDateTime(event.time)}</dd>
          <dt>Time (ISO)</dt><dd>{event.time}</dd>
          <dt>Tag</dt><dd>{event.tag}</dd>
          <dt>Host</dt><dd>{host(event) || "unknown"}</dd>
        </dl>
        <h4>All fields ({fields.length})</h4>
        {fields.length === 0 ? (
          <p className="empty">This event has no data fields.</p>
        ) : (
          <dl className="kv">
            {fields.map(([k, v]) => (
              <div key={k} className="kv-row">
                <dt>{k}</dt>
                <dd>{fieldValue(v)}</dd>
              </div>
            ))}
          </dl>
        )}
        <h4>Raw JSON</h4>
        <details>
          <summary>Show raw event</summary>
          <pre>{json}</pre>
        </details>
        <button className="ghost" onClick={copy} style={{ marginTop: 12 }}>
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </aside>
    </>
  );
}
