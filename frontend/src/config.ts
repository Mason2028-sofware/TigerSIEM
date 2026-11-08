export const API_URL: string = (import.meta.env?.VITE_API_URL as string | undefined) ?? "http://localhost:8000";
export const POLL_MS = 3000;
export const LIVE_LIMIT = 500;
export const RANGE_LIMIT = 1000;
export const BUCKETS = 40;
export const LOGO_SRC = "/logo.png";
