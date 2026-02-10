import { useState, useCallback, useSyncExternalStore, useEffect } from "react";
import { getGcodeSnapshot, subscribe } from "./outputStore";
import OutputDisplay from "./OutputDisplay";
import ConsoleOutput from "./ConsoleOutput";
import CodeEditor from "./CodeEditor";
import GCodeViewer from "./GCodeViewer";
import DownloadModal from "./DownloadModal";
import AboutModal from "./AboutModal";
import { useLocalStorageNumber } from "./hooks/useLocalStorageState";
import { usePanelLayout } from "./hooks/usePanelLayout";
import { usePyodideRunner } from "./hooks/usePyodideRunner";
import { useAutoRun } from "./hooks/useAutoRun";
import { DEFAULT_EXAMPLE, loadExampleCode } from "./examples";
import { Download as DownloadIcon } from "lucide-react";

const CODE_STORAGE_KEY = "savedEditorCode";

function App() {
  const [code, setCode] = useState("");
  const [initialCode, setInitialCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const gcode = useSyncExternalStore(subscribe, getGcodeSnapshot);

  const [leftWidth, setLeftWidth] = useLocalStorageNumber(
    "editorWidthPercent",
    50,
  );
  const [outputHeight, setOutputHeight] = useLocalStorageNumber(
    "outputHeightPx",
    250,
  );
  const [consoleHeight, setConsoleHeight] = useLocalStorageNumber(
    "consoleHeightPx",
    128,
  );

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const savedCode = localStorage.getItem(CODE_STORAGE_KEY);
        if (savedCode !== null) {
          setCode(savedCode);
          setInitialCode(savedCode);
          return;
        }
      } catch (err) {
        console.error("Failed to load saved code from localStorage", err);
      }

      try {
        const exampleCode = await loadExampleCode(DEFAULT_EXAMPLE);
        setCode(exampleCode);
        setInitialCode(exampleCode);
      } catch (err) {
        console.error("Failed to load initial example", err);
        setCode("");
        setInitialCode("");
      }
    };

    loadInitial();
  }, []);

  const { isLoading, isRunning, runCode, lastRunCodeRef } =
    usePyodideRunner(initialCode);

  const {
    containerRef,
    leftPanelRef,
    rightPanelRef,
    handleHorizontalDragStart,
    handleOutputDragStart,
    handleConsoleDragStart,
  } = usePanelLayout({
    leftWidth,
    setLeftWidth,
    outputHeight,
    setOutputHeight,
    consoleHeight,
    setConsoleHeight,
  });

  const handleRun = useCallback(() => {
    runCode(code);
  }, [code, runCode]);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    try {
      localStorage.setItem(CODE_STORAGE_KEY, value);
    } catch (err) {
      console.error("Failed to save code to localStorage", err);
    }
  }, []);

  useAutoRun({
    code,
    isLoading,
    isRunning,
    lastRunCodeRef,
    onRun: handleRun,
  });

  const handleOpenModal = useCallback(() => {
    if (!gcode || !gcode.trim()) {
      return;
    }
    setIsModalOpen(true);
  }, [gcode]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <header className="bg-gray-800 px-2 py-2 flex items-center justify-between border-b border-gray-700 flex-shrink-0">
        <div className="flex items-baseline gap-8">
          <h1 className="text-lg font-bold">gcoordinator-web (beta)</h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                isLoading || isRunning ? "bg-yellow-400" : "bg-green-400"
              }`}
            />
            <span className="text-sm font-medium text-gray-300">
              {isLoading ? "Loading..." : isRunning ? "Running..." : "Ready"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/e04/gcoordinator-web"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
            title="View on GitHub"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <button
            type="button"
            onClick={() => setIsAboutModalOpen(true)}
            className="px-3 py-1 text-sm border border-gray-600 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            About
          </button>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 flex min-h-0">
        <div
          ref={leftPanelRef}
          style={{ width: `${leftWidth}%` }}
          className="flex flex-col min-h-0"
        >
          <div className="flex-1 min-h-0">
            <CodeEditor code={code} onChange={handleCodeChange} />
          </div>
          <div
            onMouseDown={handleConsoleDragStart}
            className="h-1 bg-gray-700 hover:bg-blue-500 cursor-row-resize transition-colors flex-shrink-0"
          />
          <div
            style={{ height: `${consoleHeight}px` }}
            className="border-t border-gray-700 bg-gray-900 overflow-auto p-3 flex-shrink-0"
          >
            <ConsoleOutput />
          </div>
        </div>

        <div
          onMouseDown={handleHorizontalDragStart}
          className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0"
        />

        <div
          ref={rightPanelRef}
          style={{ width: `${100 - leftWidth}%` }}
          className="relative bg-gray-950 min-h-0 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-2 py-1 bg-gray-800 border-b border-gray-700">
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={handleOpenModal}
                aria-label="Download gcode"
                title="Download gcode"
                className="p-1.5 border border-emerald-500/60 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors inline-flex items-center justify-center"
              >
                <DownloadIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          {(isLoading || isRunning) && (
            <div className="absolute top-9 left-0 right-0 h-1 z-30 overflow-hidden bg-gray-700">
              <div className="h-full w-1/3 bg-blue-500 animate-[loading-bar_1s_ease-in-out_infinite]" />
            </div>
          )}
          <GCodeViewer />
          <div
            style={{ height: `${outputHeight - 40}px` }}
            className="absolute px-0 py-0 top-10 left-0 right-0 bg-gray-900/60 border-b border-gray-700 overflow-auto p-4 z-10"
          >
            <OutputDisplay />
          </div>
          <div
            onMouseDown={handleOutputDragStart}
            style={{ top: `${outputHeight}px` }}
            className="absolute left-0 right-0 h-1 bg-gray-700 hover:bg-blue-500 cursor-row-resize transition-colors z-20"
          />
          <DownloadModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            gcode={gcode}
          />
        </div>
      </div>
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}

export default App;
