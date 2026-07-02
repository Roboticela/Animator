import { useModelStore } from "@/store/modelStore";
import { useViewportThemeColors } from "@/hooks/useViewportThemeColors";

/** Scene lighting — studio rig when on, flat ambient when off. */
export function SceneLighting() {
  const showLights = useModelStore((s) => s.showLights);
  const showShadows = useModelStore((s) => s.showShadows);
  const { sky, ground } = useViewportThemeColors();

  if (!showLights) {
    return <ambientLight intensity={1.1} />;
  }

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
