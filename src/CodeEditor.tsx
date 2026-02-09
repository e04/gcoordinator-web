import { useState } from "react";
import Editor from "@monaco-editor/react";
import {
  DEFAULT_EXAMPLE,
  EXAMPLE_OPTIONS,
  loadExampleCode,
} from "./examples";
import type { ExampleKey } from "./examples";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
}

function CodeEditor({ code, onChange }: CodeEditorProps) {
  const [selectedExample, setSelectedExample] = useState<ExampleKey>(
    DEFAULT_EXAMPLE,
  );

  const handleExampleChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedExample = e.target.value as ExampleKey;
    setSelectedExample(selectedExample);
    try {
      const exampleCode = await loadExampleCode(selectedExample);
      onChange(exampleCode);
    } catch (err) {
      console.error("Failed to load example", err);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch (err) {
      console.error("Failed to paste code", err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border border-gray-800 rounded-md overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 border-b border-gray-700">
        <select
          onChange={handleExampleChange}
          value={selectedExample}
          className="px-2 py-0.5 text-sm rounded-md bg-gray-700 border border-gray-600 text-gray-100 hover:bg-gray-600 transition-colors cursor-pointer"
        >
          {EXAMPLE_OPTIONS.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-0.5 text-sm rounded-md border-1 border-gray-100 text-gray-100 hover:bg-gray-500 hover:text-white transition-colors"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={handlePaste}
            className="px-2 py-0.5 text-sm rounded-md border-1 border-gray-100 text-gray-100 hover:bg-gray-500 hover:text-white transition-colors"
          >
            Paste
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={(value) => onChange(value || "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
