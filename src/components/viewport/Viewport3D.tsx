import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Grid } from "@react-three/drei";
import { useModelStore } from "@/store/modelStore";
import { ModelRenderer } from "@/components/viewport/ModelRenderer";
import { SkeletonOverlay } from "@/components/viewport/SkeletonOverlay";
import { GizmoController } from "@/components/viewport/GizmoController";
import { ViewportToolbar } from "@/components/viewport/ViewportToolbar";
import { ViewportBottomToolbar } from "@/components/viewport/ViewportBottomToolbar";
import { SceneLighting } from "@/components/viewport/SceneLighting";
import { ViewportCamera } from "@/components/viewport/ViewportCamera";
import { AnimationDriver } from "@/components/viewport/AnimationDriver";
import { MeshEditOverlayLayer } from "@/components/viewport/MeshEditOverlayLayer";
import { MeshViewportInteractor } from "@/components/viewport/MeshViewportInteractor";
import { ViewportHoverClear } from "@/components/viewport/ViewportHoverClear";
import { useViewportThemeColors } from "@/hooks/useViewportThemeColors";

function SceneAxes() {
  const showAxes = useModelStore((s) => s.showAxes);
  const sceneRadius = useModelStore((s) => s.sceneRadius);
  if (!showAxes) return null;
  return <axesHelper args={[Math.max(sceneRadius * 1.25, 0.5)]} />;
}

function SceneContent() {
  const model = useModelStore((s) => s.model);
  const showGrid = useModelStore((s) => s.showGrid);
  const showShadows = useModelStore((s) => s.showShadows);
  const { background, gridCell, gridSection } = useViewportThemeColors();

  return (
    <>
      <color attach="background" args={[background]} />
      <SceneLighting />

      {showGrid && (
        <Grid
          position={[0, 0, 0]}
          infiniteGrid
          fadeDistance={30}
          fadeStrength={1.5}
          cellColor={gridCell}
          sectionColor={gridSection}
          sectionSize={1}
          cellSize={0.2}
        />
      )}

      <SceneAxes />

      {model && <ModelRenderer />}
      {model && <SkeletonOverlay />}
      {model && <GizmoController />}
      {model && <MeshEditOverlayLayer />}
      {model && <MeshViewportInteractor />}
      {model && <ViewportHoverClear />}
      {model && showShadows && showGrid && (
        <ContactShadows position={[0, 0.001, 0]} opacity={0.4} scale={12} blur={2.2} far={4} />
      )}

      <AnimationDriver />
      <ViewportCamera />
    </>
  );
}

export function Viewport3D() {
  const showShadows = useModelStore((s) => s.showShadows);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      id="animator-viewport"
      className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-background"
    >
      <Canvas shadows={showShadows} camera={{ position: [2.5, 1.8, 3], fov: 45, near: 0.01, far: 1000 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
      <ViewportToolbar viewportRoot={containerRef} />
      <ViewportBottomToolbar viewportRoot={containerRef} />
    </div>
  );
}
