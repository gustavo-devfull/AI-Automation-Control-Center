// Domain types for the single-target uptime monitor

export interface CheckResult {
  id: string;
  timestamp: string;
  success: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  error?: string;
}

export interface Incident {
  id: string;
  startedAt: string;
  resolvedAt?: string;
  cause: string;
  checksFailed: number;
}

export interface MonitorSnapshot {
  targetUrl: string;
  checks: CheckResult[];
  incidents: Incident[];
  currentStatus: "up" | "down" | "unknown";
  lastCheckedAt: string | null;
  uptimePercent: {
    "24h": number | null;
    "7d": number | null;
    "30d": number | null;
  };
  avgLatencyMs: number | null;
}

export type MonitorEvent =
  | { type: "check_added"; payload: CheckResult }
  | { type: "incident_opened"; payload: Incident }
  | { type: "incident_resolved"; payload: Incident };
