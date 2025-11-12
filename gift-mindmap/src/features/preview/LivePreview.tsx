import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Maximize2, AlertCircle, Zap, ZapOff } from "lucide-react";
import { transform } from "@babel/standalone";
import { useAgentStore } from "@/store/agentStore";

interface LivePreviewProps {
  html: string;
  css: string;
  javascript: string;
}

export function LivePreview({ html, css, javascript }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<Array<{ type: string; message: string }>>([]);
  
  // Agent workflow integration
  const { previewUrl, hmrConnected, setHmrConnected } = useAgentStore();
  const [useAgentPreview, setUseAgentPreview] = useState(false);

  const generatePreview = () => {
    // If agent preview is active and we have a URL, skip local generation
    if (useAgentPreview && previewUrl) {
      return;
    }
    
    try {
      setError(null);

      // Transform JSX/ES6+ JavaScript using Babel
      let transformedJs = javascript;
      if (javascript.includes("React") || javascript.includes("jsx") || javascript.includes("=>")) {
        try {
          const result = transform(javascript, {
            presets: ["react", "env"],
            filename: "preview.jsx",
          });
          transformedJs = result.code || javascript;
        } catch (babelError: any) {
          setError(`Babel Transform Error: ${babelError.message}`);
          return;
        }
      }

      // Create the complete HTML document
      const srcDoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0;
                padding: 16px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              * {
                box-sizing: border-box;
              }
              ${css}
            </style>
          </head>
          <body>
            ${html}
            <script>
              // Capture console logs
              (function() {
                const originalLog = console.log;
                const originalError = console.error;
                const originalWarn = console.warn;

                window.addEventListener('error', function(e) {
                  window.parent.postMessage({ type: 'error', message: e.message, line: e.lineno }, '*');
                });

                console.log = function(...args) {
                  window.parent.postMessage({ type: 'log', message: args.join(' ') }, '*');
                  originalLog.apply(console, args);
                };

                console.error = function(...args) {
                  window.parent.postMessage({ type: 'error', message: args.join(' ') }, '*');
                  originalError.apply(console, args);
                };

                console.warn = function(...args) {
                  window.parent.postMessage({ type: 'warn', message: args.join(' ') }, '*');
                  originalWarn.apply(console, args);
                };
              })();

              try {
                ${transformedJs}
              } catch(err) {
                console.error('Runtime Error: ' + err.message);
              }
            </script>
          </body>
        </html>
      `;

      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(srcDoc);
          doc.close();
        }
      }
    } catch (err: any) {
      setError(`Preview Error: ${err.message}`);
    }
  };

  useEffect(() => {
    // If agent preview URL is available, use it
    if (previewUrl && useAgentPreview) {
      // Simulate HMR connection check
      const checkHmr = setInterval(() => {
        // In real implementation, this would ping the Vite HMR endpoint
        setHmrConnected(true);
      }, 2000);
      
      return () => clearInterval(checkHmr);
    }
    
    // Debounce preview updates
    const timer = setTimeout(() => {
      generatePreview();
    }, 300);

    return () => clearTimeout(timer);
  }, [html, css, javascript, previewUrl, useAgentPreview]);

  useEffect(() => {
    // Listen for console messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        setConsoleOutput((prev) => [...prev, { type: event.data.type, message: event.data.message }]);

        if (event.data.type === "error") {
          setError(event.data.message);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleRefresh = () => {
    setConsoleOutput([]);
    setError(null);
    generatePreview();
  };

  const handleOpenInNewWindow = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>${javascript}</script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <Card className="h-full overflow-hidden flex flex-col border-0 rounded-none">
      {/* Preview Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Live Preview</div>
          {previewUrl && (
            <>
              <Button
                size="sm"
                variant={useAgentPreview ? "default" : "outline"}
                onClick={() => setUseAgentPreview(!useAgentPreview)}
                className="h-6 text-xs"
              >
                {useAgentPreview ? "Agent Preview" : "Local Preview"}
              </Button>
              {useAgentPreview && (
                <Badge variant={hmrConnected ? "default" : "secondary"} className="text-xs gap-1">
                  {hmrConnected ? (
                    <>
                      <Zap className="w-3 h-3" />
                      HMR Active
                    </>
                  ) : (
                    <>
                      <ZapOff className="w-3 h-3" />
                      HMR Disconnected
                    </>
                  )}
                </Badge>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleOpenInNewWindow}>
            <Maximize2 className="w-4 h-4 mr-1" /> Open
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Preview iframe */}
      <div className="flex-1 bg-white overflow-auto">
        {useAgentPreview && previewUrl ? (
          <iframe
            key={previewUrl}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Agent Live Preview"
          />
        ) : (
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-0"
            title="Live Preview"
          />
        )}
      </div>

      {/* Console Output (collapsible) */}
      {consoleOutput.length > 0 && (
        <div className="border-t bg-slate-900 text-white text-xs font-mono max-h-32 overflow-auto">
          {consoleOutput.map((log, idx) => (
            <div key={idx} className={`px-3 py-1 ${log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-yellow-400" : "text-green-400"}`}>
              &gt; {log.message}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
