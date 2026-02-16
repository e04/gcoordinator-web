import type React from "react";
import { EXAMPLE_OPTIONS } from "./examples";
import type { ExampleKey } from "./examples";

interface LoadCodeModalProps {
  isOpen: boolean;
  selectedExample: ExampleKey;
  isDragActive: boolean;
  onClose: () => void;
  onExampleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function LoadCodeModal({
  isOpen,
  selectedExample,
  isDragActive,
  onClose,
  onExampleChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
}: LoadCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-md border border-gray-700 bg-gray-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">Load code</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-300">Load example</label>
            <select
              onChange={onExampleChange}
              value={selectedExample}
              className="w-full px-2 py-1 text-sm rounded-md bg-gray-800 border border-gray-600 text-gray-100 hover:bg-gray-700 transition-colors cursor-pointer"
            >
              {EXAMPLE_OPTIONS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-gray-500">
            <span className="h-px flex-1 bg-gray-700" />
            <span className="px-1">or</span>
            <span className="h-px flex-1 bg-gray-700" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-300">Import local file</label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`rounded-md border border-dashed px-3 py-5 text-center text-sm ${
                isDragActive
                  ? "border-blue-400 bg-blue-500/10 text-blue-200"
                  : "border-gray-600 bg-gray-800 text-gray-300"
              }`}
            >
              Drag & drop file here
              <div className="mt-2">
                <label className="inline-block px-2 py-0.5 text-sm border border-gray-600 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                  Choose file
                  <input
                    type="file"
                    className="hidden"
                    onChange={onFileInputChange}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadCodeModal;
