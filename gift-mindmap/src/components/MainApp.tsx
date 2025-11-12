import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Network, Settings } from "lucide-react";
import LiveCodingApp from "./LiveCodingApp";
import GiftMindMap from "./GiftMindMap-standalone";
import { SettingsPanel } from "./SettingsPanel";

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<"code" | "canvas" | "settings">("code");

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <div className="px-4 py-3 border-b bg-white/90 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Creative Workspace</h1>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "code" | "canvas" | "settings")}>
            <TabsList className="bg-muted">
              <TabsTrigger value="code" className="gap-2">
                <Code2 className="w-4 h-4" />
                Live Code Editor
              </TabsTrigger>
              <TabsTrigger value="canvas" className="gap-2">
                <Network className="w-4 h-4" />
                Gift Mind Map
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "code" && <LiveCodingApp />}
        {activeTab === "canvas" && <GiftMindMap />}
        {activeTab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}
