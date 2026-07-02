import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { useModelStore } from "@/store/modelStore";
import { getEditMeshFromParts } from "@/lib/mesh-edit/operations";
import { readMeshTopology } from "@/lib/mesh-edit/topology";
import { MeshEditOverlay } from "@/components/viewport/MeshEditOverlay";

export function MeshEditOverlayLayer() {
  const viewportSelectionTarget = useModelStore((s) => s.viewportSelectionTarget);
  const meshElementMode = useModelStore((s) => s.meshElementMode);
  const meshParts = useModelStore((s) => s.meshParts);
  const selectedMeshUuids = useModelStore((s) => s.selectedMeshUuids);
  const meshElementSelection = useModelStore((s) => s.meshElementSelection);
  const meshEditRevision = useModelStore((s) => s.meshEditRevision);
  const knifeCutStart = useModelStore((s) => s.knifeCutStart);
  const knifePreviewEnd = useModelStore((s) => s.knifePreviewEnd);

  const active = viewportSelectionTarget === "parts" && meshElementMode !== "object";

  const mesh = useMemo(() => {
    if (!active) return null;
    return getEditMeshFromParts(meshParts, selectedMeshUuids);
  }, [active, meshParts, selectedMeshUuids]);

  const topology = useMemo(() => {
    if (!mesh) return null;
    return readMeshTopology(mesh);
  }, [mesh, meshEditRevision]);

  if (!active || !mesh || !topology) return null;

  return (
    <group>
      <MeshEditOverlay mesh={mesh} topology={topology} selection={meshElementSelection} />
      {knifeCutStart && knifePreviewEnd && (
        <Line
          points={[knifeCutStart, knifePreviewEnd]}
          color="#38bdf8"
          lineWidth={2}
          depthTest={false}
          transparent
        />
      )}
    </group>
  );
}
