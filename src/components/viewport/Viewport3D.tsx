import { Suspense, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { ModelRenderer } from "@/components/viewport/ModelRenderer";
import { SkeletonOverlay } from "@/components/viewport/SkeletonOverlay";
import { GizmoController } from "@/components/viewport/GizmoController";
import { ViewportToolbar } from "@/components/viewport/ViewportToolbar";
import { SceneLighting } from "@/components/viewport/SceneLighting";
import { useViewportThemeColors } from "@/hooks/useViewportThemeColors";

function frameModelOnCamera(
  model: NonNullable<ReturnType<typeof useModelStore.getState>["model"]>,
  camera: THREE.Camera,
  controls: OrbitControlsImpl | null
) {
  const box = new THREE.Box3().setFromObject(model.object3D);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const distance = maxDim * 1.7;

  camera.position.set(center.x + distance * 0.55, center.y + distance * 0.45, center.z + distance * 0.75);
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.near = Math.max(distance / 200, 0.01);
    camera.far = distance * 30;
    camera.updateProjectionMatrix();
  }

  if (controls) {
    controls.target.copy(center);
    controls.update();
  }
}

function CameraFraming() {
  const model = useModelStore((s) => s.model);
  const frameCameraTick = useModelStore((s) => s.frameCameraTick);
  const autoRotate = useModelStore((s) => s.autoRotate);
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const frame = useCallback(() => {
    if (!model) return;
    frameModelOnCamera(model, camera, controlsRef.current);
  }, [model, camera]);

  useEffect(() => {
    frame();
  }, [model, frameCameraTick, frame]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      autoRotate={autoRotate}
      autoRotateSpeed={0.85}
    />
  );
}

function AnimationDriver() {
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
      {model && showShadows && (
        <ContactShadows position={[0, 0.001, 0]} opacity={0.4} scale={12} blur={2.2} far={4} />
      )}

      <AnimationDriver />
      <CameraFraming />
    </>
  );
}

export function Viewport3D() {
  const showShadows = useModelStore((s) => s.showShadows);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-background">
      <Canvas shadows={showShadows} camera={{ position: [2.5, 1.8, 3], fov: 45, near: 0.01, far: 1000 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
      <ViewportToolbar />
    </div>
  );
}
