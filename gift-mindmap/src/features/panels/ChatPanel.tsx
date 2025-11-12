import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface ChatPanelProps {
  onCodeGenerated?: (code: string, type: "html" | "css" | "javascript") => void;
}

const uid = (() => {
  let i = 0;
  return (prefix = "id") => `${prefix}_${++i}_${Math.random().toString(36).slice(2, 7)}`;
})();

export function ChatPanel({ onCodeGenerated }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid("m"),
      role: "assistant",
      text: "Hi! I can help you generate code snippets. Try commands like: 'create a button', 'add navbar css', 'make a counter script'",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatHelpCollapsed, setChatHelpCollapsed] = useState(false);

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg: Message = { id: uid("m"), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setChatInput("");

    // Simple command parser for code generation
    const lowerText = text.toLowerCase();

    // HTML generation commands
    if (lowerText.includes("create") || lowerText.includes("add") || lowerText.includes("make")) {
      if (lowerText.includes("button")) {
        const code = `<button class="btn">Click Me</button>`;
        onCodeGenerated?.(code, "html");
        setMessages((m) => [
          ...m,
          {
            id: uid("m"),
            role: "assistant",
            text: `Added a button to HTML! You can customize it in the editor.`,
          },
        ]);
        return;
      }

      if (lowerText.includes("navbar") || lowerText.includes("nav")) {
        const code = `<nav class="navbar">
  <div class="nav-brand">MyApp</div>
  <ul class="nav-links">
    <li><a href="#home">Home</a></li>
    <li><a href="#about">About</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
</nav>`;
        onCodeGenerated?.(code, "html");
        setMessages((m) => [
          ...m,
          {
            id: uid("m"),
            role: "assistant",
            text: `Added a navigation bar to HTML!`,
          },
        ]);
        return;
      }

      if (lowerText.includes("card")) {
        const code = `<div class="card">
  <h3>Card Title</h3>
  <p>This is a card component with some content.</p>
  <button>Learn More</button>
</div>`;
        onCodeGenerated?.(code, "html");
        setMessages((m) => [
          ...m,
          {
            id: uid("m"),
            role: "assistant",
            text: `Added a card component to HTML!`,
          },
        ]);
        return;
      }

      if (lowerText.includes("form")) {
        const code = `<form class="form">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required>

  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required>

  <button type="submit">Submit</button>
</form>`;
        onCodeGenerated?.(code, "html");
        setMessages((m) => [
          ...m,
          {
            id: uid("m"),
            role: "assistant",
            text: `Added a form to HTML!`,
          },
        ]);
        return;
      }

      if (lowerText.includes("counter")) {
        const code = `let count = 0;
const btn = document.querySelector('.counter-btn');
const display = document.querySelector('.counter-display');

btn.addEventListener('click', () => {
  count++;
  display.textContent = count;
  console.log('Count:', count);
});`;
        onCodeGenerated?.(code, "javascript");
        setMessages((m) => [
          ...m,
          {
            id: uid("m"),
            role: "assistant",
            text: `Added a counter script to JavaScript! Make sure you have elements with classes 'counter-btn' and 'counter-display' in your HTML.`,
          },
        ]);
        return;
      }

      if (lowerText.includes("animation") || lowerText.includes("animate")) {
        const code = `.fade-in {
  animation: fadeIn 1s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.bounce {
  animation: bounce 0.5s infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}`;
        onCodeGenerated?.(code, "css");
        setMessages((m) => [
          ...m,
          {
            id: uid("m"),
            role: "assistant",
            text: `Added CSS animations! Use 'fade-in' or 'bounce' classes on your elements.`,
          },
        ]);
        return;
      }

      if (lowerText.includes("grid") || lowerText.includes("layout")) {
        const code = `.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.grid-item {
  background: #f3f4f6;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`;
        onCodeGenerated?.(code, "css");
        setMessages((m) => [
          ...m,
          {
            id: uid("m"),
            role: "assistant",
            text: `Added a responsive CSS grid layout!`,
          },
        ]);
        return;
      }
    }

    // Default response
    setMessages((m) => [
      ...m,
      {
        id: uid("m"),
        role: "assistant",
        text: "(Demo) Try commands like: 'create a button', 'add navbar', 'make a card', 'add form', 'create counter', 'add animation', or 'add grid layout'.",
      },
    ]);
  };

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
        <MessageSquare className="w-4 h-4" /> AI chat (demo)
        <Button
          size="sm"
          variant="link"
          className="ml-1 p-0"
          onClick={() => setChatHelpCollapsed((s) => !s)}
        >
          {chatHelpCollapsed ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
          {chatHelpCollapsed ? "Show help" : "Hide help"}
        </Button>
      </div>

      {!chatHelpCollapsed && (
        <div className="text-xs text-muted-foreground mb-2">
          Try: <code className="bg-muted px-1 py-0.5 rounded">create a button</code>,{" "}
          <code className="bg-muted px-1 py-0.5 rounded">add navbar</code>,{" "}
          <code className="bg-muted px-1 py-0.5 rounded">make a counter</code>
        </div>
      )}

      <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-white/70 mb-2 min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-sm mb-2 ${m.role === "user" ? "text-right" : "text-left"}`}
          >
            <span
              className={`inline-block px-3 py-2 rounded-2xl ${
                m.role === "user" ? "bg-emerald-100" : "bg-slate-100"
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type a message… (e.g., create a button)"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <Button onClick={sendMessage}>
          <Send className="w-4 h-4 mr-1" /> Send
        </Button>
      </div>
    </div>
  );
}
