import { create } from "zustand";
import * as THREE from "three";
import type { BoneInfo, MeshPartInfo, ModelData } from "@/types/model";
import { AnimationEngine } from "@/lib/animation-engine";
import {
  type BonePickModifiers,
  getOrderedBoneNames,
  mergeBoneSelection,
  resolvePickSelection,
} from "@/lib/bone-selection";
import { collectMeshParts, getOrderedMeshUuids, isSelectableMeshPart } from "@/lib/mesh-utils";
import {
  purgeAnimationTracksForBones,
  refreshModelStructure,
  removeArmatureFromScene,
  removeBonesFromScene,
  removeMeshPartsFromScene,
  setAllMeshPartsVisible,
  setMeshPartsVisible,
} from "@/lib/model-edit";

export type ViewportSelectionTarget = "bones" | "parts";

interface RestTransform {
  position: number[];
  quaternion: number[];
  scale: number[];
}

interface ModelState {
  model: ModelData | null;
  engine: AnimationEngine | null;
  boneMap: Map<string, BoneInfo>;
  meshParts: MeshPartInfo[];
  restPose: Map<string, RestTransform>;
  selectedBoneNames: string[];
  /** Anchor for Shift+click range selection. */
  selectionAnchorName: string | null;
  selectedMeshUuids: string[];
  meshSelectionAnchorUuid: string | null;
  viewportSelectionTarget: ViewportSelectionTarget;
  sceneRadius: number;
  wireframe: boolean;
  showSkeleton: boolean;
  showGrid: boolean;
  showLights: boolean;
  showShadows: boolean;
  showAxes: boolean;
  autoRotate: boolean;
  showMesh: boolean;
  orthographicCamera: boolean;
  flatShading: boolean;
  doubleSided: boolean;
  isolateSelection: boolean;
  showFps: boolean;
  frameCameraTick: number;
  frameSelectionTick: number;
  isLoading: boolean;
  loadingMessage: string | null;
  loadError: string | null;

  setLoading: (loading: boolean, message?: string | null) => void;
  setLoadError: (error: string | null) => void;
  loadModel: (data: ModelData) => void;
  clearModel: () => void;
  pickBone: (name: string | null, modifiers?: BonePickModifiers) => void;
  /** Replace selection with an explicit list (tree order preserved). */
  setSelectedBones: (names: string[]) => void;
  selectAllBones: () => void;
  invertBoneSelection: () => void;
  clearBoneSelection: () => void;
  pickMeshPart: (uuid: string | null, modifiers?: BonePickModifiers) => void;
  selectAllMeshParts: () => void;
  clearMeshSelection: () => void;
  setViewportSelectionTarget: (target: ViewportSelectionTarget) => void;
  clearActiveSelection: () => void;
  selectAllActive: () => void;
  toggleSelectedMeshVisibility: () => void;
  showAllMeshParts: () => void;
  removeSelectedMeshParts: () => void;
  removeSelectedBones: () => void;
  removeArmature: (groupId: string) => void;
  captureRestPose: () => void;
  centerModelOnGround: () => void;
  resetToRestPose: () => void;
  toggleWireframe: () => void;
  toggleSkeleton: () => void;
  toggleGrid: () => void;
  toggleLights: () => void;
  toggleShadows: () => void;
  toggleAxes: () => void;
  toggleAutoRotate: () => void;
  toggleShowMesh: () => void;
  toggleOrthographicCamera: () => void;
  toggleFlatShading: () => void;
  toggleDoubleSided: () => void;
  toggleIsolateSelection: () => void;
  toggleShowFps: () => void;
  requestFrameCamera: () => void;
  requestFrameSelection: () => void;
}

function buildBoneMap(skeletonGroups: ModelData["skeletonGroups"]): Map<string, BoneInfo> {
  const map = new Map<string, BoneInfo>();
  for (const group of skeletonGroups) {
    for (const info of group.bones) map.set(info.name, info);
  }
  return map;
}

function applyStructureRefresh(
  set: (partial: Partial<ModelState> | ((state: ModelState) => Partial<ModelState>)) => void,
  get: () => ModelState,
  removedBoneNames: string[] = []
) {
  const { model, restPose, selectedBoneNames, selectedMeshUuids } = get();
  if (!model) return;
  const { skeletonGroups, meshParts, stats, sceneRadius } = refreshModelStructure(model);
  const boneMap = buildBoneMap(skeletonGroups);
  const nextRest = new Map(restPose);
  removedBoneNames.forEach((name) => nextRest.delete(name));
  set({
    model: { ...model, skeletonGroups, stats },
    boneMap,
    meshParts,
    sceneRadius,
    restPose: nextRest,
    selectedBoneNames: selectedBoneNames.filter((n) => boneMap.has(n)),
    selectedMeshUuids: selectedMeshUuids.filter((u) => meshParts.some((p) => p.uuid === u)),
  });
}

function captureRest(boneMap: Map<string, BoneInfo>): Map<string, RestTransform> {
  const rest = new Map<string, RestTransform>();
  boneMap.forEach((info, name) => {
    rest.set(name, {
      position: info.bone.position.toArray(),
      quaternion: info.bone.quaternion.toArray() as number[],
      scale: info.bone.scale.toArray(),
    });
  });
  return rest;
}

export const useModelStore = create<ModelState>((set, get) => ({
  model: null,
  engine: null,
  boneMap: new Map(),
  meshParts: [],
  restPose: new Map(),
  selectedBoneNames: [],
  selectionAnchorName: null,
  selectedMeshUuids: [],
  meshSelectionAnchorUuid: null,
  viewportSelectionTarget: "bones",
  sceneRadius: 1,
  wireframe: false,
  showSkeleton: true,
  showGrid: true,
  showLights: true,
  showShadows: true,
  showAxes: false,
  autoRotate: false,
  showMesh: true,
  orthographicCamera: false,
  flatShading: false,
  doubleSided: false,
  isolateSelection: false,
  showFps: false,
  frameCameraTick: 0,
  frameSelectionTick: 0,
  isLoading: false,
  loadingMessage: null,
  loadError: null,

  setLoading: (loading, message = null) => set({ isLoading: loading, loadingMessage: message }),
  setLoadError: (error) => set({ loadError: error }),

  loadModel: (data) => {
    get().engine?.dispose();
    const meshParts = collectMeshParts(data.object3D);
    const boneMap = buildBoneMap(data.skeletonGroups);
    const restPose = captureRest(boneMap);
    const engine = new AnimationEngine(data.object3D);
    const box = new THREE.Box3().setFromObject(data.object3D);
    const sceneRadius = box.isEmpty() ? 1 : Math.max(box.getBoundingSphere(new THREE.Sphere()).radius, 0.05);
    set({
      model: data,
      boneMap,
      meshParts,
      restPose,
      engine,
      selectedBoneNames: [],
      selectionAnchorName: null,
      selectedMeshUuids: [],
      meshSelectionAnchorUuid: null,
      viewportSelectionTarget: "bones",
      sceneRadius,
      isLoading: false,
      loadingMessage: null,
      loadError: null,
    });
  },

  clearModel: () => {
    get().engine?.dispose();
    set({
      model: null,
      engine: null,
      boneMap: new Map(),
      meshParts: [],
      restPose: new Map(),
      selectedBoneNames: [],
      selectionAnchorName: null,
      selectedMeshUuids: [],
      meshSelectionAnchorUuid: null,
      viewportSelectionTarget: "bones",
      isLoading: false,
      loadingMessage: null,
    });
  },

  pickBone: (name, modifiers) => {
    if (name === null) {
      set({ selectedBoneNames: [], selectionAnchorName: null });
      return;
    }

    const { model, selectedBoneNames, selectionAnchorName } = get();
    if (!model) return;

    const ordered = getOrderedBoneNames(model);
    if (!ordered.includes(name)) return;

    const { selected, anchor } = resolvePickSelection(
      ordered,
      selectedBoneNames,
      selectionAnchorName ?? getPrimaryBoneName(selectedBoneNames),
      name,
      modifiers ?? {}
    );

    set({ selectedBoneNames: selected, selectionAnchorName: anchor });
  },

  setSelectedBones: (names) => {
    const { model } = get();
    if (!model) return;
    const ordered = getOrderedBoneNames(model);
    const selected = mergeBoneSelection(ordered, names);
    set({
      selectedBoneNames: selected,
      selectionAnchorName: selected.length > 0 ? selected[selected.length - 1]! : null,
    });
  },

  selectAllBones: () => {
    const { model } = get();
    if (!model) return;
    const ordered = getOrderedBoneNames(model);
    set({
      selectedBoneNames: ordered,
      selectionAnchorName: ordered[ordered.length - 1] ?? null,
    });
  },

  invertBoneSelection: () => {
    const { model, selectedBoneNames } = get();
    if (!model) return;
    const ordered = getOrderedBoneNames(model);
    const selected = new Set(selectedBoneNames);
    const inverted = ordered.filter((n) => !selected.has(n));
    set({
      selectedBoneNames: inverted,
      selectionAnchorName: inverted[inverted.length - 1] ?? null,
    });
  },

  clearBoneSelection: () => set({ selectedBoneNames: [], selectionAnchorName: null }),

  pickMeshPart: (uuid, modifiers) => {
    if (uuid === null) {
      set({ selectedMeshUuids: [], meshSelectionAnchorUuid: null });
      return;
    }
    const { meshParts, selectedMeshUuids, meshSelectionAnchorUuid } = get();
    const ordered = getOrderedMeshUuids(meshParts);
    if (!ordered.includes(uuid)) return;
    const anchor = meshSelectionAnchorUuid ?? selectedMeshUuids[selectedMeshUuids.length - 1] ?? null;
    const { selected, anchor: nextAnchor } = resolvePickSelection(
      ordered,
      selectedMeshUuids,
      anchor,
      uuid,
      modifiers ?? {}
    );
    set({ selectedMeshUuids: selected, meshSelectionAnchorUuid: nextAnchor });
  },

  selectAllMeshParts: () => {
    const { meshParts } = get();
    const ordered = getOrderedMeshUuids(meshParts);
    set({
      selectedMeshUuids: ordered,
      meshSelectionAnchorUuid: ordered[ordered.length - 1] ?? null,
    });
  },

  clearMeshSelection: () => set({ selectedMeshUuids: [], meshSelectionAnchorUuid: null }),

  setViewportSelectionTarget: (target) => set({ viewportSelectionTarget: target }),

  clearActiveSelection: () => {
    const { viewportSelectionTarget } = get();
    if (viewportSelectionTarget === "parts") {
      set({ selectedMeshUuids: [], meshSelectionAnchorUuid: null });
    } else {
      set({ selectedBoneNames: [], selectionAnchorName: null });
    }
  },

  selectAllActive: () => {
    const { viewportSelectionTarget } = get();
    if (viewportSelectionTarget === "parts") get().selectAllMeshParts();
    else get().selectAllBones();
  },

  toggleSelectedMeshVisibility: () => {
    const { meshParts, selectedMeshUuids } = get();
    if (selectedMeshUuids.length === 0) return;
    const selected = meshParts.filter((p) => selectedMeshUuids.includes(p.uuid));
    const anyVisible = selected.some((p) => p.mesh.visible);
    setMeshPartsVisible(meshParts, selectedMeshUuids, !anyVisible);
    set({ meshParts: [...meshParts] });
  },

  showAllMeshParts: () => {
    const { meshParts } = get();
    setAllMeshPartsVisible(meshParts, true);
    set({ meshParts: [...meshParts] });
  },

  removeSelectedMeshParts: () => {
    const { model, selectedMeshUuids } = get();
    if (!model || selectedMeshUuids.length === 0) return;
    removeMeshPartsFromScene(model, selectedMeshUuids);
    applyStructureRefresh(set, get);
    set({ selectedMeshUuids: [], meshSelectionAnchorUuid: null });
  },

  removeSelectedBones: () => {
    const { model, selectedBoneNames } = get();
    if (!model || selectedBoneNames.length === 0) return;
    const removedNames: string[] = [];
    for (const group of model.skeletonGroups) {
      const uuids = group.bones.filter((b) => selectedBoneNames.includes(b.name)).map((b) => b.uuid);
      if (uuids.length > 0) removedNames.push(...removeBonesFromScene(group, uuids));
    }
    if (removedNames.length === 0) return;
    purgeAnimationTracksForBones(removedNames);
    applyStructureRefresh(set, get, removedNames);
    set({ selectedBoneNames: [], selectionAnchorName: null });
  },

  removeArmature: (groupId) => {
    const { model } = get();
    if (!model) return;
    const group = model.skeletonGroups.find((g) => g.id === groupId);
    if (!group) return;
    const removedNames = removeArmatureFromScene(model, group);
    if (removedNames.length === 0) return;
    purgeAnimationTracksForBones(removedNames);
    applyStructureRefresh(set, get, removedNames);
    set({ selectedBoneNames: [], selectionAnchorName: null });
  },

  captureRestPose: () => set({ restPose: captureRest(get().boneMap) }),

  centerModelOnGround: () => {
    const { model } = get();
    if (!model) return;
    const box = new THREE.Box3().setFromObject(model.object3D);
    if (box.isEmpty()) return;
    model.object3D.position.y += -box.min.y;
  },

  resetToRestPose: () => {
    const { boneMap, restPose } = get();
    boneMap.forEach((info, name) => {
      const rest = restPose.get(name);
      if (!rest) return;
      info.bone.position.fromArray(rest.position);
      info.bone.quaternion.fromArray(rest.quaternion);
      info.bone.scale.fromArray(rest.scale);
    });
  },

  toggleWireframe: () => set((s) => ({ wireframe: !s.wireframe })),
  toggleSkeleton: () => set((s) => ({ showSkeleton: !s.showSkeleton })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleLights: () => set((s) => ({ showLights: !s.showLights })),
  toggleShadows: () => set((s) => ({ showShadows: !s.showShadows })),
  toggleAxes: () => set((s) => ({ showAxes: !s.showAxes })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  toggleShowMesh: () => set((s) => ({ showMesh: !s.showMesh })),
  toggleOrthographicCamera: () => set((s) => ({ orthographicCamera: !s.orthographicCamera })),
  toggleFlatShading: () => set((s) => ({ flatShading: !s.flatShading })),
  toggleDoubleSided: () => set((s) => ({ doubleSided: !s.doubleSided })),
  toggleIsolateSelection: () => set((s) => ({ isolateSelection: !s.isolateSelection })),
  toggleShowFps: () => set((s) => ({ showFps: !s.showFps })),
  requestFrameCamera: () => set((s) => ({ frameCameraTick: s.frameCameraTick + 1 })),
  requestFrameSelection: () => set((s) => ({ frameSelectionTick: s.frameSelectionTick + 1 })),
}));

/** Last selected bone — gizmo anchor and transform panel reference. */
export function getPrimaryBoneName(names: string[]): string | null {
  return names.length > 0 ? names[names.length - 1]! : null;
}

/** Click handler shared by bone tree and viewport skeleton. */
export function pickBoneFromClick(
  pickBone: ModelState["pickBone"],
  name: string,
  selectedBoneNames: string[],
  e: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }
) {
  const additive = Boolean(e.ctrlKey || e.metaKey);
  const range = Boolean(e.shiftKey);
  const isSelected = selectedBoneNames.includes(name);

  if (range || additive) {
    pickBone(name, { additive, range });
    return;
  }

  if (isSelected && selectedBoneNames.length === 1) {
    pickBone(null);
    return;
  }

  pickBone(name);
}

export function pickMeshPartFromClick(
  pickMeshPart: ModelState["pickMeshPart"],
  uuid: string,
  selectedMeshUuids: string[],
  e: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }
) {
  const additive = Boolean(e.ctrlKey || e.metaKey);
  const range = Boolean(e.shiftKey);
  const isSelected = selectedMeshUuids.includes(uuid);

  if (range || additive) {
    pickMeshPart(uuid, { additive, range });
    return;
  }

  if (isSelected && selectedMeshUuids.length === 1) {
    pickMeshPart(null);
    return;
  }

  pickMeshPart(uuid);
}
