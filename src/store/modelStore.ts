import { create } from "zustand";
import * as THREE from "three";
import type { BoneInfo, ModelData } from "@/types/model";
import { AnimationEngine } from "@/lib/animation-engine";

interface RestTransform {
  position: number[];
  quaternion: number[];
  scale: number[];
}

interface ModelState {
  model: ModelData | null;
  engine: AnimationEngine | null;
  boneMap: Map<string, BoneInfo>;
  restPose: Map<string, RestTransform>;
  selectedBoneName: string | null;
  sceneRadius: number;
  wireframe: boolean;
  showSkeleton: boolean;
  showGrid: boolean;
  isLoading: boolean;
  loadingMessage: string | null;
  loadError: string | null;

  setLoading: (loading: boolean, message?: string | null) => void;
  setLoadError: (error: string | null) => void;
  loadModel: (data: ModelData) => void;
  clearModel: () => void;
  selectBone: (name: string | null) => void;
  captureRestPose: () => void;
  resetToRestPose: () => void;
  toggleWireframe: () => void;
  toggleSkeleton: () => void;
  toggleGrid: () => void;
}

function buildBoneMap(model: ModelData): Map<string, BoneInfo> {
  const map = new Map<string, BoneInfo>();
  for (const group of model.skeletonGroups) {
    for (const info of group.bones) map.set(info.name, info);
  }
  return map;
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
  restPose: new Map(),
  selectedBoneName: null,
  sceneRadius: 1,
  wireframe: false,
  showSkeleton: true,
  showGrid: true,
  isLoading: false,
  loadingMessage: null,
  loadError: null,

  setLoading: (loading, message = null) => set({ isLoading: loading, loadingMessage: message }),
  setLoadError: (error) => set({ loadError: error }),

  loadModel: (data) => {
    get().engine?.dispose();
    const boneMap = buildBoneMap(data);
    const restPose = captureRest(boneMap);
    const engine = new AnimationEngine(data.object3D);
    const box = new THREE.Box3().setFromObject(data.object3D);
    const sceneRadius = box.isEmpty() ? 1 : Math.max(box.getBoundingSphere(new THREE.Sphere()).radius, 0.05);
    set({ model: data, boneMap, restPose, engine, selectedBoneName: null, sceneRadius, isLoading: false, loadingMessage: null, loadError: null });
  },

  clearModel: () => {
    get().engine?.dispose();
    set({ model: null, engine: null, boneMap: new Map(), restPose: new Map(), selectedBoneName: null, isLoading: false, loadingMessage: null });
  },

  selectBone: (name) => set({ selectedBoneName: name }),

  captureRestPose: () => set({ restPose: captureRest(get().boneMap) }),

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
}));
