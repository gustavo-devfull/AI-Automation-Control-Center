"use client";

import { useEffect, useState } from "react";
import type {
  AgentRun,
  ControlCenterEvent,
  CostEntry,
  ErrorEvent as AgentErrorEvent,
  LogEntry,
  RetryEvent,
} from "@/lib/types";

interface RunDetail {
  runId: string;
  run: AgentRun | null;
  logs: LogEntry[];
  costs: CostEntry[];
  errors: AgentErrorEvent[];
  retries: RetryEvent[];
}

const MAX_LOGS = 300;

export function useRunDetail(runId: string) {
  const [state, setState] = useState<RunDetail>({
    runId: "",
    run: null,
    logs: [],
    costs: [],
    errors: [],
    retries: [],
  });
  const loading = state.runId !== runId;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/runs/${runId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && !data.error) {
          setState({
            runId,
            run: data.run,
            logs: data.logs,
            costs: data.costs,
            errors: data.errors,
            retries: data.retries,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  useEffect(() => {
    const source = new EventSource("/api/stream");
    source.onmessage = (event) => {
      const parsed: ControlCenterEvent = JSON.parse(event.data);
      setState((prev) => {
        switch (parsed.type) {
          case "run_updated": {
            const run = parsed.payload as AgentRun;
            if (run.id !== runId) return prev;
            return { ...prev, run };
          }
          case "log_added": {
            const log = parsed.payload as LogEntry;
            if (log.runId !== runId) return prev;
            return { ...prev, logs: [...prev.logs, log].slice(-MAX_LOGS) };
          }
          case "cost_added": {
            const cost = parsed.payload as CostEntry;
            if (cost.runId !== runId) return prev;
            return { ...prev, costs: [...prev.costs, cost] };
          }
          case "error_added": {
            const error = parsed.payload as AgentErrorEvent;
            if (error.runId !== runId) return prev;
            return { ...prev, errors: [error, ...prev.errors] };
          }
          case "retry_added": {
            const retry = parsed.payload as RetryEvent;
            if (retry.runId !== runId) return prev;
            return { ...prev, retries: [retry, ...prev.retries] };
          }
          default:
            return prev;
        }
      });
    };
    return () => source.close();
  }, [runId]);

  return { ...state, loading };
}
