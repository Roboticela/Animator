import { useEffect, useRef, useState } from "react";

/** Smoothed viewport FPS for the status bar. */
export function useViewportFps(enabled: boolean) {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = (now: number) => {
      frames.current += 1;
      const elapsed = now - last.current;
      if (elapsed >= 500) {
        setFps(Math.round((frames.current * 1000) / elapsed));
        frames.current = 0;
        last.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  return fps;
}
