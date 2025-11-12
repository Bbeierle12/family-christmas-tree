import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Network, Sparkles } from "lucide-react";
import LiveCodingApp from "./LiveCodingApp";
import { VibeCodingApp } from "./VibeCodingApp";
import GiftMindMap from "./GiftMindMap-standalone";

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<"code" | "vibe" | "canvas">("vibe");

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <div className="px-4 py-3 border-b bg-white/90 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Creative Workspace</h1>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "code" | "vibe" | "canvas")}>
            <TabsList className="bg-muted">
              <TabsTrigger value="vibe" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Vibe Coder (AI)
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-2">
                <Code2 className="w-4 h-4" />
                Live Code Editor
              </TabsTrigger>
              <TabsTrigger value="canvas" className="gap-2">
                <Network className="w-4 h-4" />
                Gift Mind Map
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "vibe" && <VibeCodingApp />}
        {activeTab === "code" && <LiveCodingApp />}
        {activeTab === "canvas" && <GiftMindMap />}
      </div>
    </div>
  );
}
