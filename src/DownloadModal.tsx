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
    () => localStorage.getItem(STORAGE_KEY_START) ?? ""
  );
  const [endGCode, setEndGCode] = useState(
    () => localStorage.getItem(STORAGE_KEY_END) ?? ""
  );
  const [filename, setFilename] = useState(
    () => `gcoordinator-web-${new Date().toISOString().replace(/:/g, "-")}`
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
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Download G-Code</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              FILENAME
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start G-CODE
            </label>
            <textarea
              value={startGCode}
              onChange={(e) => setStartGCode(e.target.value)}
              onBlur={handleStartBlur}
              placeholder="Enter G-code to prepend at the start..."
              className="w-full h-32 bg-gray-900 border border-gray-600 rounded-lg p-3 text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End G-CODE
            </label>
            <textarea
              value={endGCode}
              onChange={(e) => setEndGCode(e.target.value)}
              onBlur={handleEndBlur}
              placeholder="Enter G-code to append at the end..."
              className="w-full h-32 bg-gray-900 border border-gray-600 rounded-lg p-3 text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold transition-colors bg-gray-600 hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg font-semibold transition-colors bg-blue-600 hover:bg-blue-500"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default DownloadModal;
