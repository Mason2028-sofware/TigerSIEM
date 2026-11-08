import type { SiemEvent, Alert } from "../types/siem";
import { message, FAILED_RE, ACCEPTED_RE } from "./events";
export function analyze(events: SiemEvent[]) {
  const failed: Record<string, { count: number; users: Set<string> }> = {};
  const accepted: { ip: string; user: string }[] = [];
  for (const e of events) {
    const m = message(e);
    const f = FAILED_RE.exec(m);
    if (f) {
      const entry = (failed[f[2]] ??= { count: 0, users: new Set() });
      entry.count++;
      entry.users.add(f[1]);
      continue;
    }
    const a = ACCEPTED_RE.exec(m);
    if (a) accepted.push({ user: a[1], ip: a[2] });
  }

  const alerts: Alert[] = [];
  for (const [ip, f] of Object.entries(failed)) {
    if (f.count >= 5) {
      alerts.push({
        id: `brute-${ip}`, severity: "high", title: "Possible SSH brute force", ip,
        detail: `${ip} failed ${f.count} logins across ${f.users.size} account(s)`,
      });
    }
  }
  
  const seen = new Set<string>();
  for (const a of accepted) {
    const key = `${a.ip}-${a.user}`;
    if ((failed[a.ip]?.count ?? 0) >= 3 && !seen.has(key)) {
      seen.add(key);
      alerts.push({
        id: `success-${key}`, severity: "high", title: "Login succeeded after failed attempts", ip: a.ip,
        detail: `${a.user} logged in from ${a.ip} after ${failed[a.ip].count} failures`,
      });
    }
  }

  const failedByIp = Object.entries(failed)
    .map(([ip, f]): [string, number] => [ip, f.count])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return { alerts, failedByIp };
}
