export interface SiemEvent {
  tag: string;
  time: string;
  data: Record<string, unknown>;
}

export interface Stats {
  total_events: number;
  failed_auth_events: number;
  ssh_events: number;
  network_alerts: number;
  latest_event: string | null;
}

export interface NetworkAlert {
  time: string;
  tag: string;
  source_ip: string | null;
  destination_ip: string | null;
  destination_port: string | null;
  alert: string | null;
  severity: string | null;
}

export interface DayStat {
  day: string;
  total_events: number;
  failed_logins: number;
  network_alerts: number;
}

export interface Benchmark {
  benchmark: string;
  storage: string;
  runs: number;
  execution_times_ms: number[];
  median_time_ms: number;
  days_returned: number;
  start_date: string | null;
  end_date: string | null;
}

export interface ApiBody<T> {
  success: boolean;
  data: T;
  simulated?: boolean;
}

export type Mode = "live" | "historical";

export interface Alert {
  id: string;
  severity: "high" | "medium";
  title: string;
  detail: string;
  ip: string;
}
