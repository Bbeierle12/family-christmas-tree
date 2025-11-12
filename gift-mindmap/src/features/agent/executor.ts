/**
 * Agent Executor
 * Orchestrates the workflow with OpenAI function calling
 */

import type {
  WorkflowManifest,
  WorkflowState,
  WorkflowNode,
  AgentMessage,
  ToolCallResult,
  GateResult,
} from "./types";
import { executeTool, TOOL_SCHEMAS } from "./tools";

// Helper to find last matching element
function findLast<T>(arr: T[], predicate: (item: T) => boolean): T | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return arr[i];
  }
  return undefined;
}

interface AgentExecutorOptions {
  apiKey?: string;
  onProgress?: (state: WorkflowState) => void;
  onMessage?: (message: AgentMessage) => void;
}

export class AgentExecutor {
  private workflow: WorkflowManifest;
  private state: WorkflowState;
  private options: AgentExecutorOptions;

  constructor(workflow: WorkflowManifest, options: AgentExecutorOptions = {}) {
    this.workflow = workflow;
    this.options = options;
    this.state = {
      workflowId: workflow.workflow_id,
      currentNode: null,
      activeNodeStatus: "pending",
      variables: { ...workflow.variables },
      history: [],
      pendingApproval: null,
      startTime: Date.now(),
      lastUpdate: Date.now(),
    };
  }

  async execute(userMessage: string): Promise<WorkflowState> {
    this.addMessage({
      id: `msg_${Date.now()}`,
      role: "user",
      text: userMessage,
      timestamp: Date.now(),
    });

    try {
      // Start from the classify node
      await this.executeNode("classify", userMessage);
      
      // Continue through the workflow
      await this.continueWorkflow();
      
      return this.state;
    } catch (error) {
      this.addMessage({
        id: `msg_${Date.now()}`,
        role: "system",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        status: "error",
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  private async continueWorkflow(): Promise<void> {
    while (this.state.currentNode !== "done") {
      const nextNode = this.getNextNode();
      
      if (!nextNode) {
        // No next node (probably waiting for approval)
        break;
      }
      
      await this.executeNode(nextNode.id, null);
    }
  }

  private getNextNode(): WorkflowNode | null {
    if (!this.state.currentNode) return null;
    
    // Find edges from current node
    const edges = this.workflow.edges.filter((e) => e.from === this.state.currentNode);
    
    for (const edge of edges) {
      if (!edge.condition || edge.condition === "approved") {
        // Unconditional or special conditions
        if (edge.condition === "approved" && this.state.pendingApproval?.status !== "approved") {
          continue;
        }
      } else if (edge.condition === "otherwise") {
        // Fallback condition
        continue;
      } else {
        // Evaluate condition against last tool results
        const passed = this.evaluateCondition(edge.condition);
        if (!passed) continue;
      }
      
      // Apply effects if any
      if (edge.effects) {
        for (const [key, expr] of Object.entries(edge.effects)) {
          this.state.variables[key] = this.evaluateExpression(expr);
        }
      }
      
      return this.workflow.nodes.find((n) => n.id === edge.to) || null;
    }
    
    // Check for "otherwise" fallback
    const otherwiseEdge = edges.find((e) => e.condition === "otherwise");
    if (otherwiseEdge) {
      return this.workflow.nodes.find((n) => n.id === otherwiseEdge.to) || null;
    }
    
    return null;
  }

  private evaluateCondition(condition: string): boolean {
    // Simple condition evaluator
    // In production, use a proper expression parser
    
    // Check tool results from history
    const lastLinter = findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_linter");
    const lastTypecheck = findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_typecheck");
    const lastTests = findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_tests");
    const lastSmoke = findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_smoke");
    const lastMetrics = findLast(this.state.history, (h: ToolCallResult) => h.tool === "collect_metrics");
    
    const context: Record<string, any> = {
      linter: { ok: lastLinter?.result?.ok ?? false },
      typecheck: { ok: lastTypecheck?.result?.ok ?? false },
      tests: { ok: lastTests?.result?.ok ?? false },
      smoke: { ok: lastSmoke?.result?.ok ?? false },
      error_rate_5xx: lastMetrics?.result?.error_rate_5xx ?? 0,
      vitals: lastMetrics?.result?.vitals ?? {},
      retries: this.state.variables.retries,
    };
    
    // Replace variables in condition
    let expr = condition;
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === "object") {
        for (const [subKey, subValue] of Object.entries(value)) {
          expr = expr.replace(new RegExp(`${key}\\.${subKey}`, "g"), String(subValue));
        }
      } else {
        expr = expr.replace(new RegExp(`\\b${key}\\b`, "g"), String(value));
      }
    }
    
    try {
      // UNSAFE: eval for demo only - use a safe expression parser in production
      return eval(expr);
    } catch {
      return false;
    }
  }

  private evaluateExpression(expr: string): any {
    // Simple expression evaluator for effects
    const match = expr.match(/(\w+)\s*\+\s*(\d+)/);
    if (match) {
      const [, varName, increment] = match;
      return (this.state.variables[varName] || 0) + parseInt(increment, 10);
    }
    return expr;
  }

  private async executeNode(nodeId: string, context: string | null): Promise<void> {
    const node = this.workflow.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);
    
    this.state.currentNode = nodeId;
    this.state.activeNodeStatus = "running";
    this.state.lastUpdate = Date.now();
    this.notifyProgress();
    
    try {
      switch (node.type) {
        case "input":
          // Already handled
          break;
        
        case "agent":
          await this.executeAgentNode(node, context);
          break;
        
        case "tool":
          await this.executeToolNode(node);
          break;
        
        case "gate":
          await this.executeGateNode(node);
          break;
        
        case "human_approval":
          await this.executeApprovalNode(node);
          break;
        
        case "output":
          this.state.activeNodeStatus = "success";
          this.addMessage({
            id: `msg_${Date.now()}`,
            role: "system",
            text: "✅ Workflow complete!",
            timestamp: Date.now(),
          });
          break;
      }
      
      if (node.type !== "human_approval") {
        this.state.activeNodeStatus = "success";
      }
    } catch (error) {
      this.state.activeNodeStatus = "error";
      throw error;
    }
    
    this.notifyProgress();
  }

  private async executeAgentNode(node: WorkflowNode, context: string | null): Promise<void> {
    if (!this.options.apiKey) {
      // Mock mode for development (no API key provided)
      this.addMessage({
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: `[${node.label}] Classified as UI_SAFE. Plan: 1) Search for PersonNode, 2) Generate diff for border change, 3) Run checks.`,
        timestamp: Date.now(),
      });
      
      // Update scope if this is the classify node
      if (node.id === "classify") {
        this.state.variables.scope = "UI_SAFE";
      }
      
      return;
    }
    
    // Call OpenAI with function calling
    const apiKey = this.options.apiKey;
    
    const messages = [
      { role: "system", content: node.instructions || "" },
      { role: "user", content: context || "Execute this step" },
    ];
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: node.model || "gpt-4o-mini",
        messages,
        tools: TOOL_SCHEMAS.map((t) => ({ type: "function", function: t })),
        tool_choice: "auto",
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const message = data.choices[0]?.message;
    
    if (message?.content) {
      this.addMessage({
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: message.content,
        timestamp: Date.now(),
      });
    }
    
    // Handle tool calls if any
    if (message?.tool_calls) {
      const toolResults: ToolCallResult[] = [];
      
      for (const toolCall of message.tool_calls) {
        const result = await executeTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );
        toolResults.push(result);
        this.state.history.push(result);
      }
      
      this.addMessage({
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: `Executed ${toolResults.length} tool(s)`,
        toolCalls: toolResults,
        timestamp: Date.now(),
      });
    }
  }

  private async executeToolNode(node: WorkflowNode): Promise<void> {
    const toolName = node.label;
    const args = { ...node.defaults };
    
    // Replace {{variables}}
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
        const varName = value.slice(2, -2);
        args[key] = this.state.variables[varName];
      }
    }
    
    this.addMessage({
      id: `msg_${Date.now()}`,
      role: "system",
      text: `🔧 Running ${toolName}...`,
      status: "pending",
      timestamp: Date.now(),
    });
    
    const result = await executeTool(toolName, args);
    this.state.history.push(result);
    
    const statusIcon = result.ok ? "✅" : "❌";
    this.addMessage({
      id: `msg_${Date.now()}`,
      role: "assistant",
      text: `${statusIcon} ${toolName} completed in ${result.duration_ms}ms`,
      toolCalls: [result],
      status: result.ok ? "success" : "error",
      timestamp: Date.now(),
    });
    
    if (!result.ok) {
      throw new Error(`Tool ${toolName} failed: ${result.error}`);
    }
  }

  private async executeGateNode(node: WorkflowNode): Promise<void> {
    // Evaluate gate condition
    const lastLinter = findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_linter");
    const lastTypecheck = findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_typecheck");
    const lastTests = findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_tests");
    const lastSmoke = findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_smoke");
    
    const checks = {
      linter: lastLinter?.result?.ok ?? false,
      typecheck: lastTypecheck?.result?.ok ?? false,
      tests: lastTests?.result?.ok ?? false,
      smoke: lastSmoke?.result?.ok ?? false,
    };
    
    const allPassed = Object.values(checks).every((v) => v);
    
    const statusIcon = allPassed ? "✅" : "❌";
    this.addMessage({
      id: `msg_${Date.now()}`,
      role: "system",
      text: `${statusIcon} Gate: ${Object.entries(checks)
        .map(([k, v]) => `${k}=${v ? "✓" : "✗"}`)
        .join(", ")}`,
      timestamp: Date.now(),
    });
  }

  private async executeApprovalNode(node: WorkflowNode): Promise<void> {
    // Create approval request
    const lastDiff = findLast(this.state.history, (h: ToolCallResult) => h.tool === "write_diff");
    const checks = {
      linter: findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_linter")?.result?.ok ?? false,
      typecheck: findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_typecheck")?.result?.ok ?? false,
      tests: findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_tests")?.result?.ok ?? false,
      smoke: findLast(this.state.history, (h: ToolCallResult) => h.tool === "run_smoke")?.result?.ok ?? false,
    };
    
    this.state.pendingApproval = {
      id: `approval_${Date.now()}`,
      node: node.id,
      title: node.label,
      diff: lastDiff?.args?.unified_diff,
      checkResults: checks,
      timestamp: Date.now(),
      status: "pending",
    };
    
    this.state.activeNodeStatus = "waiting";
    
    this.addMessage({
      id: `msg_${Date.now()}`,
      role: "system",
      text: `⏸️ Waiting for approval: ${node.label}`,
      status: "pending",
      timestamp: Date.now(),
    });
  }

  approve(approver: string): void {
    if (this.state.pendingApproval) {
      this.state.pendingApproval.status = "approved";
      this.state.pendingApproval.approver = approver;
      
      this.addMessage({
        id: `msg_${Date.now()}`,
        role: "system",
        text: `✅ Approved by ${approver}`,
        timestamp: Date.now(),
      });
      
      // Continue workflow
      this.continueWorkflow();
    }
  }

  reject(approver: string, reason?: string): void {
    if (this.state.pendingApproval) {
      this.state.pendingApproval.status = "rejected";
      this.state.pendingApproval.approver = approver;
      
      this.addMessage({
        id: `msg_${Date.now()}`,
        role: "system",
        text: `❌ Rejected by ${approver}${reason ? `: ${reason}` : ""}`,
        timestamp: Date.now(),
      });
      
      this.state.currentNode = "done";
      this.state.activeNodeStatus = "error";
      this.notifyProgress();
    }
  }

  getState(): WorkflowState {
    return { ...this.state };
  }

  private addMessage(message: AgentMessage): void {
    this.options.onMessage?.(message);
  }

  private notifyProgress(): void {
    this.options.onProgress?.(this.state);
  }
}
