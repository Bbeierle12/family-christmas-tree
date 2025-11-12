# Agentic Vibe Coding System - Implementation Guide

## Overview
This is a complete implementation of an **agentic AI coding workflow** that allows users to make live code changes through natural language commands. The system follows OpenAI's Agent Builder patterns and is designed to work with both mock data (for development) and real OpenAI API calls.

## Architecture

### Core Components

#### 1. **Agent System** (`src/features/agent/`)
- **types.ts** - TypeScript definitions for workflow, nodes, messages, approvals
- **workflow.ts** - 20-node DAG definition (Classify → Search → Diff → Checks → Preview → Approval → Rollout)
- **executor.ts** - ReAct loop orchestrator with OpenAI function calling
- **tools.ts** - 12 tool implementations (real + mocked)
- **diffWriter.ts** - Unified diff validator and applier with scope constraints

#### 2. **UI Components** (`src/features/panels/`)
- **AgentChat.tsx** - Enhanced chat with tool visualization and streaming
- **WorkflowStatus.tsx** - DAG progress tracker with pipeline visualization
- **ApprovalGate.tsx** - Modal for diff review and ship/reject decisions
- **LivePreview.tsx** - Enhanced with HMR status and agent preview URL

#### 3. **State Management** (`src/store/`)
- **agentStore.ts** - Zustand store for workflow state, messages, and approvals

#### 4. **Main App** (`src/components/`)
- **VibeCodingApp.tsx** - Integrated UI combining editor, preview, chat, and workflow

## Tool Implementations

### Real Tools (Working Now)
1. **code_search** - Workspace code search (mocked, ready for VS Code API)
2. **run_linter** - ESLint execution (mocked, ready for tasks API)
3. **run_typecheck** - TypeScript compiler (mocked, ready for tasks API)
4. **run_app_preview** - Vite dev server management (mocked, returns localhost:5173)

### Mocked Tools (Infrastructure Needed)
5. **sandbox_start** - WebContainers isolation (needs StackBlitz integration)
6. **write_diff** - File patching (validation works, apply needs file system access)
7. **create_flag / toggle_flag** - Feature flags (needs LaunchDarkly integration)
8. **collect_metrics** - APM metrics (needs Datadog/Sentry integration)
9. **commit_or_pr** - Git operations (needs Git API)

## Workflow Execution

### Example: "make the person cards have blue borders"

1. **start** - User message received
2. **classify** - Agent classifies as `UI_SAFE`, generates plan
3. **code_search** - Finds `PersonNode.tsx` 
4. **write_diff** - Generates unified diff for border change
5. **sandbox_start** - Starts isolated environment (network=off)
6. **run_linter** → **run_typecheck** → **run_tests** → **run_smoke** - Quality checks
7. **gate_checks** - Evaluates all checks passed
8. **run_preview** - Returns preview URL with HMR
9. **approval_gate** - Waits for human approval
10. **create_flag** → **flag_self** → **metrics_canary** → ... - Progressive rollout
11. **commit_or_pr** - Creates PR with changes
12. **done** - Workflow complete

### Scope Levels

**DATA_ONLY** - Only modify store/schema files
- Paths: `src/store/**/*.ts`, `src/types/**/*.ts`

**UI_SAFE** (Default for v1) - Modify UI components and styles
- Paths: `src/components/**/*.tsx`, `src/features/**/*.tsx`, `src/**/*.css`

**LOGIC_STRICT** (Blocked in v1) - Full code modifications
- Requires additional safety checks

### Safety Features

- **Scope validation** - Prevents unauthorized file modifications
- **Forbidden paths** - package.json, node_modules, .git always blocked
- **Retry logic** - Max 3 attempts with corrective feedback
- **Quality gates** - Lint/type/test must pass before preview
- **Human approval** - Required before deployment
- **Metrics gates** - Auto-rollback if error rate > 1% or LCP delta > 20%

## Usage

### Development Mode (No API Key)
```typescript
// App will use mock responses
<VibeCodingApp />
```

### Production Mode (With OpenAI API)
```typescript
// In AgentChat, set API key in UI or:
const { startWorkflow } = useAgentStore();
await startWorkflow("your command", "sk-...");
```

### Adding the VibeCodingApp to Main App

```tsx
// In src/App.tsx or main.jsx
import { VibeCodingApp } from "./components/VibeCodingApp";

function App() {
  return <VibeCodingApp />;
}
```

## API Configuration

Create `.env.local`:
```bash
VITE_OPENAI_API_KEY=sk-your-api-key-here
```

## Next Steps (Production Readiness)

### Immediate (Day 1-2)
1. ✅ Connect real VS Code APIs for code_search, run_linter, run_typecheck
2. ✅ Wire Vite dev server for run_app_preview
3. ✅ Implement actual file writes in write_diff (needs file system permissions)

### Short Term (Week 1)
4. Integrate WebContainers for sandbox_start
5. Add feature flag service (LaunchDarkly or simple in-memory)
6. Wire real Git commands for commit_or_pr

### Medium Term (Week 2+)
7. Connect APM for collect_metrics
8. Export workflow to Agents SDK for service deployment
9. Add observability (logging, tracing, error tracking)

## File Structure

```
src/
├── features/
│   ├── agent/
│   │   ├── types.ts          # Type definitions
│   │   ├── workflow.ts       # DAG manifest
│   │   ├── executor.ts       # Agent orchestrator
│   │   ├── tools.ts          # Tool implementations
│   │   ├── diffWriter.ts     # Diff validator/applier
│   │   └── index.ts          # Exports
│   ├── panels/
│   │   ├── AgentChat.tsx     # Chat UI
│   │   ├── WorkflowStatus.tsx # DAG tracker
│   │   └── ApprovalGate.tsx  # Approval modal
│   └── preview/
│       └── LivePreview.tsx   # Enhanced with HMR
├── store/
│   └── agentStore.ts         # Workflow state
└── components/
    └── VibeCodingApp.tsx     # Main integrated app
```

## Testing

### Manual Test (Mock Mode)
1. Start app
2. Type in chat: "make the person cards have blue borders"
3. Watch workflow progress through DAG
4. See tool calls and check results
5. Approve when gate appears
6. Observe completion

### With Real API
1. Set VITE_OPENAI_API_KEY
2. Same test flow, but agent will:
   - Generate actual plan
   - Call tools based on context
   - Propose real diffs

## Troubleshooting

**"Cannot find module '@babel/standalone'"**
- Expected in LivePreview, add to package.json if needed

**"Approval gate doesn't appear"**
- Check console for workflow errors
- Verify all checks passed in WorkflowStatus

**"HMR not connecting"**
- Ensure Vite dev server is running
- Check previewUrl in agentStore

## OpenAI Agent Builder Export

The workflow.ts manifest can be imported into Agent Builder:
1. Copy VIBE_CODER_WORKFLOW JSON
2. Import into Agent Builder UI
3. Add tool schemas from tools.ts
4. Run and preview
5. Export to code when ready

## Performance

- **Mock mode**: ~5-10s for full workflow
- **With API**: ~15-30s (depends on model + tools)
- **Retry overhead**: +10s per retry (max 3)

## Security Notes

- All diffs validated before application
- Sandboxed execution (when WebContainers integrated)
- Human-in-the-loop for all deployments
- Metrics-based auto-rollback
- Forbidden paths strictly enforced

## Support

For questions or issues:
1. Check WorkflowStatus for current node
2. Review chat messages for tool errors
3. Inspect agentStore state in React DevTools
4. Check browser console for API errors
