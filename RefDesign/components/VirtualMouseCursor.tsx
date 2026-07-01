"use client";

import { useEffect, useState, useCallback, useRef, type RefObject } from "react";
import { useMouse } from "@/contexts/MouseContext";
import { shouldControlVirtualMouseWithArrow } from "@/lib/key-display";

/** Cursor glyph size so the full arrow stays inside bounds */
const CURSOR_W = 24;
const CURSOR_H = 24;
const CURSOR_STEP = 12;

const ARROW_DELTA: Record<string, { dx: number; dy: number }> = {
  ArrowUp: { dx: 0, dy: -CURSOR_STEP },
  ArrowDown: { dx: 0, dy: CURSOR_STEP },
  ArrowLeft: { dx: -CURSOR_STEP, dy: 0 },
  ArrowRight: { dx: CURSOR_STEP, dy: 0 },
};

type VirtualMouseCursorProps = {
  documentRef: RefObject<HTMLElement | null>;
};

function clampToRect(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { x: number; y: number } {
  return {
    x: Math.min(Math.max(clientX, rect.left), rect.right - CURSOR_W),
    y: Math.min(Math.max(clientY, rect.top), rect.bottom - CURSOR_H),
  };
}

function CursorGlyph() {
  return (
    <svg
      width={CURSOR_W}
      height={CURSOR_H}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md"
    >
      <path
        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.36a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
        fill="var(--foreground)"
        stroke="var(--background)"
        strokeWidth="1.25"
      />
    </svg>
  );
}

/** Virtual cursor confined to the document editor — never the 3D keyboard renderer */
export default function VirtualMouseCursor({ documentRef }: VirtualMouseCursorProps) {
  const {
    mouseEnabled,
    keyboardMouseEnabled,
    registerVirtualMouseMover,
  } = useMouse();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const lastClientRef = useRef<{ x: number; y: number } | null>(null);

  const updateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const documentEl = documentRef.current;
      if (!documentEl) return;

      lastClientRef.current = { x: clientX, y: clientY };
      const clamped = clampToRect(clientX, clientY, documentEl.getBoundingClientRect());
      setPosition(clamped);
    },
    [documentRef],
  );

  const seedCenterPosition = useCallback(() => {
    const documentEl = documentRef.current;
    if (!documentEl) return;

    const docRect = documentEl.getBoundingClientRect();
    const centerX = (docRect.left + docRect.right) / 2;
    const centerY = (docRect.top + docRect.bottom) / 2;
    updateFromClient(centerX, centerY);
  }, [documentRef, updateFromClient]);

  const moveByArrowKey = useCallback(
    (key: string) => {
      const delta = ARROW_DELTA[key];
      const documentEl = documentRef.current;
      if (!delta || !documentEl) return;

      const rect = documentEl.getBoundingClientRect();
      const current = lastClientRef.current ?? {
        x: (rect.left + rect.right) / 2,
        y: (rect.top + rect.bottom) / 2,
      };
      const next = clampToRect(current.x + delta.dx, current.y + delta.dy, rect);
      lastClientRef.current = next;
      setPosition(next);
    },
    [documentRef],
  );

  useEffect(() => {
    registerVirtualMouseMover(moveByArrowKey);
    return () => registerVirtualMouseMover(null);
  }, [moveByArrowKey, registerVirtualMouseMover]);

  useEffect(() => {
    if (!mouseEnabled) {
      setPosition(null);
      lastClientRef.current = null;
      return;
    }

    seedCenterPosition();

    const handleMove = (e: MouseEvent) => {
      updateFromClient(e.clientX, e.clientY);
    };

    const reclamp = () => {
      const last = lastClientRef.current;
      if (last) updateFromClient(last.x, last.y);
      else seedCenterPosition();
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("scroll", reclamp, { passive: true, capture: true });
    window.addEventListener("resize", reclamp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("scroll", reclamp, true);
      window.removeEventListener("resize", reclamp);
    };
  }, [mouseEnabled, updateFromClient, seedCenterPosition]);

  useEffect(() => {
    if (!mouseEnabled || !keyboardMouseEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !shouldControlVirtualMouseWithArrow(e.key, keyboardMouseEnabled, mouseEnabled, {
          ctrl: e.ctrlKey,
          meta: e.metaKey,
          alt: e.altKey,
        })
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      moveByArrowKey(e.key);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [mouseEnabled, keyboardMouseEnabled, moveByArrowKey]);

  if (!mouseEnabled || !position) return null;

  return (
    <div
      className="fixed z-[60] pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-2px, -2px)",
      }}
      aria-hidden
    >
      <CursorGlyph />
    </div>
  );
}
