import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
import { cloneFromLibraryPreviewCache, waitForLibraryPreviewCache } from "@/lib/library-preview-cache";
import { type ProceduralAnimationId } from "@/lib/procedural";
import { useViewportThemeColors } from "@/hooks/useViewportThemeColors";
import { yieldToMain } from "@/lib/yield-main";
import { cn } from "@/lib/utils";

interface PreviewSceneState {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  action: THREE.AnimationAction | null;
}

const LIBRARY_PREVIEW_FRAME_PADDING = 2.05;
const MAX_MIXER_DELTA = 1 / 30;

function PreviewGlCleanup() {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const onLost = (event: Event) => {
      event.preventDefault();
    };

    canvas.addEventListener("webglcontextlost", onLost);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.dispose();
    };
  }, [gl]);

  return null;
}

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
  onPlaybackLost,
}: {
  animationId: ProceduralAnimationId;
  forceLoop?: boolean;
  autoRotate?: boolean;
  lite?: boolean;
  framePadding?: number;
  onReady?: () => void;
  onPlaybackLost?: () => void;
}) {
  const { background } = useViewportThemeColors();
  const [preview, setPreview] = useState<PreviewSceneState | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const loopPreview = forceLoop || lite;
  const onReadyRef = useRef(onReady);
  const onPlaybackLostRef = useRef(onPlaybackLost);
  onReadyRef.current = onReady;
  onPlaybackLostRef.current = onPlaybackLost;

  useEffect(() => {
    let cancelled = false;
    let built: PreviewSceneState | null = null;

    const run = async () => {
      await yieldToMain();
      if (cancelled) return;

      await waitForLibraryPreviewCache();
      if (cancelled) return;

      const root = cloneFromLibraryPreviewCache();
      if (!root) return;

      const bones = collectBonesFromRoot(root);
      const clip = buildLibraryPreviewClip(animationId, bones, root);
      const mixer = new THREE.AnimationMixer(root);
      let action: THREE.AnimationAction | null = null;

      if (clip && clip.tracks.length > 0) {
        action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
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
  }, [animationId]);

  useFrame((state, delta) => {
    const mixer = mixerRef.current;
    const action = actionRef.current;
    if (!mixer) return;

    if (!state.gl.getContext().isContextLost()) {
      mixer.update(Math.min(delta, MAX_MIXER_DELTA));
    }

    if (!loopPreview || !action) return;

    const clip = action.getClip();
    if (clip.duration > 0 && action.time >= clip.duration) {
      action.time = action.time % clip.duration;
    }

    if (!action.isRunning() || action.paused) {
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
      action.play();
      return;
    }

    if (state.gl.getContext().isContextLost()) {
      onPlaybackLostRef.current?.();
    }
  });

  if (!preview) return null;

  return (
    <>
      <PreviewGlCleanup />
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
  onPlaybackLost,
}: {
  animationId: ProceduralAnimationId;
  className?: string;
  compact?: boolean;
  forceLoop?: boolean;
  autoRotate?: boolean;
  cacheReady?: boolean;
  onReady?: () => void;
  onPlaybackLost?: () => void;
}) {
  const rotate = autoRotate ?? !compact;
  const lite = compact;
  const framePadding = compact ? 2.15 : LIBRARY_PREVIEW_FRAME_PADDING;
  const [remountKey, setRemountKey] = useState(0);
  const recoveringRef = useRef(false);

  const handlePlaybackLost = useCallback(() => {
    if (recoveringRef.current) return;
    recoveringRef.current = true;
    onPlaybackLost?.();
    setRemountKey((key) => key + 1);
    window.setTimeout(() => {
      recoveringRef.current = false;
    }, 750);
  }, [onPlaybackLost]);

  const handlePlaybackLostRef = useRef(handlePlaybackLost);
  handlePlaybackLostRef.current = handlePlaybackLost;

  if (!cacheReady) return null;

  return (
    <div className={cn("h-full w-full", className)}>
      <Canvas
        key={`${animationId}-${remountKey}`}
        dpr={lite ? [1, 1] : [1, 1.5]}
        frameloop="always"
        gl={{
          antialias: !compact,
          powerPreference: "low-power",
          preserveDrawingBuffer: false,
        }}
        camera={{ fov: 45, near: 0.01, far: 1000 }}
        style={{ width: "100%", height: "100%", display: "block" }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          const onLost = (event: Event) => {
            event.preventDefault();
            handlePlaybackLostRef.current();
          };
          canvas.addEventListener("webglcontextlost", onLost);
        }}
      >
        <Suspense fallback={null}>
          <PreviewScene
            animationId={animationId}
            forceLoop={forceLoop}
            autoRotate={rotate}
            lite={lite}
            framePadding={framePadding}
            onReady={onReady}
            onPlaybackLost={handlePlaybackLost}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
