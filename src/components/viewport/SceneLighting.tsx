import { Environment } from "@react-three/drei";
import { useModelStore } from "@/store/modelStore";
import { useViewportThemeColors } from "@/hooks/useViewportThemeColors";
import type { HdrEnvironmentPreset } from "@/lib/viewport-lighting";

function ShadowDirectionalLight() {
  const showShadows = useModelStore((s) => s.showShadows);
  return (
    <directionalLight
      position={[6, 10, 6]}
      intensity={1.15}
      castShadow={showShadows}
      shadow-mapSize={[2048, 2048]}
      shadow-camera-far={40}
      shadow-camera-left={-12}
      shadow-camera-right={12}
      shadow-camera-top={12}
      shadow-camera-bottom={-12}
      shadow-bias={-0.0001}
      shadow-normalBias={0.04}
    />
  );
}

function HdrEnvironment({ preset }: { preset: HdrEnvironmentPreset }) {
  return (
    <Environment
      preset={preset}
      background={false}
      environmentIntensity={1.2}
      environmentRotation={[0, Math.PI * 0.12, 0]}
    />
  );
}

/** Flat, studio rig, or HDR image-based lighting for realistic PBR shading. */
export function SceneLighting() {
  const lightingMode = useModelStore((s) => s.lightingMode);
  const hdrEnvironment = useModelStore((s) => s.hdrEnvironment);
  const showShadows = useModelStore((s) => s.showShadows);
  const { sky, ground } = useViewportThemeColors();

  if (lightingMode === "flat") {
    return <ambientLight intensity={1.1} />;
  }

  if (lightingMode === "studio") {
    return (
      <>
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[4, 6, 4]}
          intensity={1.5}
          castShadow={showShadows}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
        />
        <directionalLight position={[-4, 3, -3]} intensity={0.35} />
        <hemisphereLight args={[sky, ground, 0.35]} />
      </>
    );
  }

  return (
    <>
      <HdrEnvironment preset={hdrEnvironment} />
      <ambientLight intensity={0.12} />
      <ShadowDirectionalLight />
      <directionalLight position={[-5, 3, -4]} intensity={0.22} />
      <hemisphereLight args={[sky, ground, 0.18]} />
    </>
  );
}
