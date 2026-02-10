import { useState, useCallback } from "react";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  gcode: string;
}

const STORAGE_KEY_START = "gcoordinator-start-gcode";
const STORAGE_KEY_END = "gcoordinator-end-gcode";

function DownloadModal({ isOpen, onClose, gcode }: DownloadModalProps) {
  const [startGCode, setStartGCode] = useState(
    () => localStorage.getItem(STORAGE_KEY_START) ?? "",
  );
  const [endGCode, setEndGCode] = useState(
    () => localStorage.getItem(STORAGE_KEY_END) ?? "",
  );
  const [filename, setFilename] = useState(
    () => `gcoordinator-web-${new Date().toISOString().replace(/:/g, "-")}`,
  );

  const handleStartBlur = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_START, startGCode);
  }, [startGCode]);

  const handleEndBlur = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_END, endGCode);
  }, [endGCode]);

  const handleDownload = useCallback(() => {
    const finalGCode = [startGCode, gcode, endGCode]
      .filter((part) => part.trim())
      .join("\n");

    const downloadFilename = filename.endsWith(".gcode")
      ? filename
      : `${filename}.gcode`;
    const blob = new Blob([finalGCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadFilename;
    anchor.click();

    URL.revokeObjectURL(url);
    onClose();
  }, [startGCode, endGCode, gcode, filename, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl rounded-md border border-gray-700 bg-gray-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">Download G-code</h2>          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-300">Filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename..."
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-2 py-1 font-mono text-sm text-gray-100 transition-colors placeholder:text-gray-500 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-300">Start G-code</label>
            <textarea
              value={startGCode}
              onChange={(e) => setStartGCode(e.target.value)}
              onBlur={handleStartBlur}
              placeholder="Enter G-code to prepend at the start..."
              className="h-32 w-full resize-none rounded-md border border-gray-600 bg-gray-800 px-2 py-1 font-mono text-sm text-gray-100 transition-colors placeholder:text-gray-500 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-300">End G-code</label>
            <textarea
              value={endGCode}
              onChange={(e) => setEndGCode(e.target.value)}
              onBlur={handleEndBlur}
              placeholder="Enter G-code to append at the end..."
              className="h-32 w-full resize-none rounded-md border border-gray-600 bg-gray-800 px-2 py-1 font-mono text-sm text-gray-100 transition-colors placeholder:text-gray-500 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-md border border-red-700 bg-red-950/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-300">
              Warning
            </p>
            <div className="mt-1 space-y-1 text-sm text-red-200">
              <p>Use at your own risk.</p>
              <p>No warranty of any kind is provided.</p>
            </div>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-600 bg-gray-800 px-3 py-1 text-sm text-gray-200 transition-colors hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-md border border-blue-500 bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-500"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DownloadModal;
