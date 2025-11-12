/**
 * Workflow Manifest
 * The complete DAG definition for vibe-coder-live
 */

import type { WorkflowManifest } from "./types";

export const VIBE_CODER_WORKFLOW: WorkflowManifest = {
  workflow_id: "vibe-coder-live",
  version: "1.0",
  variables: {
    scope: "DATA_ONLY",
    feature_key: "feature.vibe_change",
    retries: 0,
  },
  nodes: [
    { id: "start", type: "input", label: "User Message" },
    {
      id: "classify",
      type: "agent",
      label: "Classify & Plan (ReAct)",
      model: "gpt-4o-mini",
      instructions:
        "Classify into DATA_ONLY | UI_SAFE | LOGIC_STRICT; draft numbered plan with acceptance criteria; never write files directly—only propose minimal unified diffs via write_diff; cap retries at 3 on failures.",
    },
    { id: "code_search", type: "tool", label: "code_search" },
    { id: "write_diff", type: "tool", label: "write_diff" },
    {
      id: "sandbox_start",
      type: "tool",
      label: "sandbox_start",
      defaults: { kind: "container", net: "off" },
    },
    { id: "run_linter", type: "tool", label: "run_linter" },
    { id: "run_typecheck", type: "tool", label: "run_typecheck" },
    {
      id: "run_tests",
      type: "tool",
      label: "run_tests",
      defaults: { budget_seconds: 180 },
    },
    {
      id: "run_smoke",
      type: "tool",
      label: "run_smoke",
      defaults: { url: "http://localhost:5173/healthz" },
    },
    { id: "gate_checks", type: "gate", label: "All checks green?" },
    { id: "run_preview", type: "tool", label: "run_app_preview" },
    { id: "approval_gate", type: "human_approval", label: "Ship this change?" },
    {
      id: "create_flag",
      type: "tool",
      label: "create_flag",
      defaults: { key: "{{feature_key}}", description: "Vibe-coder safe rollout" },
    },
    {
      id: "flag_self",
      type: "tool",
      label: "toggle_flag",
      defaults: { key: "{{feature_key}}", onoff: "on", audience: "self" },
    },
    {
      id: "metrics_canary",
      type: "tool",
      label: "collect_metrics",
      defaults: { window_minutes: 10 },
    },
    {
      id: "flag_canary",
      type: "tool",
      label: "toggle_flag",
      defaults: { key: "{{feature_key}}", onoff: "on", audience: "canary1" },
    },
    {
      id: "flag_p10",
      type: "tool",
      label: "toggle_flag",
      defaults: { key: "{{feature_key}}", onoff: "on", audience: "p10" },
    },
    {
      id: "flag_all",
      type: "tool",
      label: "toggle_flag",
      defaults: { key: "{{feature_key}}", onoff: "on", audience: "all" },
    },
    { id: "commit_or_pr", type: "tool", label: "commit_or_pr" },
    {
      id: "rollback",
      type: "tool",
      label: "toggle_flag",
      defaults: { key: "{{feature_key}}", onoff: "off", audience: "all" },
    },
    {
      id: "reflect",
      type: "agent",
      label: "Reflect & Repair",
      model: "gpt-4o-mini",
      instructions:
        "Summarize failing checks; propose a smaller corrective diff strictly within scope; stop after 3 total retries.",
    },
    { id: "done", type: "output", label: "Done" },
  ],
  edges: [
    { from: "start", to: "classify" },
    { from: "classify", to: "code_search" },
    { from: "code_search", to: "write_diff" },
    { from: "write_diff", to: "sandbox_start" },
    { from: "sandbox_start", to: "run_linter" },
    { from: "run_linter", to: "run_typecheck" },
    { from: "run_typecheck", to: "run_tests" },
    { from: "run_tests", to: "run_smoke" },
    { from: "run_smoke", to: "gate_checks" },

    {
      from: "gate_checks",
      to: "run_preview",
      condition: "linter.ok && typecheck.ok && tests.ok && smoke.ok",
    },
    { from: "run_preview", to: "approval_gate" },

    { from: "approval_gate", to: "create_flag", condition: "approved" },
    { from: "create_flag", to: "flag_self" },
    { from: "flag_self", to: "metrics_canary" },
    {
      from: "metrics_canary",
      to: "flag_canary",
      condition: "error_rate_5xx <= 1 && vitals.LCP_p75_delta <= 0.2",
    },
    { from: "flag_canary", to: "flag_p10" },
    { from: "flag_p10", to: "flag_all" },
    { from: "flag_all", to: "commit_or_pr" },
    { from: "commit_or_pr", to: "done" },

    {
      from: "metrics_canary",
      to: "rollback",
      condition: "error_rate_5xx > 1 || vitals.LCP_p75_delta > 0.2",
    },
    { from: "rollback", to: "done" },

    { from: "gate_checks", to: "reflect", condition: "otherwise" },
    {
      from: "reflect",
      to: "write_diff",
      condition: "retries < 3",
      effects: { retries: "retries + 1" },
    },
    { from: "reflect", to: "done", condition: "retries >= 3" },
  ],
};
