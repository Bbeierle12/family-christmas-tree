/**
 * Agentic Workflow Types
 * Based on OpenAI Agent Builder / Agents SDK primitives
 */

export type ScopeLevel = "DATA_ONLY" | "UI_SAFE" | "LOGIC_STRICT";

export type NodeType = "input" | "agent" | "tool" | "gate" | "human_approval" | "output";

export type NodeStatus = "pending" | "running" | "success" | "error" | "waiting" | "skipped";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  model?: string;
  instructions?: string;
  defaults?: Record<string, any>;
  status?: NodeStatus;
  output?: any;
  error?: string;
  timestamp?: number;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
  effects?: Record<string, string>;
}

export interface WorkflowVariables {
  scope: ScopeLevel;
  feature_key: string;
  retries: number;
  [key: string]: any;
}

export interface WorkflowManifest {
  workflow_id: string;
  version: string;
  variables: WorkflowVariables;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// Tool call result structure (matches OpenAI function calling)
export interface ToolCallResult {
  tool: string;
  args: Record<string, any>;
  result: any;
  ok: boolean;
  error?: string;
  timestamp: number;
  duration_ms?: number;
}

// Chat message structure (enhanced for tool visualization)
export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  text: string;
  toolCalls?: ToolCallResult[];
  status?: "pending" | "success" | "error";
  timestamp: number;
}

// Gate evaluation result
export interface GateResult {
  gate: string;
  passed: boolean;
  checks: Record<string, boolean>;
  message: string;
}

// Approval gate data
export interface ApprovalRequest {
  id: string;
  node: string;
  title: string;
  diff?: string;
  checkResults: Record<string, boolean>;
  metrics?: Record<string, any>;
  timestamp: number;
  status: "pending" | "approved" | "rejected";
  approver?: string;
}

// Workflow execution state
export interface WorkflowState {
  workflowId: string;
  currentNode: string | null;
  activeNodeStatus: NodeStatus;
  variables: WorkflowVariables;
  history: ToolCallResult[];
  pendingApproval: ApprovalRequest | null;
  startTime: number;
  lastUpdate: number;
}

// Unified diff structure
export interface UnifiedDiff {
  filePath: string;
  diff: string;
  rationale: string;
  scope: ScopeLevel;
  linesAdded: number;
  linesRemoved: number;
}

// Metrics snapshot (for canary gates)
export interface MetricsSnapshot {
  error_rate_5xx: number;
  vitals: {
    LCP_p75_delta: number;
    FID_p75_delta: number;
    CLS_p75_delta: number;
  };
  timestamp: number;
  windowMinutes: number;
}
