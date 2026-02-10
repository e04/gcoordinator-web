import { useState } from "react";
import Editor from "@monaco-editor/react";
import { DEFAULT_EXAMPLE, loadExampleCode } from "./examples";
import type { ExampleKey } from "./examples";
import LoadCodeModal from "./LoadCodeModal";
import { ClipboardPaste, Copy, Download, FolderOpen } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
}

function CodeEditor({ code, onChange }: CodeEditorProps) {
  const [selectedExample, setSelectedExample] =
    useState<ExampleKey>(DEFAULT_EXAMPLE);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleExampleChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedExample = e.target.value as ExampleKey;
    setSelectedExample(selectedExample);
    try {
      const exampleCode = await loadExampleCode(selectedExample);
      onChange(exampleCode);
      setIsLoadModalOpen(false);
    } catch (err) {
      console.error("Failed to load example", err);
    }
  };

  const handleFileLoad = async (file: File) => {
    try {
      const text = await file.text();
      onChange(text);
      setIsLoadModalOpen(false);
    } catch (err) {
      console.error("Failed to import file", err);
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileLoad(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleFileLoad(file);
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

  const handleDownload = () => {
    try {
      const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gcoordinator-web-${new Date()
        .toISOString()
        .replace(/:/g, "-")}.py`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download code", err);
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-gray-900 border border-gray-800 rounded-md overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1 bg-gray-800 border-b border-gray-700">
        <button
          type="button"
          onClick={() => setIsLoadModalOpen(true)}
          aria-label="Load code"
          title="Load code"
          className="p-1.5 border border-blue-500/60 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors inline-flex items-center justify-center"
        >
          <FolderOpen className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Save code"
          title="Save code"
          className="p-1.5 border border-emerald-500/60 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors inline-flex items-center justify-center"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy code"
            title="Copy code"
            className="p-1.5 border border-indigo-500/60 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors inline-flex items-center justify-center"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handlePaste}
            aria-label="Paste code"
            title="Paste code"
            className="p-1.5 border border-violet-500/60 rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors inline-flex items-center justify-center"
          >
            <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
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

      <LoadCodeModal
        isOpen={isLoadModalOpen}
        selectedExample={selectedExample}
        isDragActive={isDragActive}
        onClose={() => setIsLoadModalOpen(false)}
        onExampleChange={handleExampleChange}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        onFileInputChange={handleFileInputChange}
      />
    </div>
  );
}

export default CodeEditor;
