import { create } from "zustand";
import * as THREE from "three";
import type { BoneInfo, MeshPartInfo, ModelData } from "@/types/model";
import type { ReferenceKind, SceneReference } from "@/types/reference";
import { disposeReferenceRoot, nextReferenceId, tagReferenceHierarchy } from "@/lib/reference-import";
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
import {
  applyMaterialPreference,
  normalizeImportedMaterials,
  prepareMaterialsForEnvironment,
  snapshotMeshMaterials,
} from "@/lib/model-appearance";
import type { HdrEnvironmentPreset, ViewportLightingMode } from "@/lib/viewport-lighting";
import { nextLightingMode } from "@/lib/viewport-lighting";
import {
  applyColorToParts,
  applySceneMaterialToParts,
  applyTextureMapToParts,
  clearMaterialPreviewCache,
  findSceneMaterialById,
} from "@/lib/scene-materials";
import {
  assignTextureFileToMaterial,
  autoLoadTexturesFromFolder,
  clearMaterialTextureSlot as clearMaterialTextureSlotOnScene,
  fixMaterialTextureColorSpaces as fixMaterialTextureColorSpacesOnScene,
  linkTextureBetweenMaterials,
  repairSceneTextures,
  type TextureFolderLoadResult,
  type TextureSlot,
} from "@/lib/texture-maps";
import type { MeshEditTool, MeshElementMode, MeshElementSelection } from "@/lib/mesh-edit/types";
import { emptyMeshElementSelection } from "@/lib/mesh-edit/types";
import {
  deleteMeshEdges,
  deleteMeshFaces,
  deleteMeshVertices,
  getEditMeshFromParts,
  knifeCutMesh,
  loopCutMesh,
  separateMeshByFaceSelection,
} from "@/lib/mesh-edit/operations";

export type ViewportSelectionTarget = "bones" | "parts" | "references";

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
  hoveredBoneName: string | null;
  hoveredMeshPartId: string | null;
  hoveredReferenceId: string | null;
  references: SceneReference[];
  selectedReferenceIds: string[];
  referenceSelectionAnchorId: string | null;
  viewportSelectionTarget: ViewportSelectionTarget;
  meshElementMode: MeshElementMode;
  meshEditTool: MeshEditTool;
  meshElementSelection: MeshElementSelection | null;
  meshEditRevision: number;
  materialRevision: number;
  textureFolderName: string | null;
  lastTextureFolderLoad: TextureFolderLoadResult | null;
  textureFolderLoading: boolean;
  knifeCutStart: THREE.Vector3 | null;
  knifePreviewEnd: THREE.Vector3 | null;
  sceneRadius: number;
  wireframe: boolean;
  showSkeleton: boolean;
  showGrid: boolean;
  lightingMode: ViewportLightingMode;
  hdrEnvironment: HdrEnvironmentPreset;
  showShadows: boolean;
  showAxes: boolean;
  autoRotate: boolean;
  showMesh: boolean;
  /** When false, meshes render with flat neutral shading (geometry only). */
  showMaterials: boolean;
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
  /** Shown after importing FBX/OBJ/GLTF that needs external texture files. */
  textureFolderPromptOpen: boolean;

  setLoading: (loading: boolean, message?: string | null) => void;
  setLoadError: (error: string | null) => void;
  loadModel: (data: ModelData, options?: { openTexturePrompt?: boolean }) => void;
  closeTextureFolderPrompt: () => void;
  embedTexturesFromFolder: (files: File[]) => Promise<TextureFolderLoadResult>;
  clearModel: () => void;
  pickBone: (name: string | null, modifiers?: BonePickModifiers) => void;
  /** Replace selection with an explicit list (tree order preserved). */
  setSelectedBones: (names: string[]) => void;
  selectAllBones: () => void;
  invertBoneSelection: () => void;
  clearBoneSelection: () => void;
  pickMeshPart: (id: string | null, modifiers?: BonePickModifiers) => void;
  selectAllMeshParts: () => void;
  clearMeshSelection: () => void;
  setHoveredBone: (name: string | null) => void;
  setHoveredMeshPart: (id: string | null) => void;
  setHoveredReference: (id: string | null) => void;
  clearViewportHover: () => void;
  addReference: (payload: {
    root: THREE.Object3D;
    name: string;
    kind: ReferenceKind;
    sourceName?: string;
  }) => string;
  pickReference: (id: string | null, modifiers?: BonePickModifiers) => void;
  removeSelectedReferences: () => void;
  toggleSelectedReferenceVisibility: () => void;
  clearReferences: () => void;
  setViewportSelectionTarget: (target: ViewportSelectionTarget) => void;
  setMeshElementMode: (mode: MeshElementMode) => void;
  setMeshEditTool: (tool: MeshEditTool) => void;
  clearMeshElementSelection: () => void;
  setMeshElement: (payload: { vertex?: number; edge?: string; face?: number }) => void;
  toggleMeshElement: (payload: { vertex?: number; edge?: string; face?: number }, additive: boolean) => void;
  deleteSelectedMeshElements: () => void;
  separateSelectedMeshFaces: () => void;
  applyLoopCut: () => void;
  setKnifeCutStart: (point: THREE.Vector3 | null) => void;
  setKnifePreviewEnd: (point: THREE.Vector3 | null) => void;
  applyKnifeCut: (end: THREE.Vector3, viewNormal: THREE.Vector3) => void;
  bumpMeshEditRevision: () => void;
  bumpMaterialRevision: () => void;
  applyColorToSelectedParts: (options: import("@/lib/scene-materials").MaterialPaintOptions) => void;
  applySceneMaterialToSelectedParts: (materialId: string) => void;
  applyTextureToSelectedParts: (file: File, slot?: TextureSlot) => Promise<void>;
  assignTextureSlotToMaterial: (materialId: string, slot: TextureSlot, file: File) => Promise<void>;
  linkMaterialTexture: (targetMaterialId: string, sourceMaterialId: string, slot: TextureSlot) => void;
  clearMaterialTextureSlot: (materialId: string, slot: TextureSlot) => void;
  fixMaterialTextureColorSpaces: (materialId: string) => void;
  repairAllTextureColorSpaces: () => void;
  loadTexturesFromFolder: (files: File[]) => Promise<TextureFolderLoadResult>;
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
  cycleLightingMode: () => void;
  setLightingMode: (mode: ViewportLightingMode) => void;
  setHdrEnvironment: (preset: HdrEnvironmentPreset) => void;
  toggleShadows: () => void;
  toggleAxes: () => void;
  toggleAutoRotate: () => void;
  toggleShowMesh: () => void;
  setShowMaterials: (show: boolean) => void;
  toggleShowMaterials: () => void;
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
    selectedMeshUuids: selectedMeshUuids.filter((id) => meshParts.some((p) => p.id === id && isSelectableMeshPart(p))),
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
  hoveredBoneName: null,
  hoveredMeshPartId: null,
  hoveredReferenceId: null,
  references: [],
  selectedReferenceIds: [],
  referenceSelectionAnchorId: null,
  viewportSelectionTarget: "bones",
  meshElementMode: "object",
  meshEditTool: "select",
  meshElementSelection: null,
  meshEditRevision: 0,
  materialRevision: 0,
  textureFolderName: null,
  lastTextureFolderLoad: null,
  textureFolderLoading: false,
  knifeCutStart: null,
  knifePreviewEnd: null,
  sceneRadius: 1,
  wireframe: false,
  showSkeleton: true,
  showGrid: true,
  lightingMode: "hdr",
  hdrEnvironment: "warehouse",
  showShadows: true,
  showAxes: false,
  autoRotate: false,
  showMesh: true,
  showMaterials: true,
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
  textureFolderPromptOpen: false,

  setLoading: (loading, message = null) => set({ isLoading: loading, loadingMessage: message }),
  setLoadError: (error) => set({ loadError: error }),

  loadModel: (data, options) => {
    get().engine?.dispose();
    clearMaterialPreviewCache();
    normalizeImportedMaterials(data.object3D);
    repairSceneTextures(data.object3D);
    snapshotMeshMaterials(data.object3D);
    prepareMaterialsForEnvironment(data.object3D);
    applyMaterialPreference(data.object3D, get().showMaterials);
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
      hoveredBoneName: null,
      hoveredMeshPartId: null,
      viewportSelectionTarget: "bones",
      meshElementMode: "object",
      meshEditTool: "select",
      meshElementSelection: null,
      meshEditRevision: 0,
      materialRevision: 0,
      textureFolderName: null,
      lastTextureFolderLoad: null,
      textureFolderLoading: false,
      knifeCutStart: null,
      knifePreviewEnd: null,
      sceneRadius,
      isLoading: false,
      loadingMessage: null,
      loadError: null,
      textureFolderPromptOpen: Boolean(options?.openTexturePrompt),
    });
  },

  closeTextureFolderPrompt: () => set({ textureFolderPromptOpen: false }),

  clearModel: () => {
    get().engine?.dispose();
    clearMaterialPreviewCache();
    for (const ref of get().references) disposeReferenceRoot(ref.root);
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
      hoveredBoneName: null,
      hoveredMeshPartId: null,
      hoveredReferenceId: null,
      references: [],
      selectedReferenceIds: [],
      referenceSelectionAnchorId: null,
      viewportSelectionTarget: "bones",
      meshElementMode: "object",
      meshEditTool: "select",
      meshElementSelection: null,
      meshEditRevision: 0,
      materialRevision: 0,
      textureFolderName: null,
      lastTextureFolderLoad: null,
      textureFolderLoading: false,
      knifeCutStart: null,
      knifePreviewEnd: null,
      isLoading: false,
      loadingMessage: null,
      textureFolderPromptOpen: false,
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

  pickMeshPart: (id, modifiers) => {
    if (id === null) {
      set({ selectedMeshUuids: [], meshSelectionAnchorUuid: null });
      return;
    }
    const { meshParts, selectedMeshUuids, meshSelectionAnchorUuid } = get();
    const ordered = getOrderedMeshUuids(meshParts);
    if (!ordered.includes(id)) return;
    const anchor = meshSelectionAnchorUuid ?? selectedMeshUuids[selectedMeshUuids.length - 1] ?? null;
    const { selected, anchor: nextAnchor } = resolvePickSelection(
      ordered,
      selectedMeshUuids,
      anchor,
      id,
      modifiers ?? {}
    );
    const prevEditMesh = getEditMeshFromParts(meshParts, selectedMeshUuids);
    const nextEditMesh = getEditMeshFromParts(meshParts, selected);
    const clearElements =
      !prevEditMesh || !nextEditMesh || prevEditMesh.uuid !== nextEditMesh.uuid;
    set({
      selectedMeshUuids: selected,
      meshSelectionAnchorUuid: nextAnchor,
      ...(clearElements ? { meshElementSelection: null } : {}),
    });
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

  setHoveredBone: (name) => set({ hoveredBoneName: name, hoveredMeshPartId: null, hoveredReferenceId: null }),
  setHoveredMeshPart: (id) => set({ hoveredMeshPartId: id, hoveredBoneName: null, hoveredReferenceId: null }),
  setHoveredReference: (id) => set({ hoveredReferenceId: id, hoveredBoneName: null, hoveredMeshPartId: null }),
  clearViewportHover: () => set({ hoveredBoneName: null, hoveredMeshPartId: null, hoveredReferenceId: null }),

  addReference: (payload) => {
    const id = nextReferenceId();
    tagReferenceHierarchy(payload.root, id);
    const entry: SceneReference = {
      id,
      name: payload.name,
      kind: payload.kind,
      root: payload.root,
      visible: true,
      sourceName: payload.sourceName,
    };
    set((state) => ({
      references: [...state.references, entry],
      selectedReferenceIds: [id],
      referenceSelectionAnchorId: id,
      viewportSelectionTarget: "references",
      isLoading: false,
      loadingMessage: null,
    }));
    return id;
  },

  pickReference: (id, modifiers) => {
    if (id === null) {
      set({ selectedReferenceIds: [], referenceSelectionAnchorId: null });
      return;
    }

    const { references, selectedReferenceIds, referenceSelectionAnchorId } = get();
    const ordered = references.map((ref) => ref.id);
    if (!ordered.includes(id)) return;

    const { selected, anchor } = resolvePickSelection(
      ordered,
      selectedReferenceIds,
      referenceSelectionAnchorId ?? getPrimaryReferenceId(selectedReferenceIds),
      id,
      modifiers ?? {}
    );

    set({
      selectedReferenceIds: selected,
      referenceSelectionAnchorId: anchor,
      viewportSelectionTarget: "references",
    });
  },

  removeSelectedReferences: () => {
    const { references, selectedReferenceIds } = get();
    if (selectedReferenceIds.length === 0) return;
    const removeSet = new Set(selectedReferenceIds);
    for (const ref of references) {
      if (removeSet.has(ref.id)) disposeReferenceRoot(ref.root);
    }
    set({
      references: references.filter((ref) => !removeSet.has(ref.id)),
      selectedReferenceIds: [],
      referenceSelectionAnchorId: null,
      hoveredReferenceId: null,
    });
  },

  toggleSelectedReferenceVisibility: () => {
    const { references, selectedReferenceIds } = get();
    if (selectedReferenceIds.length === 0) return;
    const selected = references.filter((ref) => selectedReferenceIds.includes(ref.id));
    const anyVisible = selected.some((ref) => ref.visible);
    const nextVisible = !anyVisible;
    set({
      references: references.map((ref) => {
        if (!selectedReferenceIds.includes(ref.id)) return ref;
        ref.root.visible = nextVisible;
        return { ...ref, visible: nextVisible };
      }),
    });
  },

  clearReferences: () => {
    for (const ref of get().references) disposeReferenceRoot(ref.root);
    set({
      references: [],
      selectedReferenceIds: [],
      referenceSelectionAnchorId: null,
      hoveredReferenceId: null,
    });
  },

  setViewportSelectionTarget: (target) =>
    set({
      viewportSelectionTarget: target,
      meshElementSelection: null,
      knifeCutStart: null,
    }),

  setMeshElementMode: (mode) =>
    set({
      meshElementMode: mode,
      meshElementSelection: null,
      meshEditTool: mode === "object" ? get().meshEditTool : "select",
      knifeCutStart: null,
    }),

  setMeshEditTool: (tool) => set({ meshEditTool: tool, knifeCutStart: null }),

  clearMeshElementSelection: () => set({ meshElementSelection: null }),

  setMeshElement: (payload) => {
    const { meshParts, selectedMeshUuids } = get();
    const mesh = getEditMeshFromParts(meshParts, selectedMeshUuids);
    if (!mesh) return;
    set({
      meshElementSelection: {
        meshUuid: mesh.uuid,
        vertices: payload.vertex != null ? [payload.vertex] : [],
        edges: payload.edge != null ? [payload.edge] : [],
        faces: payload.face != null ? [payload.face] : [],
      },
    });
  },

  toggleMeshElement: (payload, additive) => {
    const { meshParts, selectedMeshUuids } = get();
    const mesh = getEditMeshFromParts(meshParts, selectedMeshUuids);
    if (!mesh) return;

    const current =
      get().meshElementSelection?.meshUuid === mesh.uuid
        ? get().meshElementSelection!
        : emptyMeshElementSelection(mesh.uuid);

    const next = { ...current, vertices: [...current.vertices], edges: [...current.edges], faces: [...current.faces] };

    const toggleIn = <T,>(list: T[], value: T) => {
      const idx = list.indexOf(value);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(value);
    };

    if (payload.vertex != null) {
      if (!additive) {
        next.vertices = [payload.vertex];
        next.edges = [];
        next.faces = [];
      } else toggleIn(next.vertices, payload.vertex);
    }
    if (payload.edge != null) {
      if (!additive) {
        next.edges = [payload.edge];
        next.vertices = [];
        next.faces = [];
      } else toggleIn(next.edges, payload.edge);
    }
    if (payload.face != null) {
      if (!additive) {
        next.faces = [payload.face];
        next.vertices = [];
        next.edges = [];
      } else toggleIn(next.faces, payload.face);
    }

    set({ meshElementSelection: next });
  },

  deleteSelectedMeshElements: () => {
    const { meshParts, selectedMeshUuids, meshElementSelection, meshElementMode } = get();
    const mesh = getEditMeshFromParts(meshParts, selectedMeshUuids);
    if (!mesh || !meshElementSelection || meshElementSelection.meshUuid !== mesh.uuid) return;

    if (meshElementMode === "face" && meshElementSelection.faces.length > 0) {
      deleteMeshFaces(mesh, meshElementSelection.faces);
    } else if (meshElementMode === "vertex" && meshElementSelection.vertices.length > 0) {
      deleteMeshVertices(mesh, meshElementSelection.vertices);
    } else if (meshElementMode === "edge" && meshElementSelection.edges.length > 0) {
      deleteMeshEdges(mesh, meshElementSelection.edges);
    } else return;

    applyStructureRefresh(set, get);
    set({
      meshElementSelection: emptyMeshElementSelection(mesh.uuid),
      meshEditRevision: get().meshEditRevision + 1,
    });
  },

  separateSelectedMeshFaces: () => {
    const { meshParts, selectedMeshUuids, meshElementSelection, meshElementMode } = get();
    const mesh = getEditMeshFromParts(meshParts, selectedMeshUuids);
    if (!mesh || meshElementMode !== "face" || !meshElementSelection || meshElementSelection.meshUuid !== mesh.uuid) {
      return;
    }
    if (meshElementSelection.faces.length === 0) return;
    const separated = separateMeshByFaceSelection(mesh, meshElementSelection.faces);
    if (!separated) return;
    applyStructureRefresh(set, get);
    set({
      meshElementSelection: null,
      meshEditRevision: get().meshEditRevision + 1,
    });
  },

  applyLoopCut: () => {
    const { meshParts, selectedMeshUuids, meshElementSelection } = get();
    const mesh = getEditMeshFromParts(meshParts, selectedMeshUuids);
    if (!mesh) return;
    const seed = meshElementSelection?.edges[0];
    if (!seed) return;
    loopCutMesh(mesh, seed);
    applyStructureRefresh(set, get);
    set({
      meshElementSelection: emptyMeshElementSelection(mesh.uuid),
      meshEditRevision: get().meshEditRevision + 1,
    });
  },

  setKnifeCutStart: (point) => set({ knifeCutStart: point }),

  setKnifePreviewEnd: (point) => set({ knifePreviewEnd: point }),

  applyKnifeCut: (end, viewNormal) => {
    const { meshParts, selectedMeshUuids, knifeCutStart } = get();
    const mesh = getEditMeshFromParts(meshParts, selectedMeshUuids);
    if (!mesh || !knifeCutStart) return;
    knifeCutMesh(mesh, knifeCutStart, end, viewNormal);
    applyStructureRefresh(set, get);
    set({
      knifeCutStart: null,
      knifePreviewEnd: null,
      meshElementSelection: emptyMeshElementSelection(mesh.uuid),
      meshEditRevision: get().meshEditRevision + 1,
    });
  },

  bumpMeshEditRevision: () => set((s) => ({ meshEditRevision: s.meshEditRevision + 1 })),

  bumpMaterialRevision: () => set((s) => ({ materialRevision: s.materialRevision + 1 })),

  applyColorToSelectedParts: (options) => {
    const { model, meshParts, selectedMeshUuids, showMaterials } = get();
    if (!model) return;
    const parts = meshParts.filter((p) => selectedMeshUuids.includes(p.id));
    if (parts.length === 0) return;
    if (!showMaterials) get().setShowMaterials(true);
    applyColorToParts(parts, options);
    get().bumpMaterialRevision();
  },

  applySceneMaterialToSelectedParts: (materialId) => {
    const { model, meshParts, selectedMeshUuids, showMaterials } = get();
    if (!model) return;
    const source = findSceneMaterialById(model.object3D, materialId);
    if (!source) return;
    const parts = meshParts.filter((p) => selectedMeshUuids.includes(p.id));
    if (parts.length === 0) return;
    if (!showMaterials) get().setShowMaterials(true);
    applySceneMaterialToParts(parts, source);
    get().bumpMaterialRevision();
  },

  applyTextureToSelectedParts: async (file, slot = "map") => {
    const { model, meshParts, selectedMeshUuids, showMaterials } = get();
    if (!model) return;
    const parts = meshParts.filter((p) => selectedMeshUuids.includes(p.id));
    if (parts.length === 0) return;
    if (!showMaterials) get().setShowMaterials(true);
    await applyTextureMapToParts(parts, file, slot);
    get().bumpMaterialRevision();
  },

  assignTextureSlotToMaterial: async (materialId, slot, file) => {
    const { model, showMaterials } = get();
    if (!model) return;
    if (!showMaterials) get().setShowMaterials(true);
    await assignTextureFileToMaterial(model.object3D, materialId, slot, file);
    get().bumpMaterialRevision();
  },

  linkMaterialTexture: (targetMaterialId, sourceMaterialId, slot) => {
    const { model, showMaterials } = get();
    if (!model) return;
    if (!showMaterials) get().setShowMaterials(true);
    linkTextureBetweenMaterials(model.object3D, targetMaterialId, sourceMaterialId, slot);
    get().bumpMaterialRevision();
  },

  clearMaterialTextureSlot: (materialId, slot) => {
    const { model } = get();
    if (!model) return;
    clearMaterialTextureSlotOnScene(model.object3D, materialId, slot);
    get().bumpMaterialRevision();
  },

  fixMaterialTextureColorSpaces: (materialId) => {
    const { model } = get();
    if (!model) return;
    fixMaterialTextureColorSpacesOnScene(model.object3D, materialId);
    get().bumpMaterialRevision();
  },

  repairAllTextureColorSpaces: () => {
    const { model } = get();
    if (!model) return;
    repairSceneTextures(model.object3D);
    get().bumpMaterialRevision();
  },

  loadTexturesFromFolder: async (files) => {
    const { model, showMaterials } = get();
    const empty: TextureFolderLoadResult = {
      folderName: null,
      fileCount: 0,
      matched: 0,
      skipped: 0,
      failed: 0,
      unmatched: [],
    };
    if (!model || files.length === 0) return empty;
    if (!showMaterials) get().setShowMaterials(true);
    set({ textureFolderLoading: true });
    get().setLoading(true, "Scanning texture folder…");
    try {
      const result = await autoLoadTexturesFromFolder(model.object3D, files, (message) => {
        get().setLoading(true, message);
      });
      if (result.matched > 0) {
        set((state) => ({
          model: state.model
            ? {
                ...state.model,
                texturesEmbedded: true,
                sourceBuffer: undefined,
              }
            : null,
        }));
      }
      set({
        textureFolderName: result.folderName,
        lastTextureFolderLoad: result,
      });
      get().bumpMaterialRevision();
      return result;
    } finally {
      set({ textureFolderLoading: false });
      get().setLoading(false);
    }
  },

  embedTexturesFromFolder: async (files) => {
    const result = await get().loadTexturesFromFolder(files);
    if (result.matched > 0) {
      set({ textureFolderPromptOpen: false });
    }
    return result;
  },

  clearActiveSelection: () => {
    const { viewportSelectionTarget } = get();
    if (viewportSelectionTarget === "parts") {
      set({
        selectedMeshUuids: [],
        meshSelectionAnchorUuid: null,
        meshElementSelection: null,
        knifeCutStart: null,
        knifePreviewEnd: null,
      });
    } else if (viewportSelectionTarget === "references") {
      set({ selectedReferenceIds: [], referenceSelectionAnchorId: null });
    } else {
      set({ selectedBoneNames: [], selectionAnchorName: null });
    }
  },

  selectAllActive: () => {
    const { viewportSelectionTarget, references } = get();
    if (viewportSelectionTarget === "parts") get().selectAllMeshParts();
    else if (viewportSelectionTarget === "references") {
      const ids = references.map((ref) => ref.id);
      set({
        selectedReferenceIds: ids,
        referenceSelectionAnchorId: ids[ids.length - 1] ?? null,
      });
    } else get().selectAllBones();
  },

  toggleSelectedMeshVisibility: () => {
    const { meshParts, selectedMeshUuids } = get();
    if (selectedMeshUuids.length === 0) return;
    const selected = meshParts.filter((p) => selectedMeshUuids.includes(p.id) && p.mesh);
    const anyVisible = selected.some((p) => {
      if (!p.mesh) return false;
      if (p.kind === "primitive" && p.geometryGroupIndex != null) {
        const group = p.mesh.geometry?.groups?.[p.geometryGroupIndex];
        const materials = Array.isArray(p.mesh.material) ? p.mesh.material : [p.mesh.material];
        const material = group ? materials[group.materialIndex ?? 0] : null;
        return material ? material.visible !== false : p.mesh.visible;
      }
      return p.mesh.visible;
    });
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
  cycleLightingMode: () => set((s) => ({ lightingMode: nextLightingMode(s.lightingMode) })),
  setLightingMode: (mode) => set({ lightingMode: mode }),
  setHdrEnvironment: (preset) => set({ hdrEnvironment: preset, lightingMode: "hdr" }),
  toggleShadows: () => set((s) => ({ showShadows: !s.showShadows })),
  toggleAxes: () => set((s) => ({ showAxes: !s.showAxes })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  toggleShowMesh: () => set((s) => ({ showMesh: !s.showMesh })),

  setShowMaterials: (show) => {
    const { model } = get();
    if (model) applyMaterialPreference(model.object3D, show);
    set({ showMaterials: show });
  },

  toggleShowMaterials: () => {
    const next = !get().showMaterials;
    get().setShowMaterials(next);
  },

  toggleOrthographicCamera: () => set((s) => ({ orthographicCamera: !s.orthographicCamera })),
  toggleFlatShading: () => set((s) => ({ flatShading: !s.flatShading })),
  toggleDoubleSided: () => set((s) => ({ doubleSided: !s.doubleSided })),
  toggleIsolateSelection: () => set((s) => ({ isolateSelection: !s.isolateSelection })),
  toggleShowFps: () => set((s) => ({ showFps: !s.showFps })),
  requestFrameCamera: () => set((s) => ({ frameCameraTick: s.frameCameraTick + 1 })),
  requestFrameSelection: () => set((s) => ({ frameSelectionTick: s.frameSelectionTick + 1 })),
}));

/** Last selected mesh part — gizmo anchor and mesh edit target. */
export function getPrimaryMeshPartId(ids: string[]): string | null {
  return ids.length > 0 ? ids[ids.length - 1]! : null;
}

/** Last selected reference — gizmo anchor. */
export function getPrimaryReferenceId(ids: string[]): string | null {
  return ids.length > 0 ? ids[ids.length - 1]! : null;
}

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
  id: string,
  selectedMeshUuids: string[],
  e: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }
) {
  const additive = Boolean(e.ctrlKey || e.metaKey);
  const range = Boolean(e.shiftKey);
  const isSelected = selectedMeshUuids.includes(id);

  if (range || additive) {
    pickMeshPart(id, { additive, range });
    return;
  }

  if (isSelected && selectedMeshUuids.length === 1) {
    pickMeshPart(null);
    return;
  }

  pickMeshPart(id);
}

export function pickReferenceFromClick(
  pickReference: ModelState["pickReference"],
  id: string,
  selectedReferenceIds: string[],
  e: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }
) {
  const additive = Boolean(e.ctrlKey || e.metaKey);
  const range = Boolean(e.shiftKey);
  const isSelected = selectedReferenceIds.includes(id);

  if (range || additive) {
    pickReference(id, { additive, range });
    return;
  }

  if (isSelected && selectedReferenceIds.length === 1) {
    pickReference(null);
    return;
  }

  pickReference(id);
}
