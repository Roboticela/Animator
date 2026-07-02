import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useModelStore } from "@/store/modelStore";
import { getEditMeshFromParts } from "@/lib/mesh-edit/operations";
import { buildMeshTopology } from "@/lib/mesh-edit/topology";
import { pickMeshElementAtPoint } from "@/lib/mesh-edit/picking";

const PICK_THRESHOLD = 0.12;

export function handleMeshEditPointerDown(e: ThreeEvent<MouseEvent>, mesh: THREE.Mesh, camera: THREE.Camera) {
  const state = useModelStore.getState();
  if (state.viewportSelectionTarget !== "parts" || state.meshElementMode === "object") return false;

  const editMesh = getEditMeshFromParts(state.meshParts, state.selectedMeshUuids);
  if (!editMesh || editMesh.uuid !== mesh.uuid) return false;

  e.stopPropagation();

  const topology = buildMeshTopology(editMesh);
  const point = e.point;
  const additive = Boolean(e.nativeEvent.ctrlKey || e.nativeEvent.metaKey || e.nativeEvent.shiftKey);

  if (state.meshEditTool === "delete") {
    const hit = pickMeshElementAtPoint(editMesh, point, state.meshElementMode, topology, PICK_THRESHOLD, e.faceIndex ?? undefined);
    if (!hit) return true;
    state.toggleMeshElement({ vertex: hit.vertex, edge: hit.edge, face: hit.face }, additive);
    state.deleteSelectedMeshElements();
    return true;
  }

  if (state.meshEditTool === "knife") {
    if (!state.knifeCutStart) {
      state.setKnifeCutStart(point.clone());
      state.setKnifePreviewEnd(point.clone());
      return true;
    }
    const viewNormal = camera.getWorldDirection(new THREE.Vector3());
    state.applyKnifeCut(point.clone(), viewNormal);
    state.setKnifePreviewEnd(null);
    return true;
  }

  if (state.meshEditTool === "loopCut") {
    const hit = pickMeshElementAtPoint(editMesh, point, "edge", topology, PICK_THRESHOLD, e.faceIndex ?? undefined);
    if (!hit?.edge) return true;
    state.toggleMeshElement({ edge: hit.edge }, false);
    state.applyLoopCut();
    return true;
  }

  const hit = pickMeshElementAtPoint(editMesh, point, state.meshElementMode, topology, PICK_THRESHOLD, e.faceIndex ?? undefined);
  if (!hit) return true;
  state.toggleMeshElement({ vertex: hit.vertex, edge: hit.edge, face: hit.face }, additive);
  return true;
}

export function handleMeshEditPointerMove(e: ThreeEvent<PointerEvent>, mesh: THREE.Mesh) {
  const state = useModelStore.getState();
  if (state.meshEditTool !== "knife" || !state.knifeCutStart) return false;
  const editMesh = getEditMeshFromParts(state.meshParts, state.selectedMeshUuids);
  if (!editMesh || editMesh.uuid !== mesh.uuid) return false;
  state.setKnifePreviewEnd(e.point.clone());
  return true;
}
