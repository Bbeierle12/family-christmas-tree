/**
 * Agent Chat Component
 * Enhanced chat interface with tool call visualization and workflow integration
 */

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Wrench,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useAgentStore } from "@/store/agentStore";
import type { AgentMessage, ToolCallResult } from "../agent/types";

export function AgentChat() {
  const {
    messages,
    isProcessing,
    error,
    workflowState,
    startWorkflow,
    clearMessages,
  } = useAgentStore();

  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [helpCollapsed, setHelpCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isProcessing) return;

    setInput("");
    // Only pass apiKey if it's not empty
    await startWorkflow(text, apiKey.trim() ? apiKey.trim() : undefined);
  };

  const getStatusIcon = (status?: "pending" | "success" | "error") => {
    switch (status) {
      case "pending":
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case "success":
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case "error":
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span className="font-medium">AI Vibe Coder</span>
            {workflowState && (
              <Badge variant="outline" className="ml-2 text-xs">
                {workflowState.currentNode || "idle"}
              </Badge>
            )}
            {isProcessing && (
              <Loader2 className="w-3 h-3 animate-spin ml-1 text-blue-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            >
              {apiKey ? "✓ API Key" : "Set API Key"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setHelpCollapsed(!helpCollapsed)}
            >
              {helpCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* API Key Input */}
        {showApiKeyInput && (
          <div className="mb-2 p-2 bg-muted/50 rounded">
            <Input
              type="password"
              placeholder="OpenAI API Key (required for real AI assistance)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="text-xs h-8"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Without an API key, responses will be simulated placeholders.
              Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a>
            </p>
          </div>
        )}

        {/* Help Text */}
        {!helpCollapsed && (
          <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted/30 rounded">
            <strong>Try:</strong>
            <ul className="mt-1 ml-4 space-y-0.5">
              <li>• "make the person cards have blue borders"</li>
              <li>• "add a snow animation to the background"</li>
              <li>• "change the color scheme to dark mode"</li>
            </ul>
          </div>
        )}

        {/* Messages */}
        <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-white/70 mb-2 space-y-2">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {error && (
            <div className="text-sm p-2 bg-red-50 border border-red-200 rounded text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Workflow Stats */}
        {workflowState && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Retries: {workflowState.variables.retries}/3</span>
            <span>•</span>
            <span>Tools called: {workflowState.history.length}</span>
            {workflowState.pendingApproval && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-xs">
                  Waiting for approval
                </Badge>
              </>
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Describe the change you want..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isProcessing}
          />
          <Button onClick={handleSend} disabled={isProcessing || !input.trim()}>
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" /> Send
              </>
            )}
          </Button>
        </div>

        {/* Clear button */}
        {messages.length > 1 && !isProcessing && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full mt-2 text-xs"
            onClick={clearMessages}
          >
            Clear conversation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div className={`text-sm ${isUser ? "text-right" : "text-left"}`}>
      <div
        className={`inline-block max-w-[85%] px-3 py-2 rounded-2xl ${
          isUser
            ? "bg-blue-500 text-white"
            : isSystem
            ? "bg-amber-50 border border-amber-200 text-amber-900"
            : "bg-slate-100 text-slate-900"
        }`}
      >
        <div className="flex items-start gap-2">
          {message.status && (
            <div className="mt-0.5">
              {message.status === "pending" && <Loader2 className="w-3 h-3 animate-spin" />}
              {message.status === "success" && <CheckCircle2 className="w-3 h-3 text-green-600" />}
              {message.status === "error" && <XCircle className="w-3 h-3 text-red-600" />}
            </div>
          )}
          <div className="flex-1">
            <p className="whitespace-pre-wrap">{message.text}</p>
            {message.toolCalls && message.toolCalls.length > 0 && (
              <ToolCallsList toolCalls={message.toolCalls} />
            )}
          </div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-0.5 px-1">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

function ToolCallsList({ toolCalls }: { toolCalls: ToolCallResult[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-blue-600 hover:underline"
      >
        <Wrench className="w-3 h-3" />
        {toolCalls.length} tool call{toolCalls.length > 1 ? "s" : ""}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          {toolCalls.map((call, i) => (
            <div
              key={i}
              className="p-2 bg-white/50 rounded border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold">{call.tool}</span>
                <div className="flex items-center gap-1">
                  {call.ok ? (
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-600" />
                  )}
                  <span className="text-muted-foreground">
                    {call.duration_ms}ms
                  </span>
                </div>
              </div>
              {call.error && (
                <p className="text-red-600 mt-1">{call.error}</p>
              )}
              {call.result && typeof call.result === "object" && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View result
                  </summary>
                  <pre className="mt-1 text-xs overflow-x-auto">
                    {JSON.stringify(call.result, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
