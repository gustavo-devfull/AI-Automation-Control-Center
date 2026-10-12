import type { CheckResult } from "./types";

export function uptimePercentSince(checks: CheckResult[], sinceMs: number): number | null {
  const cutoff = Date.now() - sinceMs;
  const windowChecks = checks.filter((c) => new Date(c.timestamp).getTime() >= cutoff);
  if (windowChecks.length === 0) return null;
  const successCount = windowChecks.filter((c) => c.success).length;
  return (successCount / windowChecks.length) * 100;
}

export function avgLatency(checks: CheckResult[]): number | null {
  const recent = checks.slice(-100).filter((c) => c.latencyMs !== null);
  if (recent.length === 0) return null;
  const sum = recent.reduce((s, c) => s + (c.latencyMs ?? 0), 0);
  return Math.round(sum / recent.length);
}

export function computeUptimeStats(checks: CheckResult[]) {
  return {
    uptimePercent: {
      "24h": uptimePercentSince(checks, 24 * 60 * 60 * 1000),
      "7d": uptimePercentSince(checks, 7 * 24 * 60 * 60 * 1000),
      "30d": uptimePercentSince(checks, 30 * 24 * 60 * 60 * 1000),
    },
    avgLatencyMs: avgLatency(checks),
  };
}
