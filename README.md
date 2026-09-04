# AI Automation Control Center

An operational dashboard for a fleet of autonomous AI agents — the kind of internal tool a team running agents in production actually needs: what's executing right now, what it's costing, what it's allowed to touch, what's failing, and what's waiting on a human.

This is not another chatbot demo. It's the control plane behind one.

![status](https://img.shields.io/badge/status-live%20demo-38bdf8) ![stack](https://img.shields.io/badge/stack-Next.js%20%2B%20TypeScript-black)

## What it does

A simulated fleet of six agents (email triage, invoice reconciliation, code review, customer support, a data-pipeline monitor, and a security scanner) runs continuously against a server-side engine that generates realistic execution events in real time — no external API keys required. The dashboard streams those events live over Server-Sent Events.

- **Run execution** — every agent run tracked through `queued → running → retrying/awaiting_approval → succeeded/failed/denied`, with a live progress bar and current step.
- **Streaming logs** — a per-run, terminal-style log viewer that appends new lines as they happen, colored by level (`debug` / `info` / `warn` / `error`).
- **Cost & usage** — every tool call is metered (input/output tokens → USD, per the agent's model pricing), rolled up into cumulative spend, spend-by-agent, and a per-run cost ledger.
- **Permissions** — a scope-based grant model (`read`, `write`, `execute`, `network`, `financial`) mapping which tools each agent can call, which grants require human approval, and a full audit log of who granted what and when.
- **Errors & retries** — every failure is logged with an exponential backoff retry (capped, with a permanent-failure threshold), visualized as a timeline alongside the error log.
- **Human-in-the-loop approval** — when an agent tries to call a high-risk tool (`execute_shell_command`, `charge_payment_method`, `trigger_deployment`, …), the run pauses in `awaiting_approval` and surfaces in the approval queue for a human to approve or deny. Decisions resume or halt the run immediately and are recorded in a decision history.

## Why this design

The interesting engineering problem in "AI automation" isn't the model call — it's everything around it: observability into what an autonomous system is doing, cost accountability, least-privilege tool access, graceful failure handling, and a real human-in-the-loop checkpoint for anything irreversible. This project is built to demonstrate exactly that operational layer.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** for styling
- **Recharts** for cost/usage visualizations
- **Server-Sent Events** (native `ReadableStream`, no external pub/sub) for the live feed
- A single in-memory **simulation engine** (`src/lib/engine.ts`) standing in for a real orchestration backend — swap it for a real event source (webhooks, a message queue, your agent runtime's own event log) and the rest of the app is unchanged.

No database, no external services, no API keys. Clone it and it's alive in one command.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Agent runs start immediately and the dashboard updates live — leave it open and watch the fleet work, including approval requests timing out to an auto-decision after 40s if left unattended.

## Project structure

```
src/
  lib/
    types.ts           # domain model: Agent, AgentRun, LogEntry, CostEntry, ApprovalRequest, ...
    engine.ts           # in-memory simulation engine + event emitter (the "backend")
    store-context.tsx   # client-side state provider, hydrates from /api/bootstrap then subscribes to /api/stream
    use-run-detail.ts   # per-run live log/cost/error hook used on the run detail page
  app/
    api/
      bootstrap/        # GET full snapshot (agents, tools, runs, approvals, costs, permissions, errors, retries)
      stream/            # GET Server-Sent Events feed of live engine events
      runs/[id]/          # GET single run detail + its logs/costs/errors
      approvals/[id]/decide/  # POST approve or deny a pending approval
    page.tsx             # Overview: KPIs, spend charts, status distribution, recent runs, pending approvals
    runs/                # Full run list with status/agent filters, and per-run detail view
    approvals/            # Human approval queue + decision history
    costs/                 # Cost & usage analytics
    permissions/            # Agent × tool permission matrix + grant audit log
    errors/                  # Error log + retry timeline
```

## Extending it

The engine is intentionally isolated behind `getEngine()` — a global singleton emitting typed `ControlCenterEvent`s. To wire this dashboard up to a real agent runtime, replace the simulation loop in `engine.ts` with calls into your actual orchestrator (LangGraph, a custom agent loop, Claude Agent SDK, etc.) and emit the same event shapes; every API route and UI component is already built against that event contract.
