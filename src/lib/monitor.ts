import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type { CheckResult, Incident, MonitorEvent, MonitorSnapshot } from "./types";
import { computeUptimeStats } from "./stats";

export const TARGET_URL = "https://site.gustavosantos.xyz/";

const CHECK_INTERVAL_MS = 20_000;
const CHECK_TIMEOUT_MS = 10_000;
const MAX_CHECKS = 1500;
const MAX_INCIDENTS = 200;

function now(): string {
  return new Date().toISOString();
}

class SiteMonitor {
  checks: CheckResult[] = [];
  incidents: Incident[] = [];
  openIncident: Incident | null = null;
  emitter = new EventEmitter();
  started = false;
  inFlight: Promise<CheckResult> | null = null;

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  start() {
    if (this.started) return;
    this.started = true;
    void this.performCheck();
    setInterval(() => void this.performCheck(), CHECK_INTERVAL_MS);
  }

  emit(event: MonitorEvent) {
    this.emitter.emit("event", event);
  }

  lastCheckAgeMs(): number {
    const last = this.checks[this.checks.length - 1];
    if (!last) return Infinity;
    return Date.now() - new Date(last.timestamp).getTime();
  }

  async ensureFresh() {
    if (this.inFlight) {
      await this.inFlight;
      return;
    }
    if (this.lastCheckAgeMs() >= CHECK_INTERVAL_MS) {
      await this.performCheck();
    }
  }

  performCheck(): Promise<CheckResult> {
    if (this.inFlight) return this.inFlight;
    const promise = this.runCheck().finally(() => {
      this.inFlight = null;
    });
    this.inFlight = promise;
    return promise;
  }

  private async runCheck(): Promise<CheckResult> {
    const started = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    let result: CheckResult;
    try {
      const res = await fetch(TARGET_URL, {
        signal: controller.signal,
        redirect: "follow",
        cache: "no-store",
        headers: { "User-Agent": "AI-Automation-Control-Center-UptimeMonitor/1.0" },
      });
      const latencyMs = Math.round(performance.now() - started);
      result = {
        id: randomUUID(),
        timestamp: now(),
        success: res.status < 500,
        statusCode: res.status,
        latencyMs,
        error: res.status >= 500 ? `HTTP ${res.status}` : undefined,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - started);
      const message =
        err instanceof Error
          ? err.name === "AbortError"
            ? `Timeout after ${CHECK_TIMEOUT_MS}ms`
            : err.message
          : "Unknown error";
      result = {
        id: randomUUID(),
        timestamp: now(),
        success: false,
        statusCode: null,
        latencyMs,
        error: message,
      };
    } finally {
      clearTimeout(timeout);
    }

    this.recordCheck(result);
    return result;
  }

  recordCheck(result: CheckResult) {
    this.checks.push(result);
    if (this.checks.length > MAX_CHECKS) this.checks.shift();
    this.emit({ type: "check_added", payload: result });
    this.updateIncidents(result);
  }

  updateIncidents(result: CheckResult) {
    if (!result.success) {
      if (!this.openIncident) {
        const incident: Incident = {
          id: randomUUID(),
          startedAt: result.timestamp,
          cause: result.error ?? `HTTP ${result.statusCode}`,
          checksFailed: 1,
        };
        this.openIncident = incident;
        this.incidents.push(incident);
        if (this.incidents.length > MAX_INCIDENTS) this.incidents.shift();
        this.emit({ type: "incident_opened", payload: incident });
      } else {
        this.openIncident.checksFailed += 1;
      }
    } else if (this.openIncident) {
      this.openIncident.resolvedAt = result.timestamp;
      this.emit({ type: "incident_resolved", payload: this.openIncident });
      this.openIncident = null;
    }
  }

  snapshot(): MonitorSnapshot {
    const last = this.checks[this.checks.length - 1];
    const stats = computeUptimeStats(this.checks);
    return {
      targetUrl: TARGET_URL,
      checks: this.checks,
      incidents: [...this.incidents].reverse(),
      currentStatus: !last ? "unknown" : last.success ? "up" : "down",
      lastCheckedAt: last?.timestamp ?? null,
      ...stats,
    };
  }
}

declare global {
  var __siteMonitor: SiteMonitor | undefined;
}

export function getMonitor(): SiteMonitor {
  if (!globalThis.__siteMonitor) {
    globalThis.__siteMonitor = new SiteMonitor();
    globalThis.__siteMonitor.start();
  }
  return globalThis.__siteMonitor;
}
