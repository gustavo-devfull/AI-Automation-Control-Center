// Core domain types for the AI Automation Control Center

export type RunStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "retrying"
  | "succeeded"
  | "failed"
  | "denied";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type ToolPermissionScope =
  | "read"
  | "write"
  | "execute"
  | "network"
  | "financial";

export type ApprovalDecision = "approved" | "denied" | "pending";

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  avatarColor: string;
  defaultScopes: ToolPermissionScope[];
  costPerformance: {
    inputPer1kTokens: number;
    outputPer1kTokens: number;
  };
}

export interface Tool {
  id: string;
  name: string;
  scope: ToolPermissionScope;
  risk: "low" | "medium" | "high";
}

export interface PermissionGrant {
  id: string;
  agentId: string;
  toolId: string;
  scope: ToolPermissionScope;
  grantedAt: string;
  grantedBy: string;
  requiresApproval: boolean;
  status: "active" | "revoked";
}

export interface LogEntry {
  id: string;
  runId: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  toolId?: string;
}

export interface CostEntry {
  id: string;
  runId: string;
  agentId: string;
  timestamp: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface ErrorEvent {
  id: string;
  runId: string;
  timestamp: string;
  message: string;
  stack?: string;
  retryAttempt: number;
  resolved: boolean;
}

export interface RetryEvent {
  id: string;
  runId: string;
  attempt: number;
  timestamp: string;
  backoffMs: number;
  reason: string;
}

export interface ApprovalRequest {
  id: string;
  runId: string;
  agentId: string;
  createdAt: string;
  decidedAt?: string;
  decision: ApprovalDecision;
  decidedBy?: string;
  action: string;
  riskLevel: "low" | "medium" | "high";
  reason: string;
  toolId?: string;
}

export interface AgentRun {
  id: string;
  agentId: string;
  task: string;
  status: RunStatus;
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  progress: number; // 0-100
  retryCount: number;
  totalCostUsd: number;
  totalTokens: number;
  currentStep?: string;
}

export interface ControlCenterEvent {
  type:
    | "run_created"
    | "run_updated"
    | "log_added"
    | "cost_added"
    | "error_added"
    | "retry_added"
    | "approval_created"
    | "approval_decided";
  payload: unknown;
}
