import { useModelStore } from "@/store/modelStore";
import { useViewportThemeColors } from "@/hooks/useViewportThemeColors";

function ShadowDirectionalLight({ intensity = 1.15 }: { intensity?: number }) {
  const showShadows = useModelStore((s) => s.showShadows);
  return (
    <directionalLight
      position={[6, 10, 6]}
      intensity={intensity}
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

/** Phong-friendly classic lighting — flat, studio, or bright outdoor-style rig. */
export function SceneLighting() {
  const lightingMode = useModelStore((s) => s.lightingMode);
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

  // HDR preset — stronger classic lights (materials use Phong, not PBR IBL).
  return (
    <>
      <ambientLight intensity={0.62} />
      <ShadowDirectionalLight intensity={1.45} />
      <directionalLight position={[-5, 4, -4]} intensity={0.5} />
      <directionalLight position={[2, 2, 6]} intensity={0.28} />
      <hemisphereLight args={[sky, ground, 0.48]} />
    </>
  );
}
