/**
 * Vibe Coding App
 * Integration of live coding with agentic workflow
 */

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor } from "@/features/editor/CodeEditor";
import { LivePreview } from "@/features/preview/LivePreview";
import { AgentChat } from "@/features/panels/AgentChat";
import { WorkflowStatus } from "@/features/panels/WorkflowStatus";
import { ApprovalGate } from "@/features/panels/ApprovalGate";
import { useEditorStore, Language } from "@/store/editorStore";
import { Maximize2, Minimize2, Sparkles } from "lucide-react";

export function VibeCodingApp() {
  const {
    html,
    css,
    javascript,
    selectedLanguage,
    setHtml,
    setCss,
    setJavascript,
    setSelectedLanguage,
  } = useEditorStore();

  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [showWorkflowStatus, setShowWorkflowStatus] = useState(true);

  const handleCodeChange = (value: string) => {
    if (selectedLanguage === "html") setHtml(value);
    else if (selectedLanguage === "css") setCss(value);
    else if (selectedLanguage === "javascript") setJavascript(value);
  };

  const getCurrentCode = () => {
    if (selectedLanguage === "html") return html;
    if (selectedLanguage === "css") return css;
    return javascript;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-semibold">Vibe Coding Studio</h1>
          <span className="text-xs text-muted-foreground">with AI Agent</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowWorkflowStatus(!showWorkflowStatus)}
          >
            {showWorkflowStatus ? "Hide" : "Show"} Workflow
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Editor + AI Chat */}
        <div className={`flex flex-col border-r bg-white transition-all ${isEditorCollapsed ? "w-12" : "w-1/2"}`}>
          {isEditorCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 mx-auto"
              onClick={() => setIsEditorCollapsed(false)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          ) : (
            <>
              {/* Editor Toolbar */}
              <div className="border-b p-2 flex items-center justify-between">
                <Tabs value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as Language)}>
                  <TabsList>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="css">CSS</TabsTrigger>
                    <TabsTrigger value="javascript">JS</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditorCollapsed(true)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Code Editor */}
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  language={selectedLanguage}
                  value={getCurrentCode()}
                  onChange={handleCodeChange}
                />
              </div>

              {/* AI Chat Panel */}
              <div className="border-t p-3">
                <AgentChat />
              </div>
            </>
          )}
        </div>

        {/* Right Side: Preview + Workflow Status */}
        <div className={`flex flex-col transition-all ${isPreviewCollapsed ? "w-12" : "flex-1"}`}>
          {isPreviewCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 mx-auto"
              onClick={() => setIsPreviewCollapsed(false)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          ) : (
            <>
              {/* Preview Toolbar */}
              <div className="border-b p-2 flex items-center justify-between bg-white">
                <div className="text-sm font-medium">Live Preview</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewCollapsed(true)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Live Preview */}
              <div className="flex-1 overflow-hidden">
                <LivePreview html={html} css={css} javascript={javascript} />
              </div>

              {/* Workflow Status (optional) */}
              {showWorkflowStatus && (
                <div className="border-t p-3 bg-white max-h-64 overflow-y-auto">
                  <WorkflowStatus />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Approval Gate Modal */}
      <ApprovalGate />
    </div>
  );
}
