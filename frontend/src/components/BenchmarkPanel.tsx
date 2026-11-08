import { useState } from "react";
import type { Benchmark } from "../types/siem";
import { getApi, errText, rangeParams } from "../api/client";
export default function BenchmarkPanel({ start, end }: { start: string; end: string }) {
  const [result, setResult] = useState<Benchmark | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult((await getApi<Benchmark>(`/api/benchmark?${rangeParams(start, end)}`)).data);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="hint">Times the daily aggregation query on TigerData for the selected range.</p>
      <button onClick={run} disabled={loading}>{loading ? "Running…" : "Run benchmark"}</button>
      {error && <p className="empty" style={{ color: "var(--danger)" }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 14 }}>
          <div className="bench-big">{result.median_time_ms} ms</div>
          <div className="stat-label">Median of {result.runs} runs (after a warm-up run)</div>
          <div className="runs">
            {result.execution_times_ms.map((t, i) => <span key={i} className="chip">{t} ms</span>)}
          </div>
          <p className="hint" style={{ marginTop: 10 }}>
            {result.days_returned.toLocaleString()} days returned · {result.storage} · range {result.start_date ?? "start"} to {result.end_date ?? "now"}
          </p>
        </div>
      )}
    </>
  );
}
