import { API_URL } from "../config";
import type { ApiBody } from "../types/siem";

export async function getApi<T>(path: string): Promise<ApiBody<T>> {
  const name = path.split("?")[0];
  const res = await fetch(`${API_URL}${path}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const d = body?.detail;
    const detail = typeof d === "string" ? d : d ? JSON.stringify(d) : "";
    throw new Error(`${name} returned ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  if (!body || body.success === false) throw new Error(`${name} returned an unexpected response`);
  return body as ApiBody<T>;
}

export function rangeParams(start: string, end: string) {
  const p = new URLSearchParams();
  if (start) p.set("start_date", start);
  if (end) p.set("end_date", end);
  return p;
}

export const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));