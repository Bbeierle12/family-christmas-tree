/**
 * Agentic Tool Implementations
 * Follows OpenAI function calling schema format
 */

import type { ScopeLevel, UnifiedDiff, MetricsSnapshot, ToolCallResult } from "./types";
import { validateDiff, applyDiff } from "./diffWriter";

// =============================================================================
// TOOL SCHEMAS (OpenAI function calling format)
// =============================================================================

export const TOOL_SCHEMAS = [
  {
    name: "code_search",
    description: "Search repository code. Returns brief matches with file paths and line spans.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2 },
        globs: {
          type: "array",
          items: { type: "string" },
          default: ["src/**/*.tsx", "src/**/*.ts", "src/**/*.jsx", "src/**/*.js"],
        },
      },
      required: ["query"],
    },
  },
  {
    name: "write_diff",
    description: "Apply a minimal unified diff within allowed paths. Rejects edits outside scope.",
    parameters: {
      type: "object",
      properties: {
        unified_diff: { type: "string", minLength: 10 },
        rationale: { type: "string", minLength: 5 },
        scope: { type: "string", enum: ["DATA_ONLY", "UI_SAFE", "LOGIC_STRICT"] },
      },
      required: ["unified_diff", "rationale", "scope"],
    },
  },
  {
    name: "sandbox_start",
    description: "Start an ephemeral sandbox to build/run tests. Defaults to no network.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["wasm", "container"], default: "container" },
        net: { type: "string", enum: ["off", "egress-allowlist"], default: "off" },
      },
    },
  },
  {
    name: "run_linter",
    description: "Run ESLint/Prettier (fast static check).",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "run_typecheck",
    description: "Run tsc or language type checker.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "run_tests",
    description: "Run unit/integration tests.",
    parameters: {
      type: "object",
      properties: {
        selectors: {
          type: "array",
          items: { type: "string" },
        },
        budget_seconds: {
          type: "integer",
          minimum: 5,
          maximum: 600,
          default: 180,
        },
      },
    },
  },
  {
    name: "run_smoke",
    description: "Run smoke probes against a local preview server.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri", default: "http://localhost:5173" },
      },
    },
  },
  {
    name: "run_app_preview",
    description: "Start the app in preview mode and return a shareable URL.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "create_flag",
    description: "Create a feature flag key.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string" },
        description: { type: "string", default: "" },
      },
      required: ["key"],
    },
  },
  {
    name: "toggle_flag",
    description: "Toggle a feature flag for an audience.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string" },
        onoff: { type: "string", enum: ["on", "off"] },
        audience: {
          type: "string",
          enum: ["self", "dev", "canary1", "p1", "p10", "all"],
          default: "self",
        },
      },
      required: ["key", "onoff"],
    },
  },
  {
    name: "collect_metrics",
    description: "Return current error rate and web-vitals deltas vs baseline.",
    parameters: {
      type: "object",
      properties: {
        window_minutes: { type: "integer", minimum: 1, maximum: 120, default: 10 },
      },
    },
  },
  {
    name: "commit_or_pr",
    description: "Create a commit/PR with plan, diffs, logs, reviewers.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string" },
        reviewers: {
          type: "array",
          items: { type: "string" },
          default: [],
        },
      },
      required: ["title", "body"],
    },
  },
] as const;

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

interface CodeSearchResult {
  matches: Array<{ file: string; line: number; snippet: string }>;
  totalMatches: number;
}

export async function codeSearch(query: string, globs?: string[]): Promise<CodeSearchResult> {
  // TODO: Wire to VS Code API (workspace.findFiles + grep)
  // For now, return mock data
  await delay(500);
  
  return {
    matches: [
      {
        file: "src/features/nodes/PersonNode.tsx",
        line: 45,
        snippet: `<Card className="w-64 shadow-md border-2">`,
      },
      {
        file: "src/components/ui/card.tsx",
        line: 12,
        snippet: `const Card = React.forwardRef<...`,
      },
    ],
    totalMatches: 2,
  };
}

interface WriteDiffResult {
  applied: boolean;
  filesChanged: string[];
  error?: string;
}

export async function writeDiff(
  unified_diff: string,
  rationale: string,
  scope: ScopeLevel
): Promise<WriteDiffResult> {
  // Validate the diff against scope rules
  const validation = validateDiff(unified_diff, scope);
  
  if (!validation.valid) {
    return {
      applied: false,
      filesChanged: [],
      error: validation.errors.join("; "),
    };
  }
  
  // Apply the diff
  const result = await applyDiff(unified_diff, scope);
  
  if (!result.success) {
    return {
      applied: false,
      filesChanged: [],
      error: result.errors.join("; "),
    };
  }
  
  return {
    applied: true,
    filesChanged: result.filesChanged,
  };
}

interface SandboxResult {
  id: string;
  status: "running" | "stopped";
  kind: "wasm" | "container";
}

export async function sandboxStart(kind: "wasm" | "container" = "container", net: "off" | "egress-allowlist" = "off"): Promise<SandboxResult> {
  // TODO: Wire to WebContainers API or Docker
  await delay(1000);
  
  return {
    id: `sandbox_${Date.now()}`,
    status: "running",
    kind,
  };
}

interface CheckResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  duration_ms: number;
}

export async function runLinter(): Promise<CheckResult> {
  // TODO: Run ESLint via VS Code tasks or spawn process
  await delay(1200);
  
  return {
    ok: true,
    errors: [],
    warnings: ["Unused variable 'x' at PersonNode.tsx:78"],
    duration_ms: 1200,
  };
}

export async function runTypecheck(): Promise<CheckResult> {
  // TODO: Run tsc via VS Code tasks
  await delay(1500);
  
  return {
    ok: true,
    errors: [],
    warnings: [],
    duration_ms: 1500,
  };
}

interface TestResult extends CheckResult {
  passed: number;
  failed: number;
  skipped: number;
}

export async function runTests(selectors?: string[], budget_seconds: number = 180): Promise<TestResult> {
  // TODO: Run vitest via VS Code tasks
  await delay(2000);
  
  return {
    ok: true,
    errors: [],
    warnings: [],
    passed: 12,
    failed: 0,
    skipped: 1,
    duration_ms: 2000,
  };
}

interface SmokeResult {
  ok: boolean;
  statusCode: number;
  responseTime_ms: number;
  error?: string;
}

export async function runSmoke(url: string = "http://localhost:5173"): Promise<SmokeResult> {
  // TODO: Actual HTTP probe
  await delay(300);
  
  return {
    ok: true,
    statusCode: 200,
    responseTime_ms: 45,
  };
}

interface PreviewResult {
  url: string;
  hmr: boolean;
  status: "ready" | "starting" | "error";
}

export async function runAppPreview(): Promise<PreviewResult> {
  // TODO: Start Vite dev server if not running, return URL
  await delay(2000);
  
  return {
    url: "http://localhost:5173",
    hmr: true,
    status: "ready",
  };
}

interface FlagResult {
  key: string;
  created: boolean;
  audience?: string;
  state?: "on" | "off";
}

export async function createFlag(key: string, description: string = ""): Promise<FlagResult> {
  // Mock: LaunchDarkly integration
  await delay(500);
  
  return {
    key,
    created: true,
  };
}

export async function toggleFlag(
  key: string,
  onoff: "on" | "off",
  audience: string = "self"
): Promise<FlagResult> {
  // Mock: LaunchDarkly toggle
  await delay(300);
  
  return {
    key,
    created: false,
    audience,
    state: onoff,
  };
}

export async function collectMetrics(window_minutes: number = 10): Promise<MetricsSnapshot> {
  // Mock: APM integration (Datadog/Sentry)
  await delay(800);
  
  return {
    error_rate_5xx: 0.3, // 0.3%
    vitals: {
      LCP_p75_delta: 0.05, // +5%
      FID_p75_delta: -0.02, // -2%
      CLS_p75_delta: 0.01, // +1%
    },
    timestamp: Date.now(),
    windowMinutes: window_minutes,
  };
}

interface CommitResult {
  pr_number?: number;
  commit_sha?: string;
  url: string;
}

export async function commitOrPR(
  title: string,
  body: string,
  reviewers: string[] = []
): Promise<CommitResult> {
  // Mock: Git/GitHub integration
  await delay(1000);
  
  return {
    pr_number: 42,
    url: "https://github.com/Bbeierle12/family-christmas-tree/pull/42",
  };
}

// =============================================================================
// TOOL EXECUTOR (dispatches to implementations)
// =============================================================================

export async function executeTool(toolName: string, args: Record<string, any>): Promise<ToolCallResult> {
  const startTime = Date.now();
  
  try {
    let result: any;
    
    switch (toolName) {
      case "code_search":
        result = await codeSearch(args.query, args.globs);
        break;
      case "write_diff":
        result = await writeDiff(args.unified_diff, args.rationale, args.scope);
        break;
      case "sandbox_start":
        result = await sandboxStart(args.kind, args.net);
        break;
      case "run_linter":
        result = await runLinter();
        break;
      case "run_typecheck":
        result = await runTypecheck();
        break;
      case "run_tests":
        result = await runTests(args.selectors, args.budget_seconds);
        break;
      case "run_smoke":
        result = await runSmoke(args.url);
        break;
      case "run_app_preview":
        result = await runAppPreview();
        break;
      case "create_flag":
        result = await createFlag(args.key, args.description);
        break;
      case "toggle_flag":
        result = await toggleFlag(args.key, args.onoff, args.audience);
        break;
      case "collect_metrics":
        result = await collectMetrics(args.window_minutes);
        break;
      case "commit_or_pr":
        result = await commitOrPR(args.title, args.body, args.reviewers);
        break;
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
    
    const duration_ms = Date.now() - startTime;
    
    return {
      tool: toolName,
      args,
      result,
      ok: true,
      timestamp: Date.now(),
      duration_ms,
    };
  } catch (error) {
    const duration_ms = Date.now() - startTime;
    
    return {
      tool: toolName,
      args,
      result: null,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
      duration_ms,
    };
  }
}

// Utility
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
