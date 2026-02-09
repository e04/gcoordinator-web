import { useSyncExternalStore } from "react";
import {
  subscribe,
  getStdoutSnapshot,
  getErrorSnapshot,
} from "./outputStore";

function ConsoleOutput() {
  const stdout = useSyncExternalStore(subscribe, getStdoutSnapshot);
  const error = useSyncExternalStore(subscribe, getErrorSnapshot);

  if (!stdout && !error) {
    return (
      <div className="text-gray-500 font-mono text-sm">
      </div>
    );
  }

  return (
    <div className="font-mono text-sm">
      {stdout && (
        <pre className="text-gray-300 whitespace-pre-wrap">{stdout}</pre>
      )}
      {error && (
        <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>
      )}
    </div>
  );
}

export default ConsoleOutput;
