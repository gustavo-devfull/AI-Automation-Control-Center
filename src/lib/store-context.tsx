"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CheckResult, Incident, MonitorEvent, MonitorSnapshot } from "@/lib/types";
import { computeUptimeStats } from "@/lib/stats";

const MAX_CHECKS_CLIENT = 1500;
const MAX_INCIDENTS_CLIENT = 200;

interface MonitorState extends MonitorSnapshot {
  connected: boolean;
  loading: boolean;
  checkNow: () => Promise<void>;
  checking: boolean;
}

const MonitorContext = createContext<MonitorState | null>(null);

const EMPTY_SNAPSHOT: MonitorSnapshot = {
  targetUrl: "",
  checks: [],
  incidents: [],
  currentStatus: "unknown",
  lastCheckedAt: null,
  uptimePercent: { "24h": null, "7d": null, "30d": null },
  avgLatencyMs: null,
};

export function MonitorProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<MonitorSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bootstrap")
      .then((r) => r.json())
      .then((data: MonitorSnapshot) => {
        if (!cancelled) {
          setSnapshot(data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/stream");
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (event) => {
      const parsed: MonitorEvent = JSON.parse(event.data);
      applyEvent(parsed, setSnapshot);
    };
    return () => source.close();
  }, []);

  const checkNow = useCallback(async () => {
    setChecking(true);
    try {
      await fetch("/api/check", { method: "POST" });
    } finally {
      setChecking(false);
    }
  }, []);

  const value = useMemo<MonitorState>(
    () => ({ ...snapshot, loading, connected, checkNow, checking }),
    [snapshot, loading, connected, checkNow, checking]
  );

  return <MonitorContext.Provider value={value}>{children}</MonitorContext.Provider>;
}

function applyEvent(
  event: MonitorEvent,
  setSnapshot: React.Dispatch<React.SetStateAction<MonitorSnapshot>>
) {
  setSnapshot((prev) => {
    switch (event.type) {
      case "check_added": {
        const check = event.payload as CheckResult;
        const checks = [...prev.checks, check].slice(-MAX_CHECKS_CLIENT);
        return {
          ...prev,
          checks,
          currentStatus: check.success ? "up" : "down",
          lastCheckedAt: check.timestamp,
          ...computeUptimeStats(checks),
        };
      }
      case "incident_opened": {
        const incident = event.payload as Incident;
        return {
          ...prev,
          incidents: [incident, ...prev.incidents].slice(0, MAX_INCIDENTS_CLIENT),
        };
      }
      case "incident_resolved": {
        const incident = event.payload as Incident;
        return {
          ...prev,
          incidents: prev.incidents.map((i) => (i.id === incident.id ? incident : i)),
        };
      }
      default:
        return prev;
    }
  });
}

export function useMonitor() {
  const ctx = useContext(MonitorContext);
  if (!ctx) throw new Error("useMonitor must be used within MonitorProvider");
  return ctx;
}
