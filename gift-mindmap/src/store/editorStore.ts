import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "html" | "css" | "javascript";

interface EditorState {
  html: string;
  css: string;
  javascript: string;
  selectedLanguage: Language;
  splitRatio: number; // 0-100, percentage for editor width

  // Actions
  setHtml: (html: string) => void;
  setCss: (css: string) => void;
  setJavascript: (javascript: string) => void;
  setSelectedLanguage: (language: Language) => void;
  setSplitRatio: (ratio: number) => void;
  resetCode: () => void;
}

const defaultHTML = `<div class="container">
  <h1>Welcome to Live Code Editor!</h1>
  <p>Start editing HTML, CSS, and JavaScript to see live changes.</p>
  <button id="btn">Click me!</button>
  <div id="output"></div>
</div>`;

const defaultCSS = `.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #3b82f6;
  text-align: center;
}

button {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin: 20px 0;
  display: block;
}

button:hover {
  background: #059669;
}

#output {
  margin-top: 20px;
  padding: 15px;
  background: #f3f4f6;
  border-radius: 5px;
  min-height: 50px;
}`;

const defaultJS = `// JavaScript example
const btn = document.getElementById('btn');
const output = document.getElementById('output');

let clickCount = 0;

btn.addEventListener('click', () => {
  clickCount++;
  output.innerHTML = \`<strong>Button clicked \${clickCount} time(s)!</strong>\`;
  console.log('Button clicked:', clickCount);
});

console.log('JavaScript loaded successfully!');`;

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      html: defaultHTML,
      css: defaultCSS,
      javascript: defaultJS,
      selectedLanguage: "html",
      splitRatio: 50,

      setHtml: (html) => set({ html }),
      setCss: (css) => set({ css }),
      setJavascript: (javascript) => set({ javascript }),
      setSelectedLanguage: (language) => set({ selectedLanguage: language }),
      setSplitRatio: (ratio) => set({ splitRatio: ratio }),

      resetCode: () =>
        set({
          html: defaultHTML,
          css: defaultCSS,
          javascript: defaultJS,
        }),
    }),
    {
      name: "live-code-editor-storage",
    }
  )
);
