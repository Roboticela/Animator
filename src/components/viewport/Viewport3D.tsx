import { Suspense, useEffect, useRef } from "react";
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

function CameraFraming() {
  const model = useModelStore((s) => s.model);
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    if (!model) return;
    const box = new THREE.Box3().setFromObject(model.object3D);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const distance = maxDim * 1.7;

    camera.position.set(center.x + distance * 0.55, center.y + distance * 0.45, center.z + distance * 0.75);
    camera.near = Math.max(distance / 200, 0.01);
    camera.far = distance * 30;
    if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  }, [model, camera]);

  return <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.12} />;
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

function SceneContent() {
  const model = useModelStore((s) => s.model);
  const showGrid = useModelStore((s) => s.showGrid);

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 4]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-4, 3, -3]} intensity={0.35} />
      <hemisphereLight args={["#7dd3fc", "#111827", 0.35]} />

      {showGrid && (
        <Grid
          position={[0, 0, 0]}
          infiniteGrid
          fadeDistance={30}
          fadeStrength={1.5}
          cellColor="#243044"
          sectionColor="#39506e"
          sectionSize={1}
          cellSize={0.2}
        />
      )}

      {model && <ModelRenderer />}
      {model && <SkeletonOverlay />}
      {model && <GizmoController />}
      {model && <ContactShadows position={[0, 0.001, 0]} opacity={0.4} scale={12} blur={2.2} far={4} />}

      <AnimationDriver />
      <CameraFraming />
    </>
  );
}

export function Viewport3D() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-background">
      <Canvas shadows camera={{ position: [2.5, 1.8, 3], fov: 45, near: 0.01, far: 1000 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
      <ViewportToolbar />
    </div>
  );
}
