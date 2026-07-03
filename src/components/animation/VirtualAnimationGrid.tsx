import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const GRID_GAP_PX = 16;
const ROW_BUFFER = 0;
const DEFAULT_NEAR_END_PX = 280;

function columnsForWidth(width: number): number {
  if (width >= 1280) return 3;
  if (width >= 640) return 2;
  return 1;
}

interface VirtualAnimationGridProps<T extends { id: string }> {
  items: T[];
  rowHeight: number;
  className?: string;
  renderItem: (item: T) => ReactNode;
  /** Fired when the user scrolls near the bottom — use to load the next batch. */
  onNearEnd?: () => void;
  nearEndThreshold?: number;
}

export function VirtualAnimationGrid<T extends { id: string }>({
  items,
  rowHeight,
  className,
  renderItem,
  onNearEnd,
  nearEndThreshold = DEFAULT_NEAR_END_PX,
}: VirtualAnimationGridProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const onNearEndRef = useRef(onNearEnd);
  onNearEndRef.current = onNearEnd;
  const nearEndCooldownRef = useRef(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);
  const [containerWidth, setContainerWidth] = useState(960);

  const cols = columnsForWidth(containerWidth);
  const rowCount = Math.max(1, Math.ceil(items.length / cols));
  const totalHeight = rowCount * rowHeight - GRID_GAP_PX;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - ROW_BUFFER);
  const endRow = Math.min(rowCount, Math.ceil((scrollTop + viewportHeight) / rowHeight) + ROW_BUFFER);

  const visibleCells = useMemo(() => {
    const cells: { item: T; row: number; col: number; index: number }[] = [];
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index >= items.length) break;
        cells.push({ item: items[index], row, col, index });
      }
    }
    return cells;
  }, [items, cols, startRow, endRow]);

  const checkNearEnd = useCallback(() => {
    const el = scrollRef.current;
    const loadMore = onNearEndRef.current;
    if (!el || !loadMore) return;

    const remaining = el.scrollHeight - (el.scrollTop + el.clientHeight);
    if (remaining > nearEndThreshold) return;
    if (nearEndCooldownRef.current) return;

    nearEndCooldownRef.current = true;
    loadMore();
    requestAnimationFrame(() => {
      nearEndCooldownRef.current = false;
    });
  }, [nearEndThreshold]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    checkNearEnd();
  }, [checkNearEnd]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      setViewportHeight(el.clientHeight);
      setContainerWidth(el.clientWidth);
      setScrollTop(el.scrollTop);
    };

    measure();
    const observer = new ResizeObserver(() => {
      measure();
      checkNearEnd();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length, checkNearEnd]);

  useEffect(() => {
    checkNearEnd();
  }, [items.length, viewportHeight, checkNearEnd]);

  const colWidthPct = 100 / cols;

  return (
    <div ref={scrollRef} onScroll={onScroll} className={className} data-library-scroll>
      <div className="relative w-full" style={{ height: Math.max(totalHeight, 0) }}>
        {visibleCells.map(({ item, row, col }) => (
          <div
            key={item.id}
            className="absolute px-2"
            style={{
              top: row * rowHeight,
              left: `${col * colWidthPct}%`,
              width: `${colWidthPct}%`,
              height: rowHeight - GRID_GAP_PX,
            }}
          >
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
