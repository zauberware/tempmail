import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  storageKey: string;
  defaultLeftPx: number;
  minLeftPx: number;
  maxLeftPx: number;
  left: React.ReactNode;
  right: React.ReactNode;
}

export function SplitPane({
  storageKey,
  defaultLeftPx,
  minLeftPx,
  maxLeftPx,
  left,
  right,
}: Props) {
  const [width, setWidth] = useState<number>(() => {
    try {
      const v = localStorage.getItem(storageKey);
      const n = v ? parseInt(v, 10) : NaN;
      if (Number.isFinite(n) && n >= minLeftPx && n <= maxLeftPx) return n;
    } catch {
      /* ignore */
    }
    return defaultLeftPx;
  });

  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const next = Math.min(maxLeftPx, Math.max(minLeftPx, e.clientX - rect.left));
      setWidth(next);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem(storageKey, String(Math.round(width)));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [width, storageKey, minLeftPx, maxLeftPx]);

  return (
    <div ref={containerRef} className="flex h-full w-full min-w-0 overflow-hidden">
      <div style={{ width }} className="h-full shrink-0 overflow-hidden">
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={onDown}
        className={cn(
          "relative h-full w-px shrink-0 cursor-col-resize bg-border",
          "after:absolute after:inset-y-0 after:-left-1 after:w-3",
          "hover:bg-primary/60 transition-colors",
        )}
      />
      <div className="h-full min-w-0 flex-1 overflow-hidden">{right}</div>
    </div>
  );
}
