import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";

export function AnimationDriver() {
  const engine = useModelStore((s) => s.engine);
  const setCurrentTimeFromEngine = useAnimationStore((s) => s.setCurrentTimeFromEngine);
  const isPlaying = useAnimationStore((s) => s.isPlaying);
  const loop = useAnimationStore((s) => s.loop);
  const loopInRange = useAnimationStore((s) => s.loopInRange);
  const playRangeStart = useAnimationStore((s) => s.playRangeStart);
  const playRangeEnd = useAnimationStore((s) => s.playRangeEnd);
  const pause = useAnimationStore((s) => s.pause);
  const seek = useAnimationStore((s) => s.seek);
  const accum = useRef(0);

  useFrame((_, delta) => {
    if (!engine) return;
    const t = engine.update(Math.min(delta, 0.1));
    const duration = engine.duration;
    const rangeEnd = playRangeEnd > 0 ? playRangeEnd : duration;
    const rangeStart = playRangeStart;

    if (isPlaying) {
      if (loop && loopInRange && rangeEnd > rangeStart) {
        if (t >= rangeEnd - 0.001) {
          engine.seek(rangeStart);
        }
      } else if (!loop && duration > 0) {
        const stopAt = loopInRange && rangeEnd > rangeStart ? rangeEnd : duration;
        if (t >= stopAt - 0.001) {
          pause();
          seek(stopAt);
        }
      }
    }

    accum.current += delta;
    if (accum.current >= 0.05) {
      accum.current = 0;
      setCurrentTimeFromEngine(engine.time);
    }
  });

  return null;
}
