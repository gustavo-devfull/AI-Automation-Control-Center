"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Agent,
  AgentRun,
  ApprovalRequest,
  ControlCenterEvent,
  CostEntry,
  ErrorEvent as AgentErrorEvent,
  PermissionGrant,
  RetryEvent,
  Tool,
} from "@/lib/types";

interface Snapshot {
  agents: Agent[];
  tools: Tool[];
  permissions: PermissionGrant[];
  runs: AgentRun[];
  approvals: ApprovalRequest[];
  costs: CostEntry[];
  errors: AgentErrorEvent[];
  retries: RetryEvent[];
}

interface ControlCenterState extends Snapshot {
  connected: boolean;
  loading: boolean;
  decideApproval: (id: string, decision: "approved" | "denied") => Promise<void>;
}

const MAX_COSTS = 500;
const MAX_ERRORS = 300;
const MAX_RETRIES = 300;

const ControlCenterContext = createContext<ControlCenterState | null>(null);

export function ControlCenterProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    agents: [],
    tools: [],
    permissions: [],
    runs: [],
    approvals: [],
    costs: [],
    errors: [],
    retries: [],
  });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bootstrap")
      .then((r) => r.json())
      .then((data: Snapshot) => {
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
      const parsed: ControlCenterEvent = JSON.parse(event.data);
      applyEvent(parsed, setSnapshot);
    };
    return () => source.close();
  }, []);

  const decideApproval = useCallback(
    async (id: string, decision: "approved" | "denied") => {
      await fetch(`/api/approvals/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, decidedBy: "You (operator)" }),
      });
    },
    []
  );

  const value = useMemo<ControlCenterState>(
    () => ({ ...snapshot, loading, connected, decideApproval }),
    [snapshot, loading, connected, decideApproval]
  );

  return (
    <ControlCenterContext.Provider value={value}>
      {children}
    </ControlCenterContext.Provider>
  );
}

function applyEvent(
  event: ControlCenterEvent,
  setSnapshot: React.Dispatch<React.SetStateAction<Snapshot>>
) {
  setSnapshot((prev) => {
    switch (event.type) {
      case "run_created": {
        const run = event.payload as AgentRun;
        return { ...prev, runs: [run, ...prev.runs] };
      }
      case "run_updated": {
        const run = event.payload as AgentRun;
        return {
          ...prev,
          runs: prev.runs.map((r) => (r.id === run.id ? run : r)),
        };
      }
      case "cost_added": {
        const cost = event.payload as CostEntry;
        return {
          ...prev,
          costs: [...prev.costs, cost].slice(-MAX_COSTS),
        };
      }
      case "error_added": {
        const error = event.payload as AgentErrorEvent;
        return {
          ...prev,
          errors: [error, ...prev.errors].slice(0, MAX_ERRORS),
        };
      }
      case "retry_added": {
        const retry = event.payload as RetryEvent;
        return {
          ...prev,
          retries: [retry, ...prev.retries].slice(0, MAX_RETRIES),
        };
      }
      case "approval_created": {
        const approval = event.payload as ApprovalRequest;
        return { ...prev, approvals: [approval, ...prev.approvals] };
      }
      case "approval_decided": {
        const approval = event.payload as ApprovalRequest;
        return {
          ...prev,
          approvals: prev.approvals.map((a) =>
            a.id === approval.id ? approval : a
          ),
        };
      }
      case "log_added":
        return prev; // logs handled by per-run hook, not global state
      default:
        return prev;
    }
  });
}

export function useControlCenter() {
  const ctx = useContext(ControlCenterContext);
  if (!ctx) throw new Error("useControlCenter must be used within ControlCenterProvider");
  return ctx;
}
