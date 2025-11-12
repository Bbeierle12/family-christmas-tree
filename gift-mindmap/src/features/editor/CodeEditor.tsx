import React from "react";
import Editor from "@monaco-editor/react";
import { Card } from "@/components/ui/card";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "html" | "css" | "javascript" | "typescript";
  height?: string;
}

export function CodeEditor({ value, onChange, language, height = "100%" }: CodeEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <Card className="h-full overflow-hidden border-0 rounded-none">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        theme="vs-light"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </Card>
  );
}
