import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { useModelStore } from "@/store/modelStore";
import { getEditMeshFromParts } from "@/lib/mesh-edit/operations";
import { buildMeshTopology } from "@/lib/mesh-edit/topology";
import { MeshEditOverlay } from "@/components/viewport/MeshEditOverlay";

export function MeshEditOverlayLayer() {
  const viewportSelectionTarget = useModelStore((s) => s.viewportSelectionTarget);
  const meshElementMode = useModelStore((s) => s.meshElementMode);
  const meshParts = useModelStore((s) => s.meshParts);
  const selectedMeshUuids = useModelStore((s) => s.selectedMeshUuids);
  const meshElementSelection = useModelStore((s) => s.meshElementSelection);
  const knifeCutStart = useModelStore((s) => s.knifeCutStart);
  const meshEditRevision = useModelStore((s) => s.meshEditRevision);
  const knifePreviewEnd = useModelStore((s) => s.knifePreviewEnd);

  const mesh = useMemo(
    () => getEditMeshFromParts(meshParts, selectedMeshUuids),
    [meshParts, selectedMeshUuids, meshEditRevision]
  );

  const topology = useMemo(() => (mesh ? buildMeshTopology(mesh) : null), [mesh, meshEditRevision]);

  const active =
    viewportSelectionTarget === "parts" && meshElementMode !== "object" && mesh && topology;

  if (!active) return null;

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
