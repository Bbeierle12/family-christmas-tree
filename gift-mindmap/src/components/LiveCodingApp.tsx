import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Upload, RefreshCcw, Code2, FileCode, Maximize2, Minimize2 } from "lucide-react";
import { CodeEditor } from "@/features/editor/CodeEditor";
import { LivePreview } from "@/features/preview/LivePreview";
import { ChatPanel } from "@/features/panels/ChatPanel";
import { useEditorStore, Language } from "@/store/editorStore";

export default function LiveCodingApp() {
  const {
    html,
    css,
    javascript,
    selectedLanguage,
    setHtml,
    setCss,
    setJavascript,
    setSelectedLanguage,
    resetCode,
  } = useEditorStore();

  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);

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

  const exportCode = () => {
    const data = {
      html,
      css,
      javascript,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `live-code-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCode = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.html) setHtml(data.html);
        if (data.css) setCss(data.css);
        if (data.javascript) setJavascript(data.javascript);
      } catch (e) {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  const exportAsHTML = () => {
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Code</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${javascript}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exported-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".json")) {
      importCode(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleCodeGenerated = (code: string, type: "html" | "css" | "javascript") => {
    if (type === "html") {
      setHtml(html + "\n" + code);
    } else if (type === "css") {
      setCss(css + "\n\n" + code);
    } else if (type === "javascript") {
      setJavascript(javascript + "\n\n" + code);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-emerald-50 to-sky-50" onDrop={onDrop} onDragOver={onDragOver}>
        {/* Top Bar */}
        <div className="px-4 py-2 border-b bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="hidden md:block text-sm text-muted-foreground">
              Write HTML, CSS & JavaScript with instant preview
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={resetCode}>
                    <RefreshCcw className="w-4 h-4 mr-1" /> Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to default template</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={exportCode}>
                    <Download className="w-4 h-4 mr-1" /> Export JSON
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export code as JSON</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={exportAsHTML}>
                    <FileCode className="w-4 h-4 mr-1" /> Export HTML
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export as complete HTML file</TooltipContent>
              </Tooltip>

              <label className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 cursor-pointer text-sm hover:bg-secondary">
                <Upload className="w-4 h-4 mr-1" /> Import
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => e.target.files && importCode(e.target.files[0])}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
          {/* Code Editor Panel */}
          {!isEditorCollapsed && (
            <div className="flex-1 flex flex-col min-w-0">
              <Card className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                  <Tabs value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as Language)}>
                    <TabsList>
                      <TabsTrigger value="html">HTML</TabsTrigger>
                      <TabsTrigger value="css">CSS</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Button size="sm" variant="ghost" onClick={() => setIsEditorCollapsed(true)}>
                    <Minimize2 className="w-4 h-4 mr-1" /> Collapse
                  </Button>
                </div>

                <div className="flex-1 min-h-0">
                  <CodeEditor
                    value={getCurrentCode()}
                    onChange={handleCodeChange}
                    language={selectedLanguage}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Editor Collapsed State */}
          {isEditorCollapsed && (
            <Card className="w-12 flex items-center justify-center cursor-pointer hover:bg-muted/50" onClick={() => setIsEditorCollapsed(false)}>
              <Maximize2 className="w-5 h-5 text-muted-foreground" />
            </Card>
          )}

          {/* Live Preview Panel */}
          {!isPreviewCollapsed && (
            <div className="flex-1 flex flex-col min-w-0">
              <LivePreview html={html} css={css} javascript={javascript} />
            </div>
          )}

          {/* Preview Collapsed State */}
          {isPreviewCollapsed && (
            <Card className="w-12 flex items-center justify-center cursor-pointer hover:bg-muted/50" onClick={() => setIsPreviewCollapsed(false)}>
              <Maximize2 className="w-5 h-5 text-muted-foreground" />
            </Card>
          )}
        </div>

        {/* Bottom AI Chat */}
        <div className="px-4 pb-4">
          <ChatPanel onCodeGenerated={handleCodeGenerated} />
        </div>
      </div>
    </TooltipProvider>
  );
}
