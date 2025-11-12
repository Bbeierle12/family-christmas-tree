/**
 * Workflow Status Component
 * Visualizes the DAG execution progress, active node, and check results
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  AlertCircle,
  Play,
  Pause
} from "lucide-react";
import { useAgentStore } from "@/store/agentStore";
import type { NodeStatus } from "../agent/types";

export function WorkflowStatus() {
  const { workflowState, isProcessing } = useAgentStore();

  if (!workflowState) {
    return null;
  }

  const { currentNode, activeNodeStatus, variables, history, pendingApproval } = workflowState;

  // Get check results
  const checks = {
    linter: history.find((h) => h.tool === "run_linter"),
    typecheck: history.find((h) => h.tool === "run_typecheck"),
    tests: history.find((h) => h.tool === "run_tests"),
    smoke: history.find((h) => h.tool === "run_smoke"),
  };

  const allChecksGreen = Object.values(checks).every((c) => c?.ok);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Play className="w-4 h-4" />
          Workflow Status
          {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Node */}
        <div>
          <div className="text-xs text-muted-foreground mb-1">Current Step</div>
          <div className="flex items-center gap-2">
            <StatusIcon status={activeNodeStatus} />
            <span className="font-mono text-sm">{currentNode || "waiting"}</span>
            <Badge variant={getStatusVariant(activeNodeStatus)} className="text-xs">
              {activeNodeStatus}
            </Badge>
          </div>
        </div>

        {/* Scope Level */}
        <div>
          <div className="text-xs text-muted-foreground mb-1">Scope</div>
          <Badge variant="outline" className="font-mono">
            {variables.scope}
          </Badge>
        </div>

        {/* Checks Status */}
        {Object.keys(checks).some((k) => checks[k as keyof typeof checks]) && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Quality Checks</div>
            <div className="space-y-1">
              {Object.entries(checks).map(([name, result]) => {
                if (!result) return null;
                return (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{name}</span>
                    <div className="flex items-center gap-1">
                      {result.ok ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-muted-foreground">
                            {result.duration_ms}ms
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-600">Failed</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {allChecksGreen && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                All checks passed!
              </div>
            )}
          </div>
        )}

        {/* Retry Counter */}
        {variables.retries > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Retries</div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm">{variables.retries} / 3</span>
            </div>
          </div>
        )}

        {/* Pending Approval */}
        {pendingApproval && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Pause className="w-4 h-4" />
              <span className="font-medium">Waiting for approval</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">{pendingApproval.title}</p>
          </div>
        )}

        {/* Pipeline Progress */}
        <div>
          <div className="text-xs text-muted-foreground mb-1">Pipeline</div>
          <PipelineProgress 
            currentNode={currentNode} 
            history={history}
          />
        </div>

        {/* Stats */}
        <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {Math.round((Date.now() - workflowState.startTime) / 1000)}s elapsed
            </span>
          </div>
          <div>
            {history.length} tool{history.length !== 1 ? "s" : ""} called
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: NodeStatus }) {
  switch (status) {
    case "running":
      return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "error":
      return <XCircle className="w-4 h-4 text-red-600" />;
    case "waiting":
      return <Pause className="w-4 h-4 text-amber-600" />;
    default:
      return <Clock className="w-4 h-4 text-slate-400" />;
  }
}

function getStatusVariant(status: NodeStatus): "default" | "secondary" | "outline" {
  switch (status) {
    case "success":
      return "default";
    case "error":
      return "outline";
    case "waiting":
      return "secondary";
    default:
      return "outline";
  }
}

interface PipelineProgressProps {
  currentNode: string | null;
  history: Array<{ tool: string; ok: boolean }>;
}

function PipelineProgress({ currentNode, history }: PipelineProgressProps) {
  const pipeline = [
    { id: "classify", label: "Classify", icon: "📋" },
    { id: "code_search", label: "Search", icon: "🔍" },
    { id: "write_diff", label: "Diff", icon: "✏️" },
    { id: "run_linter", label: "Lint", icon: "🔧" },
    { id: "run_typecheck", label: "Type", icon: "📐" },
    { id: "run_tests", label: "Test", icon: "✅" },
    { id: "run_smoke", label: "Smoke", icon: "💨" },
    { id: "gate_checks", label: "Gate", icon: "🚦" },
    { id: "run_preview", label: "Preview", icon: "👁️" },
    { id: "approval_gate", label: "Approve", icon: "✋" },
  ];

  const getStepStatus = (stepId: string) => {
    if (currentNode === stepId) return "active";
    
    const toolName = stepId.startsWith("run_") || stepId === "code_search" || stepId === "write_diff"
      ? stepId
      : null;
    
    if (toolName) {
      const result = history.find((h) => h.tool === toolName);
      if (result) {
        return result.ok ? "complete" : "error";
      }
    }
    
    return "pending";
  };

  return (
    <div className="flex flex-wrap gap-1">
      {pipeline.map((step) => {
        const status = getStepStatus(step.id);
        return (
          <div
            key={step.id}
            className={`
              px-2 py-1 rounded text-xs flex items-center gap-1
              ${status === "active" ? "bg-blue-100 border border-blue-300 text-blue-700" : ""}
              ${status === "complete" ? "bg-green-100 border border-green-300 text-green-700" : ""}
              ${status === "error" ? "bg-red-100 border border-red-300 text-red-700" : ""}
              ${status === "pending" ? "bg-slate-100 border border-slate-200 text-slate-500" : ""}
            `}
          >
            <span>{step.icon}</span>
            <span className="font-medium">{step.label}</span>
            {status === "active" && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === "complete" && <CheckCircle2 className="w-3 h-3" />}
            {status === "error" && <XCircle className="w-3 h-3" />}
          </div>
        );
      })}
    </div>
  );
}
