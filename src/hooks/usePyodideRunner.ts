import { useState, useCallback, useRef, useEffect } from "react";
import { initPyodide, runPython } from "../pyodide";
import { setGcode, setStdout, setError, clearOutput } from "../outputStore";

interface UsePyodideRunnerResult {
  isLoading: boolean;
  isRunning: boolean;
  runCode: (code: string) => Promise<void>;
  lastRunCodeRef: React.RefObject<string>;
}

export function usePyodideRunner(
  initialCode: string | null,
): UsePyodideRunnerResult {
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const lastRunCodeRef = useRef<string>(initialCode ?? "");
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    if (hasBootstrappedRef.current) return;
    if (initialCode === null) return;

    let cancelled = false;
    hasBootstrappedRef.current = true;

    const bootstrap = async () => {
      try {
        await initPyodide();
        if (cancelled) return;

        setIsRunning(true);
        clearOutput();
        const result = await runPython(
          `import sys\nprint(sys.version)\n${initialCode}`,
        );
        if (cancelled) return;

        lastRunCodeRef.current = initialCode;
        setGcode(result.gcode);
        setStdout(result.stdout);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setIsRunning(false);
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [initialCode]);

  const runCode = useCallback(async (code: string) => {
    if (isLoading || isRunning) return;

    lastRunCodeRef.current = code;

    setIsRunning(true);
    clearOutput();

    try {
      const result = await runPython(code);
      setGcode(result.gcode);
      setStdout(result.stdout);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  }, [isLoading, isRunning]);

  return {
    isLoading,
    isRunning,
    runCode,
    lastRunCodeRef,
  };
}
