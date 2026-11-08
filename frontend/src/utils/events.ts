import type { SiemEvent } from "../types/siem";
export const message = (e: SiemEvent) => String(e.data?.MESSAGE ?? "");
export const host = (e: SiemEvent) => String(e.data?._HOSTNAME ?? e.data?.host ?? "");
export const sevLabel = (s: string | null) =>
  (({ "1": "High", "2": "Medium", "3": "Low" }) as Record<string, string>)[s ?? ""] ?? s ?? "unknown";
export function summary(e: SiemEvent): string {
  const m = message(e);
  if (m) return m;
  const d = e.data ?? {};
  const alert = d.alert as { signature?: string } | undefined;
  const flow = d.src_ip ? `${String(d.src_ip)}${d.src_port ? `:${String(d.src_port)}` : ""} → ${String(d.dest_ip ?? "?")}${d.dest_port ? `:${String(d.dest_port)}` : ""}`: "";
  if (d.event_type === "alert") return `${alert?.signature ?? "Network alert"}${flow ? ` (${flow})` : ""}`;
  if (d.event_type) return `${String(d.event_type)}${flow ? `: ${flow}` : ""}${d.proto ? ` ${String(d.proto)}` : ""}`;
  return "";
}

export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString([], { hour12: false });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour12: false });
export const fmtDay = (iso: string) => iso.slice(0, 10);
export const fieldValue = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));
export const FAILED_RE = /failed password for (?:invalid user )?(\S+) from (\S+)/i;
export const ACCEPTED_RE = /accepted \w+ for (\S+) from (\S+)/i;
export function fmtDuration(ms: number) {
  const s = ms / 1000;
  if (s < 90) return `${Math.max(1, Math.round(s))} seconds`;
  if (s < 5400) return `${Math.round(s / 60)} minutes`;
  if (s < 172800) return `${Math.round(s / 3600)} hours`;
  return `${Math.round(s / 86400)} days`;
}
