import {
  useSyncExternalStore,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  subscribe,
  getGcodeSnapshot,
  getSelectedLineSnapshot,
  setSelectedLine,
} from "./outputStore";

const LINE_HEIGHT = 20; // pixels per line
const OVERSCAN = 5; // extra rows to render above/below viewport

function OutputDisplay() {
  const gcode = useSyncExternalStore(subscribe, getGcodeSnapshot);
  const selectedLine = useSyncExternalStore(subscribe, getSelectedLineSnapshot);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const lines = useMemo(() => gcode.split("\n"), [gcode]);
  const totalHeight = lines.length * LINE_HEIGHT;

  // Update container height on mount and resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleLineClick = useCallback((lineIndex: number) => {
    const currentSelected = getSelectedLineSnapshot();
    if (currentSelected === lineIndex) {
      setSelectedLine(null);
    } else {
      setSelectedLine(lineIndex);
    }
  }, []);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    lines.length - 1,
    Math.ceil((scrollTop + containerHeight) / LINE_HEIGHT) + OVERSCAN
  );

  const visibleLines = useMemo(() => {
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const line = lines[i];
      const className = `cursor-pointer hover:bg-gray-700 ${
        selectedLine === i
          ? "bg-yellow-700 text-white"
          : selectedLine !== null && i < selectedLine
          ? "text-cyan-400"
          : selectedLine !== null && i > selectedLine
          ? "text-gray-500"
          : "text-gray-300"
      }`;

      items.push(
        <div
          key={i}
          onClick={() => handleLineClick(i)}
          className={className}
          style={{
            position: "absolute",
            top: i * LINE_HEIGHT,
            height: LINE_HEIGHT,
            left: 0,
            right: 0,
            paddingLeft: "8px",
          }}
        >
          {line || "\u00A0"}
        </div>
      );
    }
    return items;
  }, [startIndex, endIndex, lines, selectedLine, handleLineClick]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="font-mono text-sm h-full w-full overflow-auto"
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleLines}
      </div>
    </div>
  );
}

export default OutputDisplay;
