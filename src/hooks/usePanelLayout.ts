import { useRef, useCallback, useEffect } from "react";

type ResizeDirection = "horizontal" | "vertical";

interface ResizableConfig {
  direction: ResizeDirection;
  containerRef: React.RefObject<HTMLElement | null>;
  min: number;
  max: number | ((containerSize: number) => number);
  onResize: (value: number) => void;
  invertValue?: boolean;
}

interface UseResizablePanelResult {
  handleMouseDown: () => void;
}

export function useResizablePanel(
  config: ResizableConfig,
): UseResizablePanelResult {
  const { direction, containerRef, min, max, onResize, invertValue = false } = config;
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }, [direction]);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === "horizontal" ? rect.width : rect.height;
      const maxValue = typeof max === "function" ? max(containerSize) : max;

      let newValue: number;
      if (direction === "horizontal") {
        newValue = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        if (invertValue) {
          newValue = rect.bottom - e.clientY;
        } else {
          newValue = e.clientY - rect.top;
        }
      }

      const clampedValue = Math.min(Math.max(newValue, min), maxValue);
      onResize(clampedValue);
    },
    [direction, containerRef, min, max, onResize, invertValue],
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return { handleMouseDown };
}

interface PanelResizeState {
  leftWidth: number;
  setLeftWidth: (value: number) => void;
  outputHeight: number;
  setOutputHeight: (value: number) => void;
  consoleHeight: number;
  setConsoleHeight: (value: number) => void;
}

interface UsePanelLayoutResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  leftPanelRef: React.RefObject<HTMLDivElement | null>;
  rightPanelRef: React.RefObject<HTMLDivElement | null>;
  handleHorizontalDragStart: () => void;
  handleOutputDragStart: () => void;
  handleConsoleDragStart: () => void;
}

export function usePanelLayout(state: PanelResizeState): UsePanelLayoutResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const { handleMouseDown: handleHorizontalDragStart } = useResizablePanel({
    direction: "horizontal",
    containerRef,
    min: 20,
    max: 80,
    onResize: state.setLeftWidth,
  });

  const { handleMouseDown: handleOutputDragStart } = useResizablePanel({
    direction: "vertical",
    containerRef: rightPanelRef,
    min: 100,
    max: (h) => h - 100,
    onResize: state.setOutputHeight,
  });

  const { handleMouseDown: handleConsoleDragStart } = useResizablePanel({
    direction: "vertical",
    containerRef: leftPanelRef,
    min: 80,
    max: (h) => h - 120,
    onResize: state.setConsoleHeight,
    invertValue: true,
  });

  return {
    containerRef,
    leftPanelRef,
    rightPanelRef,
    handleHorizontalDragStart,
    handleOutputDragStart,
    handleConsoleDragStart,
  };
}
