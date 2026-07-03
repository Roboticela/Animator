import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  buildLibraryPreviewClip,
  cloneModelForPreview,
  collectBonesFromRoot,
  disposePreviewRoot,
  frameObjectForCamera,
  getPreviewSourceRoot,
} from "@/lib/animation-preview";
import { getProceduralDef, type ProceduralAnimationId } from "@/lib/procedural";
import { useModelStore } from "@/store/modelStore";
import { useViewportThemeColors } from "@/hooks/useViewportThemeColors";
import { cn } from "@/lib/utils";

function PreviewCamera({ root, autoRotate = true }: { root: THREE.Object3D; autoRotate?: boolean }) {
  const { camera } = useThree();
  const target = useMemo(() => {
    const box = new THREE.Box3().setFromObject(root);
    return box.isEmpty() ? new THREE.Vector3(0, 0.9, 0) : box.getCenter(new THREE.Vector3());
  }, [root]);

  useEffect(() => {
    frameObjectForCamera(root, camera);
  }, [root, camera]);

  return (
    <OrbitControls
      target={target}
      enablePan={false}
      enableZoom={false}
      minDistance={0.4}
      maxDistance={12}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotate ? 0.85 : 0}
    />
  );
}

function PreviewScene({
  animationId,
  forceLoop = false,
  autoRotate = true,
  lite = false,
}: {
  animationId: ProceduralAnimationId;
  forceLoop?: boolean;
  autoRotate?: boolean;
  lite?: boolean;
}) {
  const loadedModel = useModelStore((s) => s.model);
  const { background } = useViewportThemeColors();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const sourceRoot = getPreviewSourceRoot(loadedModel?.object3D);

  const preview = useMemo(() => {
    const root = cloneModelForPreview(sourceRoot);
    const bones = collectBonesFromRoot(root);
    const def = getProceduralDef(animationId);
    const clip = buildLibraryPreviewClip(animationId, bones, root);
    const mixer = new THREE.AnimationMixer(root);
    if (clip) {
      const action = mixer.clipAction(clip);
      const shouldLoop = forceLoop || def?.loop !== false;
      action.setLoop(shouldLoop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      action.clampWhenFinished = !shouldLoop;
      action.play();
    }
    return { root, mixer };
  }, [sourceRoot, animationId, forceLoop]);

  useEffect(() => {
    mixerRef.current = preview.mixer;
    return () => {
      preview.mixer.stopAllAction();
      preview.mixer.uncacheRoot(preview.mixer.getRoot());
      disposePreviewRoot(preview.root);
      mixerRef.current = null;
    };
  }, [preview]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return (
    <>
      <color attach="background" args={[background]} />
      <ambientLight intensity={lite ? 0.7 : 0.55} />
      <directionalLight position={[4, 6, 3]} intensity={lite ? 0.95 : 1.1} />
      {!lite && <directionalLight position={[-3, 2, -2]} intensity={0.35} />}
      <primitive object={preview.root} />
      <PreviewCamera root={preview.root} autoRotate={autoRotate} />
    </>
  );
}

export function AnimationPreviewCanvas({
  animationId,
  className,
  compact = false,
  forceLoop = false,
  autoRotate,
  active = true,
}: {
  animationId: ProceduralAnimationId;
  className?: string;
  compact?: boolean;
  forceLoop?: boolean;
  autoRotate?: boolean;
  active?: boolean;
}) {
  const dpr = useMemo(() => (compact ? [1, 1] as [number, number] : [1, 1.5] as [number, number]), [compact]);
  const rotate = autoRotate ?? !compact;
  const lite = compact;

  if (!active) return null;

  return (
    <div className={cn("h-full w-full", className)}>
      <Canvas
        key={animationId}
        dpr={dpr}
        frameloop="always"
        gl={{ antialias: !compact, powerPreference: compact ? "low-power" : "default" }}
        camera={{ fov: 42, near: 0.01, far: 100 }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={null}>
          <PreviewScene animationId={animationId} forceLoop={forceLoop} autoRotate={rotate} lite={lite} />
        </Suspense>
      </Canvas>
    </div>
  );
}
