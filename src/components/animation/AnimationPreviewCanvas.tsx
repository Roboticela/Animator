import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  buildLibraryPreviewClip,
  collectBonesFromRoot,
  disposePreviewRoot,
  frameObjectForCamera,
} from "@/lib/animation-preview";
import { cloneFromLibraryPreviewCache } from "@/lib/library-preview-cache";
import { getProceduralDef, type ProceduralAnimationId } from "@/lib/procedural";
import { useViewportThemeColors } from "@/hooks/useViewportThemeColors";
import { yieldToMain } from "@/lib/yield-main";
import { cn } from "@/lib/utils";

interface PreviewSceneState {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  action: THREE.AnimationAction | null;
}

const LIBRARY_PREVIEW_FRAME_PADDING = 2.05;

function PreviewCamera({
  root,
  autoRotate = true,
  framePadding = LIBRARY_PREVIEW_FRAME_PADDING,
}: {
  root: THREE.Object3D;
  autoRotate?: boolean;
  framePadding?: number;
}) {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [target, setTarget] = useState(() => new THREE.Vector3(0, 0.9, 0));

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = size.width / Math.max(size.height, 1);
      camera.updateProjectionMatrix();
    }

    const center = frameObjectForCamera(root, camera, controlsRef.current, framePadding);
    if (center) setTarget(center.clone());
  }, [root, camera, size.width, size.height, framePadding]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={target}
      enablePan={false}
      enableZoom={false}
      minDistance={0.1}
      maxDistance={500}
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
  framePadding,
  onReady,
}: {
  animationId: ProceduralAnimationId;
  forceLoop?: boolean;
  autoRotate?: boolean;
  lite?: boolean;
  framePadding?: number;
  onReady?: () => void;
}) {
  const { background } = useViewportThemeColors();
  const [preview, setPreview] = useState<PreviewSceneState | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const loopPreview = forceLoop || lite;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    let built: PreviewSceneState | null = null;

    const run = async () => {
      await yieldToMain();
      if (cancelled) return;

      const root = cloneFromLibraryPreviewCache();
      const bones = collectBonesFromRoot(root);
      const def = getProceduralDef(animationId);
      const clip = buildLibraryPreviewClip(animationId, bones, root);
      const mixer = new THREE.AnimationMixer(root);
      let action: THREE.AnimationAction | null = null;

      if (clip && clip.tracks.length > 0) {
        action = mixer.clipAction(clip);
        if (loopPreview) {
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.clampWhenFinished = false;
        } else {
          const shouldLoop = def?.loop !== false;
          action.setLoop(shouldLoop ? THREE.LoopRepeat : THREE.LoopOnce, shouldLoop ? Infinity : 1);
          action.clampWhenFinished = !shouldLoop;
        }
        action.enabled = true;
        action.play();
      }

      if (cancelled) {
        mixer.stopAllAction();
        disposePreviewRoot(root);
        return;
      }

      built = { root, mixer, action };
      mixerRef.current = mixer;
      actionRef.current = action;
      setPreview(built);
      onReadyRef.current?.();
    };

    void run();

    return () => {
      cancelled = true;
      if (built) {
        built.mixer.stopAllAction();
        disposePreviewRoot(built.root);
      }
      mixerRef.current = null;
      actionRef.current = null;
      setPreview(null);
    };
  }, [animationId, loopPreview]);

  useFrame((_, delta) => {
    const mixer = mixerRef.current;
    const action = actionRef.current;
    if (!mixer) return;

    mixer.update(delta);

    if (loopPreview && action && !action.isRunning()) {
      action.reset().play();
    }
  });

  if (!preview) return null;

  return (
    <>
      <color attach="background" args={[background]} />
      <ambientLight intensity={lite ? 0.7 : 0.55} />
      <directionalLight position={[4, 6, 3]} intensity={lite ? 0.95 : 1.1} />
      {!lite && <directionalLight position={[-3, 2, -2]} intensity={0.35} />}
      <primitive object={preview.root} />
      <PreviewCamera root={preview.root} autoRotate={autoRotate} framePadding={framePadding} />
    </>
  );
}

export function AnimationPreviewCanvas({
  animationId,
  className,
  compact = false,
  forceLoop = false,
  autoRotate,
  cacheReady = true,
  onReady,
}: {
  animationId: ProceduralAnimationId;
  className?: string;
  compact?: boolean;
  forceLoop?: boolean;
  autoRotate?: boolean;
  cacheReady?: boolean;
  onReady?: () => void;
}) {
  const rotate = autoRotate ?? !compact;
  const lite = compact;
  const framePadding = compact ? 2.15 : LIBRARY_PREVIEW_FRAME_PADDING;

  if (!cacheReady) return null;

  return (
    <div className={cn("h-full w-full", className)}>
      <Canvas
        key={animationId}
        dpr={lite ? [1, 1] : [1, 1.5]}
        frameloop="always"
        gl={{ antialias: !compact, powerPreference: compact ? "low-power" : "default" }}
        camera={{ fov: 45, near: 0.01, far: 1000 }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={null}>
          <PreviewScene
            animationId={animationId}
            forceLoop={forceLoop}
            autoRotate={rotate}
            lite={lite}
            framePadding={framePadding}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
