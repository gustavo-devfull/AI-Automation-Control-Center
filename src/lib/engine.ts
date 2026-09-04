import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type {
  Agent,
  AgentRun,
  ApprovalRequest,
  ControlCenterEvent,
  CostEntry,
  ErrorEvent,
  LogEntry,
  PermissionGrant,
  RetryEvent,
  Tool,
} from "./types";

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const AGENTS: Agent[] = [
  {
    id: "agent-email-triage",
    name: "Email Triage Agent",
    description: "Classifies inbound support email and drafts responses.",
    model: "claude-sonnet-5",
    avatarColor: "#8b5cf6",
    defaultScopes: ["read", "write"],
    costPerformance: { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015 },
  },
  {
    id: "agent-invoice-recon",
    name: "Invoice Reconciliation Agent",
    description: "Matches vendor invoices against purchase orders and pays approved ones.",
    model: "claude-sonnet-5",
    avatarColor: "#f59e0b",
    defaultScopes: ["read", "financial"],
    costPerformance: { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015 },
  },
  {
    id: "agent-code-review",
    name: "Code Review Agent",
    description: "Reviews pull requests for bugs, style, and security issues.",
    model: "claude-opus-5",
    avatarColor: "#22c55e",
    defaultScopes: ["read", "write"],
    costPerformance: { inputPer1kTokens: 0.005, outputPer1kTokens: 0.025 },
  },
  {
    id: "agent-support-bot",
    name: "Customer Support Agent",
    description: "Handles tier-1 tickets and escalates when confidence is low.",
    model: "claude-haiku-4-5",
    avatarColor: "#38bdf8",
    defaultScopes: ["read", "write", "network"],
    costPerformance: { inputPer1kTokens: 0.0008, outputPer1kTokens: 0.004 },
  },
  {
    id: "agent-data-pipeline",
    name: "Data Pipeline Monitor",
    description: "Watches ETL jobs, restarts failures, and pages on-call when needed.",
    model: "claude-sonnet-5",
    avatarColor: "#f43f5e",
    defaultScopes: ["read", "execute"],
    costPerformance: { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015 },
  },
  {
    id: "agent-security-scan",
    name: "Security Scanner Agent",
    description: "Scans infra changes for misconfigurations and exposed secrets.",
    model: "claude-opus-5",
    avatarColor: "#eab308",
    defaultScopes: ["read", "execute", "network"],
    costPerformance: { inputPer1kTokens: 0.005, outputPer1kTokens: 0.025 },
  },
];

const TOOLS: Tool[] = [
  { id: "tool-send-email", name: "send_email", scope: "write", risk: "low" },
  { id: "tool-query-db", name: "query_database", scope: "read", risk: "low" },
  { id: "tool-charge-card", name: "charge_payment_method", scope: "financial", risk: "high" },
  { id: "tool-issue-refund", name: "issue_refund", scope: "financial", risk: "high" },
  { id: "tool-exec-shell", name: "execute_shell_command", scope: "execute", risk: "high" },
  { id: "tool-http-request", name: "http_request", scope: "network", risk: "medium" },
  { id: "tool-write-file", name: "write_file", scope: "write", risk: "medium" },
  { id: "tool-deploy", name: "trigger_deployment", scope: "execute", risk: "high" },
  { id: "tool-read-repo", name: "read_repository", scope: "read", risk: "low" },
  { id: "tool-post-comment", name: "post_pr_comment", scope: "write", risk: "low" },
];

const TASK_TEMPLATES: Record<string, string[]> = {
  "agent-email-triage": [
    "Triage inbox batch #{n}",
    "Draft reply for ticket #{n}",
    "Classify and route escalation #{n}",
  ],
  "agent-invoice-recon": [
    "Reconcile vendor invoice #{n}",
    "Match PO-{n} against invoice batch",
    "Process payment run #{n}",
  ],
  "agent-code-review": [
    "Review pull request #{n}",
    "Security pass on PR #{n}",
    "Style + lint review for PR #{n}",
  ],
  "agent-support-bot": [
    "Resolve support ticket #{n}",
    "Handle chat session #{n}",
    "Follow up on ticket #{n}",
  ],
  "agent-data-pipeline": [
    "Monitor ETL job pipeline-{n}",
    "Restart failed job batch-{n}",
    "Validate warehouse sync #{n}",
  ],
  "agent-security-scan": [
    "Scan infra change-set #{n}",
    "Audit IAM policy diff #{n}",
    "Scan deployment manifest #{n}",
  ],
};

const AGENT_TOOLS: Record<string, string[]> = {
  "agent-email-triage": ["tool-send-email", "tool-query-db"],
  "agent-invoice-recon": ["tool-query-db", "tool-charge-card", "tool-issue-refund"],
  "agent-code-review": ["tool-read-repo", "tool-post-comment"],
  "agent-support-bot": ["tool-send-email", "tool-query-db", "tool-http-request", "tool-issue-refund"],
  "agent-data-pipeline": ["tool-exec-shell", "tool-query-db", "tool-http-request"],
  "agent-security-scan": ["tool-exec-shell", "tool-read-repo", "tool-deploy", "tool-http-request"],
};

const ERROR_MESSAGES = [
  "Rate limit exceeded on downstream API (429)",
  "Timed out waiting for tool response after 30s",
  "Schema validation failed on tool output",
  "Upstream service returned 503 Service Unavailable",
  "Tool call rejected: ambiguous parameters",
  "Connection reset while streaming response",
  "Unexpected null in required field 'reference_id'",
];

const LOG_TEMPLATES: Record<string, string[]> = {
  planning: [
    "Parsing task context and building execution plan",
    "Selected {n}-step plan to accomplish task",
    "Retrieved relevant context from memory store",
  ],
  tool: [
    "Calling tool `{tool}`",
    "Tool `{tool}` returned in {ms}ms",
    "Validating output of `{tool}` against schema",
  ],
  reasoning: [
    "Evaluating confidence score for proposed action (0.{n})",
    "Cross-checking result against policy constraints",
    "Summarizing intermediate result for next step",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function now(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const MAX_HISTORY = 400;
const MAX_LOGS_PER_RUN = 200;
const MAX_CONCURRENT_RUNS = 5;
const MAX_RETRIES = 3;
const APPROVAL_AUTO_TIMEOUT_MS = 40_000;

class ControlCenterEngine {
  agents: Agent[] = AGENTS;
  tools: Tool[] = TOOLS;
  permissions: PermissionGrant[] = [];
  runs: Map<string, AgentRun> = new Map();
  logs: Map<string, LogEntry[]> = new Map();
  costs: CostEntry[] = [];
  errors: ErrorEvent[] = [];
  retries: RetryEvent[] = [];
  approvals: Map<string, ApprovalRequest> = new Map();
  emitter = new EventEmitter();
  taskCounter = 100;
  started = false;

  constructor() {
    this.emitter.setMaxListeners(100);
    this.seedPermissions();
  }

  seedPermissions() {
    for (const agent of this.agents) {
      const toolIds = AGENT_TOOLS[agent.id] ?? [];
      for (const toolId of toolIds) {
        const tool = this.tools.find((t) => t.id === toolId)!;
        this.permissions.push({
          id: randomUUID(),
          agentId: agent.id,
          toolId,
          scope: tool.scope,
          grantedAt: now(),
          grantedBy: "system (bootstrap)",
          requiresApproval: tool.risk === "high",
          status: "active",
        });
      }
    }
  }

  emit(event: ControlCenterEvent) {
    this.emitter.emit("event", event);
  }

  start() {
    if (this.started) return;
    this.started = true;
    // seed a few runs immediately so the dashboard isn't empty on first load
    for (let i = 0; i < 3; i++) this.maybeSpawnRun(true);
    setInterval(() => this.tick(), 1800);
    setInterval(() => this.checkApprovalTimeouts(), 5000);
  }

  activeRuns(): AgentRun[] {
    return [...this.runs.values()].filter((r) =>
      ["queued", "running", "retrying", "awaiting_approval"].includes(r.status)
    );
  }

  maybeSpawnRun(force = false) {
    if (!force && this.activeRuns().length >= MAX_CONCURRENT_RUNS) return;
    if (!force && Math.random() > 0.35) return;

    const agent = pick(this.agents);
    const templates = TASK_TEMPLATES[agent.id] ?? ["Run task #{n}"];
    this.taskCounter += randInt(1, 4);
    const task = pick(templates).replace("{n}", String(this.taskCounter));

    const run: AgentRun = {
      id: randomUUID(),
      agentId: agent.id,
      task,
      status: "running",
      startedAt: now(),
      updatedAt: now(),
      progress: 0,
      retryCount: 0,
      totalCostUsd: 0,
      totalTokens: 0,
      currentStep: "Initializing",
    };
    this.runs.set(run.id, run);
    this.logs.set(run.id, []);
    this.addLog(run.id, "info", `Run started for agent "${agent.name}": ${task}`);
    this.emit({ type: "run_created", payload: run });
  }

  addLog(runId: string, level: LogEntry["level"], message: string, toolId?: string) {
    const entry: LogEntry = {
      id: randomUUID(),
      runId,
      timestamp: now(),
      level,
      message,
      toolId,
    };
    const list = this.logs.get(runId) ?? [];
    list.push(entry);
    if (list.length > MAX_LOGS_PER_RUN) list.shift();
    this.logs.set(runId, list);
    this.emit({ type: "log_added", payload: entry });
  }

  addCost(run: AgentRun) {
    const agent = this.agents.find((a) => a.id === run.agentId)!;
    const inputTokens = randInt(200, 2500);
    const outputTokens = randInt(100, 1200);
    const costUsd =
      (inputTokens / 1000) * agent.costPerformance.inputPer1kTokens +
      (outputTokens / 1000) * agent.costPerformance.outputPer1kTokens;

    const entry: CostEntry = {
      id: randomUUID(),
      runId: run.id,
      agentId: run.agentId,
      timestamp: now(),
      inputTokens,
      outputTokens,
      costUsd,
    };
    this.costs.push(entry);
    if (this.costs.length > MAX_HISTORY * 3) this.costs.shift();

    run.totalCostUsd += costUsd;
    run.totalTokens += inputTokens + outputTokens;
    this.emit({ type: "cost_added", payload: entry });
  }

  triggerError(run: AgentRun) {
    const message = pick(ERROR_MESSAGES);
    const error: ErrorEvent = {
      id: randomUUID(),
      runId: run.id,
      timestamp: now(),
      message,
      retryAttempt: run.retryCount + 1,
      resolved: false,
    };
    this.errors.push(error);
    if (this.errors.length > MAX_HISTORY) this.errors.shift();
    this.addLog(run.id, "error", message);
    this.emit({ type: "error_added", payload: error });

    if (run.retryCount >= MAX_RETRIES) {
      run.status = "failed";
      run.finishedAt = now();
      this.addLog(run.id, "error", `Run failed permanently after ${run.retryCount} retries`);
      this.emit({ type: "run_updated", payload: run });
      return;
    }

    run.retryCount += 1;
    run.status = "retrying";
    const backoffMs = 500 * 2 ** run.retryCount + randInt(0, 250);
    const retry: RetryEvent = {
      id: randomUUID(),
      runId: run.id,
      attempt: run.retryCount,
      timestamp: now(),
      backoffMs,
      reason: message,
    };
    this.retries.push(retry);
    if (this.retries.length > MAX_HISTORY) this.retries.shift();
    this.addLog(run.id, "warn", `Retrying (attempt ${run.retryCount}/${MAX_RETRIES}) after backoff ${backoffMs}ms`);
    this.emit({ type: "retry_added", payload: retry });

    setTimeout(() => {
      if (run.status === "retrying") {
        run.status = "running";
        this.addLog(run.id, "info", "Resuming after retry backoff");
        this.emit({ type: "run_updated", payload: run });
      }
    }, Math.min(backoffMs, 4000));
  }

  requestApproval(run: AgentRun, toolId: string) {
    const tool = this.tools.find((t) => t.id === toolId)!;
    run.status = "awaiting_approval";
    const approval: ApprovalRequest = {
      id: randomUUID(),
      runId: run.id,
      agentId: run.agentId,
      createdAt: now(),
      decision: "pending",
      action: `Call high-risk tool \`${tool.name}\``,
      riskLevel: tool.risk as "low" | "medium" | "high",
      reason: `Agent requested to invoke "${tool.name}" which requires human approval.`,
      toolId,
    };
    this.approvals.set(approval.id, approval);
    this.addLog(run.id, "warn", `Paused: awaiting human approval to call \`${tool.name}\``);
    this.emit({ type: "approval_created", payload: approval });
    this.emit({ type: "run_updated", payload: run });
  }

  decideApproval(approvalId: string, decision: "approved" | "denied", decidedBy: string) {
    const approval = this.approvals.get(approvalId);
    if (!approval || approval.decision !== "pending") return null;
    approval.decision = decision;
    approval.decidedAt = now();
    approval.decidedBy = decidedBy;
    this.emit({ type: "approval_decided", payload: approval });

    const run = this.runs.get(approval.runId);
    if (run) {
      if (decision === "approved") {
        run.status = "running";
        this.addLog(run.id, "info", `Approval granted by ${decidedBy}. Resuming execution.`);
      } else {
        run.status = "denied";
        run.finishedAt = now();
        this.addLog(run.id, "error", `Approval denied by ${decidedBy}. Run halted.`);
      }
      this.emit({ type: "run_updated", payload: run });
    }
    return approval;
  }

  checkApprovalTimeouts() {
    for (const approval of this.approvals.values()) {
      if (approval.decision !== "pending") continue;
      const age = Date.now() - new Date(approval.createdAt).getTime();
      if (age > APPROVAL_AUTO_TIMEOUT_MS) {
        const decision = Math.random() < 0.7 ? "approved" : "denied";
        this.decideApproval(approval.id, decision, "system (auto-timeout)");
      }
    }
  }

  tick() {
    this.maybeSpawnRun();

    for (const run of this.runs.values()) {
      if (run.status !== "running") continue;

      const roll = Math.random();
      if (roll < 0.08) {
        run.currentStep = "Handling error";
        this.triggerError(run);
        continue;
      }

      const toolIds = AGENT_TOOLS[run.agentId] ?? [];
      if (roll < 0.28 && toolIds.length > 0) {
        const toolId = pick(toolIds);
        const tool = this.tools.find((t) => t.id === toolId)!;
        const permission = this.permissions.find(
          (p) => p.agentId === run.agentId && p.toolId === toolId
        );
        if (permission?.requiresApproval && Math.random() < 0.5) {
          this.requestApproval(run, toolId);
          continue;
        }
        run.currentStep = `Calling ${tool.name}`;
        this.addLog(
          run.id,
          "info",
          pick(LOG_TEMPLATES.tool).replace("{tool}", tool.name).replace("{ms}", String(randInt(80, 900))),
          toolId
        );
        this.addCost(run);
      } else if (roll < 0.55) {
        run.currentStep = "Reasoning";
        this.addLog(
          run.id,
          "debug",
          pick(LOG_TEMPLATES.reasoning)
            .replace("{n}", String(randInt(60, 99)))
        );
      } else if (roll < 0.7) {
        run.currentStep = "Planning";
        this.addLog(
          run.id,
          "debug",
          pick(LOG_TEMPLATES.planning).replace("{n}", String(randInt(2, 6)))
        );
      }

      run.progress = Math.min(100, run.progress + randInt(6, 22));
      run.updatedAt = now();

      if (run.progress >= 100) {
        run.status = "succeeded";
        run.finishedAt = now();
        run.currentStep = "Completed";
        this.addLog(run.id, "info", "Run completed successfully");
      }
      this.emit({ type: "run_updated", payload: run });
    }
  }

  // snapshot helpers for REST endpoints -------------------------------------

  listRuns(): AgentRun[] {
    return [...this.runs.values()].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  getRun(id: string): AgentRun | undefined {
    return this.runs.get(id);
  }

  getLogs(runId: string): LogEntry[] {
    return this.logs.get(runId) ?? [];
  }

  listApprovals(): ApprovalRequest[] {
    return [...this.approvals.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  listCosts(): CostEntry[] {
    return this.costs;
  }

  listErrors(): ErrorEvent[] {
    return this.errors;
  }

  listRetries(): RetryEvent[] {
    return this.retries;
  }
}

declare global {
  var __controlCenterEngine: ControlCenterEngine | undefined;
}

export function getEngine(): ControlCenterEngine {
  if (!globalThis.__controlCenterEngine) {
    globalThis.__controlCenterEngine = new ControlCenterEngine();
    globalThis.__controlCenterEngine.start();
  }
  return globalThis.__controlCenterEngine;
}
