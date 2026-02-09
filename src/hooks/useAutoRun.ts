import { useEffect, useRef } from "react";

interface UseAutoRunOptions {
  code: string;
  isLoading: boolean;
  isRunning: boolean;
  lastRunCodeRef: React.RefObject<string>;
  onRun: () => void;
  delay?: number;
}

export function useAutoRun({
  code,
  isLoading,
  isRunning,
  lastRunCodeRef,
  onRun,
  delay = 800,
}: UseAutoRunOptions): void {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading || isRunning) return;
    if (code === lastRunCodeRef.current) return;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      onRun();
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [code, isLoading, isRunning, onRun, delay, lastRunCodeRef]);
}
