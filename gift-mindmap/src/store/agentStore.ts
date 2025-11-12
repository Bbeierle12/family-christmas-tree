/**
 * Agent Workflow Store
 * Manages agentic workflow state, messages, and approval flow
 */

import { create } from "zustand";
import type { WorkflowState, AgentMessage, ApprovalRequest } from "../features/agent/types";
import { AgentExecutor } from "../features/agent/executor";
import { VIBE_CODER_WORKFLOW } from "../features/agent/workflow";

interface AgentStore {
  // Workflow state
  workflowState: WorkflowState | null;
  executor: AgentExecutor | null;
  
  // Messages
  messages: AgentMessage[];
  
  // UI state
  isProcessing: boolean;
  error: string | null;
  
  // Preview state
  previewUrl: string | null;
  hmrConnected: boolean;
  
  // Actions
  startWorkflow: (userMessage: string, apiKey?: string) => Promise<void>;
  approveChange: (approver: string) => void;
  rejectChange: (approver: string, reason?: string) => void;
  clearMessages: () => void;
  setPreviewUrl: (url: string | null) => void;
  setHmrConnected: (connected: boolean) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  workflowState: null,
  executor: null,
  messages: [
    {
      id: `msg_${Date.now()}`,
      role: "system",
      text: "🎄 Vibe Coding Mode Active! I can modify the app live. Try: 'make the person cards have blue borders' or 'add a snow animation'",
      timestamp: Date.now(),
    },
  ],
  isProcessing: false,
  error: null,
  previewUrl: null,
  hmrConnected: false,

  startWorkflow: async (userMessage: string, apiKey?: string) => {
    set({ isProcessing: true, error: null });
    
    try {
      const executor = new AgentExecutor(VIBE_CODER_WORKFLOW, {
        apiKey,
        onProgress: (state: WorkflowState) => {
          set({ workflowState: state });
        },
        onMessage: (message: AgentMessage) => {
          set((s) => ({ messages: [...s.messages, message] }));
        },
      });
      
      set({ executor });
      
      const finalState = await executor.execute(userMessage);
      
      set({ 
        workflowState: finalState,
        isProcessing: false 
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : String(error),
        isProcessing: false,
      });
    }
  },

  approveChange: (approver: string) => {
    const { executor } = get();
    if (executor) {
      executor.approve(approver);
      set({ workflowState: executor.getState() });
    }
  },

  rejectChange: (approver: string, reason?: string) => {
    const { executor } = get();
    if (executor) {
      executor.reject(approver, reason);
      set({ workflowState: executor.getState() });
    }
  },

  clearMessages: () => {
    set({
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: "system",
          text: "🎄 Vibe Coding Mode Active! I can modify the app live.",
          timestamp: Date.now(),
        },
      ],
      workflowState: null,
      executor: null,
      error: null,
    });
  },

  setPreviewUrl: (url: string | null) => {
    set({ previewUrl: url });
  },

  setHmrConnected: (connected: boolean) => {
    set({ hmrConnected: connected });
  },
}));
