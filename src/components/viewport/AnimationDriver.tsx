import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";

export function AnimationDriver() {
  const engine = useModelStore((s) => s.engine);
  const setCurrentTimeFromEngine = useAnimationStore((s) => s.setCurrentTimeFromEngine);
  const isPlaying = useAnimationStore((s) => s.isPlaying);
  const loop = useAnimationStore((s) => s.loop);
  const pause = useAnimationStore((s) => s.pause);
  const accum = useRef(0);

  useFrame((_, delta) => {
    if (!engine) return;
    const t = engine.update(Math.min(delta, 0.1));

    if (isPlaying && !loop && engine.duration > 0 && t >= engine.duration - 0.001) {
      pause();
    }

    accum.current += delta;
    if (accum.current >= 0.05) {
      accum.current = 0;
      setCurrentTimeFromEngine(t);
    }
  });

  return null;
}
