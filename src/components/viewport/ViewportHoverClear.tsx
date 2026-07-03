import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useModelStore } from "@/store/modelStore";

/** Clears viewport hover when the pointer leaves the canvas. */
export function ViewportHoverClear() {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const onLeave = () => useModelStore.getState().clearViewportHover();
    canvas.addEventListener("pointerleave", onLeave);
    return () => canvas.removeEventListener("pointerleave", onLeave);
  }, [gl]);

  return null;
}
