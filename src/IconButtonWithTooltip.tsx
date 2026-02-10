import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface IconButtonWithTooltipProps {
  tooltip: string;
  children: React.ReactNode;
}

interface TooltipStyle {
  top: number;
  left: number;
  visibility: "hidden" | "visible";
  opacity: number;
}

const VIEWPORT_PADDING = 8;
const TOOLTIP_OFFSET = 8;

function IconButtonWithTooltip({
  tooltip,
  children,
}: IconButtonWithTooltipProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<TooltipStyle | null>(null);

  const openTooltip = () => setIsOpen(true);
  const closeTooltip = () => {
    setIsOpen(false);
    setTooltipStyle(null);
  };

  const updateTooltipPosition = useCallback(() => {
    const anchorEl = anchorRef.current;
    const tooltipEl = tooltipRef.current;
    if (!anchorEl || !tooltipEl) {
      return;
    }

    const anchorRect = anchorEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const centeredLeft =
      anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
    const maxLeft = window.innerWidth - VIEWPORT_PADDING - tooltipRect.width;
    const left =
      maxLeft < VIEWPORT_PADDING
        ? VIEWPORT_PADDING
        : Math.min(Math.max(centeredLeft, VIEWPORT_PADDING), maxLeft);

    const top = Math.max(
      anchorRect.top - TOOLTIP_OFFSET - tooltipRect.height,
      VIEWPORT_PADDING,
    );

    setTooltipStyle({
      top: Math.round(top),
      left: Math.round(left),
      visibility: "visible",
      opacity: 1,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const rafId = window.requestAnimationFrame(updateTooltipPosition);
    const handleReposition = () => updateTooltipPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updateTooltipPosition, tooltip]);

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && anchorRef.current?.contains(nextTarget)) {
      return;
    }
    closeTooltip();
  };

  const hiddenStyle: TooltipStyle = {
    top: 0,
    left: 0,
    visibility: "hidden",
    opacity: 0,
  };
  const shouldRenderTooltip = isOpen && typeof document !== "undefined";

  return (
    <>
      <div
        ref={anchorRef}
        className="inline-flex"
        onMouseEnter={openTooltip}
        onMouseLeave={closeTooltip}
        onFocusCapture={openTooltip}
        onBlurCapture={handleBlur}
      >
        {children}
      </div>

      {shouldRenderTooltip
        ? createPortal(
            <span
              ref={tooltipRef}
              role="tooltip"
              className="pointer-events-none fixed z-[100] whitespace-nowrap rounded bg-gray-950 px-2 py-1 text-xs text-gray-100 shadow-md ring-1 ring-gray-700 transition-opacity duration-150"
              style={tooltipStyle ?? hiddenStyle}
            >
              {tooltip}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

export default IconButtonWithTooltip;
