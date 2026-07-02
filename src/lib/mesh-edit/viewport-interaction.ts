import * as THREE from "three";
import type { MeshElementMode, MeshEditTool } from "@/lib/mesh-edit/types";
import { findMeshPartFromHit, isSelectableMeshPart } from "@/lib/mesh-utils";
import { getEditMeshFromParts } from "@/lib/mesh-edit/operations";
import { pickMeshElementAtPoint } from "@/lib/mesh-edit/picking";
import { readMeshTopology } from "@/lib/mesh-edit/topology";
import { pickMeshPartFromClick, useModelStore } from "@/store/modelStore";

export interface MeshViewportHit {
  mesh: THREE.Mesh;
  point: THREE.Vector3;
  faceIndex?: number;
}

export interface MeshRaycastOptions {
  /** When set, only raycast this mesh (used during knife cuts). */
  preferredMesh?: THREE.Mesh | null;
  /** Use the exit hit (far side) instead of the entry hit — for knife end points. */
  useFarHit?: boolean;
}

function findHitMesh(object: THREE.Object3D): THREE.Mesh | null {
  let cur: THREE.Object3D | null = object;
  while (cur) {
    if ((cur as THREE.Mesh).isMesh) return cur as THREE.Mesh;
    cur = cur.parent;
  }
  return null;
}

function pickThreshold(mesh: THREE.Mesh, camera: THREE.Camera, point: THREE.Vector3) {
  const dist = camera.position.distanceTo(point);
  const scale = mesh.getWorldScale(new THREE.Vector3()).length() / Math.sqrt(3);
  return Math.max(0.015, dist * 0.025 * scale);
}

function intersectionToHit(mesh: THREE.Mesh, hit: THREE.Intersection): MeshViewportHit {
  return {
    mesh,
    point: hit.point.clone(),
    faceIndex: hit.faceIndex ?? undefined,
  };
}

function ensurePartSelected(hit: MeshViewportHit, nativeEvent: MouseEvent) {
  const state = useModelStore.getState();
  const selectableById = new Map(
    state.meshParts.filter(isSelectableMeshPart).map((p) => [p.id, p])
  );
  const part = findMeshPartFromHit(hit.mesh, hit.faceIndex, selectableById);
  if (!part) return null;

  const editMesh = getEditMeshFromParts(state.meshParts, state.selectedMeshUuids);
  if (!editMesh || editMesh.uuid !== hit.mesh.uuid) {
    pickMeshPartFromClick(
      state.pickMeshPart,
      part.id,
      state.selectedMeshUuids,
      nativeEvent
    );
  }
  return part;
}

function handleKnife(hit: MeshViewportHit, camera: THREE.Camera) {
  const state = useModelStore.getState();
  if (!state.knifeCutStart) {
    state.setKnifeCutStart(hit.point.clone());
    state.setKnifePreviewEnd(hit.point.clone());
    return true;
  }
  const viewNormal = camera.getWorldDirection(new THREE.Vector3());
  state.applyKnifeCut(hit.point.clone(), viewNormal);
  state.setKnifePreviewEnd(null);
  return true;
}

function handleElementEdit(
  hit: MeshViewportHit,
  nativeEvent: MouseEvent,
  camera: THREE.Camera,
  mode: MeshElementMode,
  tool: MeshEditTool
) {
  const state = useModelStore.getState();
  const editMesh = getEditMeshFromParts(state.meshParts, state.selectedMeshUuids);
  if (!editMesh || editMesh.uuid !== hit.mesh.uuid) return false;

  if (tool === "knife") return handleKnife(hit, camera);

  const topology = readMeshTopology(editMesh);
  if (!topology) return true;

  const threshold = pickThreshold(editMesh, camera, hit.point);
  const additive = Boolean(nativeEvent.ctrlKey || nativeEvent.metaKey || nativeEvent.shiftKey);

  if (tool === "loopCut") {
    const edgeHit = pickMeshElementAtPoint(editMesh, hit.point, "edge", topology, threshold, hit.faceIndex);
    if (!edgeHit?.edge) return true;
    state.setMeshElement({ edge: edgeHit.edge });
    state.applyLoopCut();
    return true;
  }

  if (tool === "separate") {
    if (mode !== "face") return true;
    const elementHit = pickMeshElementAtPoint(editMesh, hit.point, "face", topology, threshold, hit.faceIndex);
    if (elementHit?.face == null) return true;
    state.toggleMeshElement({ face: elementHit.face }, true);
    return true;
  }

  const elementHit = pickMeshElementAtPoint(editMesh, hit.point, mode, topology, threshold, hit.faceIndex);
  if (!elementHit) return true;

  if (tool === "delete") {
    state.setMeshElement({
      vertex: elementHit.vertex,
      edge: elementHit.edge,
      face: elementHit.face,
    });
    state.deleteSelectedMeshElements();
    return true;
  }

  state.toggleMeshElement(
    { vertex: elementHit.vertex, edge: elementHit.edge, face: elementHit.face },
    additive
  );
  return true;
}

function isMeshEditPointer(state: ReturnType<typeof useModelStore.getState>) {
  if (state.meshElementMode !== "object") return true;
  return state.meshEditTool === "knife" || state.meshEditTool === "loopCut";
}

/** Handle a raycast hit on mesh geometry in parts mode. Returns true if consumed. */
export function handleMeshViewportHit(hit: MeshViewportHit, nativeEvent: MouseEvent, camera: THREE.Camera): boolean {
  const state = useModelStore.getState();
  if (state.viewportSelectionTarget !== "parts") return false;

  if (state.meshElementMode === "object" && !isMeshEditPointer(state)) {
    const selectableById = new Map(
      state.meshParts.filter(isSelectableMeshPart).map((p) => [p.id, p])
    );
    const part = findMeshPartFromHit(hit.mesh, hit.faceIndex, selectableById);
    if (!part) return false;
    pickMeshPartFromClick(state.pickMeshPart, part.id, state.selectedMeshUuids, nativeEvent);
    return true;
  }

  if (!ensurePartSelected(hit, nativeEvent)) return false;
  return handleElementEdit(hit, nativeEvent, camera, state.meshElementMode, state.meshEditTool);
}

export function handleMeshViewportPointerMove(hit: MeshViewportHit | null): boolean {
  const state = useModelStore.getState();
  if (state.viewportSelectionTarget !== "parts") return false;
  if (state.meshEditTool !== "knife" || !state.knifeCutStart) return false;
  if (!hit) return false;

  const editMesh = getEditMeshFromParts(state.meshParts, state.selectedMeshUuids);
  if (!editMesh || editMesh.uuid !== hit.mesh.uuid) return false;

  state.setKnifePreviewEnd(hit.point.clone());
  return true;
}

export function raycastMeshes(
  root: THREE.Object3D,
  raycaster: THREE.Raycaster,
  options: MeshRaycastOptions = {}
): MeshViewportHit | null {
  const { preferredMesh, useFarHit } = options;

  if (preferredMesh) {
    const hits = raycaster.intersectObject(preferredMesh, false);
    if (hits.length === 0) return null;
    const hit = useFarHit ? hits[hits.length - 1]! : hits[0]!;
    return intersectionToHit(preferredMesh, hit);
  }

  const hits = raycaster.intersectObject(root, true);
  for (const hit of hits) {
    const mesh = findHitMesh(hit.object);
    if (!mesh || mesh.userData._partHidden === true || !mesh.visible) continue;
    return intersectionToHit(mesh, hit);
  }
  return null;
}

export function resolveMeshRaycastOptions(): MeshRaycastOptions {
  const state = useModelStore.getState();
  const editMesh = getEditMeshFromParts(state.meshParts, state.selectedMeshUuids);
  if (state.meshEditTool === "knife" && editMesh) {
    return { preferredMesh: editMesh, useFarHit: Boolean(state.knifeCutStart) };
  }
  return {};
}
