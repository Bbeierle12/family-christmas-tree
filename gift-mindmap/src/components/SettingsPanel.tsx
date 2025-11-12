/**
 * Settings Component
 * Configuration panel for the application
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Key, 
  Palette, 
  Zap, 
  Database,
  Save,
  RefreshCcw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export function SettingsPanel() {
  const [apiKey, setApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [anthropicKeySaved, setAnthropicKeySaved] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("api");
  
  // Model configuration
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [localModelUrl, setLocalModelUrl] = useState("http://localhost:11434/api/chat");
  const [localModelName, setLocalModelName] = useState("llama3.2");
  const [modelConfigSaved, setModelConfigSaved] = useState(false);

  const handleSaveApiKey = () => {
    if (apiKey.startsWith("sk-")) {
      localStorage.setItem("openai_api_key", apiKey);
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 3000);
    }
  };

  const handleSaveAnthropicKey = () => {
    if (anthropicApiKey.startsWith("sk-ant-")) {
      localStorage.setItem("anthropic_api_key", anthropicApiKey);
      setAnthropicKeySaved(true);
      setTimeout(() => setAnthropicKeySaved(false), 3000);
    }
  };

  const handleClearApiKey = () => {
    setApiKey("");
    localStorage.removeItem("openai_api_key");
  };

  const handleClearAnthropicKey = () => {
    setAnthropicApiKey("");
    localStorage.removeItem("anthropic_api_key");
  };

  const handleSaveModelConfig = () => {
    localStorage.setItem("ai_provider", selectedProvider);
    localStorage.setItem("ai_model", selectedModel);
    localStorage.setItem("local_model_url", localModelUrl);
    localStorage.setItem("local_model_name", localModelName);
    setModelConfigSaved(true);
    setTimeout(() => setModelConfigSaved(false), 3000);
  };

  const loadSavedApiKey = () => {
    const saved = localStorage.getItem("openai_api_key");
    if (saved) {
      setApiKey(saved);
    }
    const savedAnthropic = localStorage.getItem("anthropic_api_key");
    if (savedAnthropic) {
      setAnthropicApiKey(savedAnthropic);
    }
    const savedProvider = localStorage.getItem("ai_provider");
    if (savedProvider) {
      setSelectedProvider(savedProvider);
    }
    const savedModel = localStorage.getItem("ai_model");
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    const savedLocalUrl = localStorage.getItem("local_model_url");
    if (savedLocalUrl) {
      setLocalModelUrl(savedLocalUrl);
    }
    const savedLocalName = localStorage.getItem("local_model_name");
    if (savedLocalName) {
      setLocalModelName(savedLocalName);
    }
  };

  React.useEffect(() => {
    loadSavedApiKey();
  }, []);

  // Update model when provider changes
  React.useEffect(() => {
    if (selectedProvider === "openai" && !selectedModel.startsWith("gpt-")) {
      setSelectedModel("gpt-4o");
    } else if (selectedProvider === "anthropic" && !selectedModel.startsWith("claude-")) {
      setSelectedModel("claude-3-5-sonnet-20241022");
    } else if (selectedProvider === "local" && (selectedModel.startsWith("gpt-") || selectedModel.startsWith("claude-"))) {
      setSelectedModel(localModelName || "llama3.2");
    }
  }, [selectedProvider]);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your workspace preferences
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="api" className="gap-2">
                <Key className="w-4 h-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="agent" className="gap-2">
                <Zap className="w-4 h-4" />
                Agent
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2">
                <Database className="w-4 h-4" />
                Data
              </TabsTrigger>
            </TabsList>

            {/* API Keys Tab */}
            <TabsContent value="api" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    AI Model Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure which AI model provider to use. Your API keys are stored locally and never sent to our servers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Provider Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Provider</label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <option value="openai">OpenAI (ChatGPT)</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="local">Local Model (Ollama/LM Studio)</option>
                    </select>
                  </div>

                  {/* OpenAI Configuration */}
                  {selectedProvider === "openai" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">OpenAI Model</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        >
                          <option value="gpt-4o">GPT-4o (Recommended)</option>
                          <option value="gpt-4o-mini">GPT-4o Mini</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">API Key</label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder="sk-..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="font-mono"
                          />
                          <Button onClick={handleSaveApiKey} disabled={!apiKey.startsWith("sk-")}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        </div>
                        {apiKeySaved && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            API key saved successfully!
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <strong>Don't have an API key?</strong> Get one from{" "}
                          <a 
                            href="https://platform.openai.com/api-keys" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline font-medium"
                          >
                            OpenAI Platform
                          </a>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={handleClearApiKey}
                          className="text-red-600 hover:text-red-700"
                        >
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Clear API Key
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Anthropic Configuration */}
                  {selectedProvider === "anthropic" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Anthropic Model</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        >
                          <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Recommended)</option>
                          <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                          <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">API Key</label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder="sk-ant-..."
                            value={anthropicApiKey}
                            onChange={(e) => setAnthropicApiKey(e.target.value)}
                            className="font-mono"
                          />
                          <Button onClick={handleSaveAnthropicKey} disabled={!anthropicApiKey.startsWith("sk-ant-")}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        </div>
                        {anthropicKeySaved && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            API key saved successfully!
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <strong>Don't have an API key?</strong> Get one from{" "}
                          <a 
                            href="https://console.anthropic.com/settings/keys" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline font-medium"
                          >
                            Anthropic Console
                          </a>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={handleClearAnthropicKey}
                          className="text-red-600 hover:text-red-700"
                        >
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Clear API Key
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Local Model Configuration */}
                  {selectedProvider === "local" && (
                    <>
                      <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded">
                        <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                        <div className="text-sm text-purple-700">
                          <strong>Local model support</strong> requires a running inference server with OpenAI-compatible API (e.g., Ollama, LM Studio).
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Model Name</label>
                        <Input
                          type="text"
                          placeholder="llama3.2, codestral, deepseek-coder, etc."
                          value={localModelName}
                          onChange={(e) => setLocalModelName(e.target.value)}
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter the exact model name as configured in your inference server
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">API Endpoint URL</label>
                        <Input
                          type="text"
                          placeholder="http://localhost:11434/api/chat"
                          value={localModelUrl}
                          onChange={(e) => setLocalModelUrl(e.target.value)}
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Default for Ollama: http://localhost:11434/api/chat
                        </p>
                      </div>

                      <div className="pt-4">
                        <Button 
                          onClick={handleSaveModelConfig}
                          className="w-full"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {modelConfigSaved ? "✓ Configuration Saved" : "Save Configuration"}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Save button for cloud providers */}
                  {(selectedProvider === "openai" || selectedProvider === "anthropic") && (
                    <div className="pt-2">
                      <Button 
                        onClick={handleSaveModelConfig}
                        variant="outline"
                        className="w-full"
                      >
                        {modelConfigSaved ? "✓ Provider Configuration Saved" : "Save Provider Configuration"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agent Settings Tab */}
            <TabsContent value="agent" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Agent Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure the AI agent behavior and workflow settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Scope Level</label>
                    <div className="flex gap-2">
                      <Badge variant="outline">DATA_ONLY</Badge>
                      <Badge variant="default">UI_SAFE</Badge>
                      <Badge variant="outline">LOGIC_STRICT (Blocked)</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      UI_SAFE is recommended for most changes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Retries</label>
                    <Input type="number" value="3" disabled className="w-24" />
                    <p className="text-xs text-muted-foreground">
                      Number of times the agent will retry failed operations
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                      <Badge variant="default">{selectedModel}</Badge>
                      <span className="text-xs text-muted-foreground">
                        ({selectedProvider === "openai" ? "OpenAI" : selectedProvider === "anthropic" ? "Anthropic" : "Local"})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Change model provider and selection in the API Keys tab
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Light</Button>
                      <Button variant="outline" size="sm" disabled>Dark (Coming Soon)</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Font Size</label>
                    <Input type="number" value="14" min="10" max="20" className="w-24" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Editor Theme</label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">VS Code Dark</Button>
                      <Button variant="outline" size="sm">GitHub Light</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Manage your local data and storage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Storage Status</label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Local Storage</Badge>
                      <span className="text-sm text-muted-foreground">
                        {(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB used
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm("Are you sure? This will clear all local data except API keys.")) {
                          const apiKey = localStorage.getItem("openai_api_key");
                          localStorage.clear();
                          if (apiKey) localStorage.setItem("openai_api_key", apiKey);
                          alert("Data cleared successfully!");
                        }
                      }}
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Clear All Data (Keep API Key)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
