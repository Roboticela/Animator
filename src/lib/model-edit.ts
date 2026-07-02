import * as THREE from "three";
import type { BoneInfo, MeshPartInfo, ModelData, SkeletonGroup } from "@/types/model";
import { collectSkeletonGroups, computeSceneStats } from "@/lib/bone-utils";
import { collectMeshParts, isSelectableMeshPart } from "@/lib/mesh-utils";
import { removeBoneTrack } from "@/lib/clip-builder";
import { useAnimationStore } from "@/store/animationStore";
import { ensureEditableGeometry, invalidateMeshTopology } from "@/lib/mesh-edit/topology";

function disposeMesh(mesh: THREE.Mesh) {
  mesh.geometry?.dispose();
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  mats.forEach((m) => m?.dispose());
}

function removeObjectFromParent(obj: THREE.Object3D) {
  const mesh = obj as THREE.Mesh;
  if (mesh.isMesh) disposeMesh(mesh);
  obj.removeFromParent();
}

function collectBoneSubtree(root: BoneInfo, all: BoneInfo[]): BoneInfo[] {
  const children = all.filter((b) => b.parentUuid === root.uuid);
  return [root, ...children.flatMap((c) => collectBoneSubtree(c, all))];
}

export function purgeAnimationTracksForBones(boneNames: string[]) {
  if (boneNames.length === 0) return;
  const { clips, updateCustomClipData } = useAnimationStore.getState();
  for (const clip of clips) {
    if (!clip.editable) continue;
    updateCustomClipData(clip.id, (data) => {
      let next = data;
      for (const name of boneNames) next = removeBoneTrack(next, name);
      return next;
    });
  }
}

export function refreshModelStructure(model: ModelData) {
  const skeletonGroups = collectSkeletonGroups(model.object3D);
  const meshParts = collectMeshParts(model.object3D);
  const stats = computeSceneStats(model.object3D);
  const box = new THREE.Box3().setFromObject(model.object3D);
  const sceneRadius = box.isEmpty() ? 1 : Math.max(box.getBoundingSphere(new THREE.Sphere()).radius, 0.05);
  return { skeletonGroups, meshParts, stats, sceneRadius };
}

export function removeMeshPartsFromScene(model: ModelData, partIds: string[]): string[] {
  const want = new Set(partIds);
  const parts = collectMeshParts(model.object3D);
  const selectedParts = parts.filter((p) => want.has(p.id) && isSelectableMeshPart(p) && p.mesh);

  const meshesToRemoveWhole = new Set<string>();
  const primitiveRemovals = new Map<string, Set<number>>();

  for (const part of selectedParts) {
    const mesh = part.mesh!;
    if (part.kind === "primitive" && part.geometryGroupIndex != null) {
      if (meshesToRemoveWhole.has(mesh.uuid)) continue;
      const groups = primitiveRemovals.get(mesh.uuid) ?? new Set<number>();
      groups.add(part.geometryGroupIndex);
      primitiveRemovals.set(mesh.uuid, groups);
      continue;
    }
    meshesToRemoveWhole.add(mesh.uuid);
    primitiveRemovals.delete(mesh.uuid);
  }

  const removed: string[] = [];
  const meshByUuid = new Map<string, THREE.Mesh>();
  model.object3D.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) meshByUuid.set(mesh.uuid, mesh);
  });

  for (const [meshUuid, groupIndices] of primitiveRemovals) {
    if (meshesToRemoveWhole.has(meshUuid)) continue;
    const mesh = meshByUuid.get(meshUuid);
    if (!mesh) continue;

    const sorted = [...groupIndices].sort((a, b) => b - a);
    let meshEmpty = false;
    for (const groupIndex of sorted) {
      if (!removeGeometryGroup(mesh, groupIndex)) {
        meshEmpty = true;
        break;
      }
      removed.push(`${meshUuid}:g${groupIndex}`);
    }
    if (meshEmpty) meshesToRemoveWhole.add(meshUuid);
  }

  const targets: THREE.Object3D[] = [];
  model.object3D.traverse((obj) => {
    if (meshesToRemoveWhole.has(obj.uuid) && (obj as THREE.Mesh).isMesh) targets.push(obj);
  });
  targets.forEach((obj) => {
    removed.push(obj.uuid);
    removeObjectFromParent(obj);
  });
  return removed;
}

/** Remove one material/geometry group from a multi-group mesh. Returns false when the mesh becomes empty. */
function removeGeometryGroup(mesh: THREE.Mesh, groupIndex: number): boolean {
  const geometry = ensureEditableGeometry(mesh);
  const groups = [...(geometry.groups?.filter((g) => g.count > 0) ?? [])];
  if (groupIndex < 0 || groupIndex >= groups.length) return true;

  const index = geometry.getIndex();
  if (!index) return false;

  const group = groups[groupIndex]!;
  const removeStart = group.start;
  const removeCount = group.count;

  const newIndices: number[] = [];
  for (let i = 0; i < index.count; i++) {
    if (i >= removeStart && i < removeStart + removeCount) continue;
    newIndices.push(index.getX(i));
  }
  if (newIndices.length === 0) return false;

  geometry.setIndex(newIndices);
  geometry.groups = groups
    .filter((_, i) => i !== groupIndex)
    .map((g) => ({
      materialIndex: g.materialIndex,
      start: g.start > removeStart ? g.start - removeCount : g.start,
      count: g.count,
    }));

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  invalidateMeshTopology(mesh);
  return true;
}

export function removeBonesFromScene(group: SkeletonGroup, boneUuids: string[]): string[] {
  const uuidSet = new Set(boneUuids);
  const selected = group.bones.filter((b) => uuidSet.has(b.uuid));
  if (selected.length === 0) return [];

  const toRemove = new Set<string>();
  for (const bone of selected) {
    collectBoneSubtree(bone, group.bones).forEach((b) => toRemove.add(b.uuid));
  }

  const removedNames: string[] = [];
  const bonesToRemove = group.bones
    .filter((b) => toRemove.has(b.uuid))
    .sort((a, b) => b.depth - a.depth);

  for (const info of bonesToRemove) {
    removedNames.push(info.name);
    info.bone.removeFromParent();
  }

  return removedNames;
}

export function removeArmatureFromScene(_model: ModelData, group: SkeletonGroup): string[] {
  const rootBone = group.bones[0]?.bone;
  if (!rootBone) return [];

  const removedNames = group.bones.map((b) => b.name);
  const parent = rootBone.parent;

  if (parent && !(parent as THREE.Bone).isBone) {
    parent.removeFromParent();
    return removedNames;
  }

  const sorted = [...group.bones].sort((a, b) => b.depth - a.depth);
  for (const info of sorted) info.bone.removeFromParent();
  return removedNames;
}

function setPrimitiveVisible(mesh: THREE.Mesh, groupIndex: number, visible: boolean) {
  const hidden: Set<number> = mesh.userData._hiddenPrimitiveGroups ?? new Set();
  if (!visible) hidden.add(groupIndex);
  else hidden.delete(groupIndex);
  mesh.userData._hiddenPrimitiveGroups = hidden;

  const geom = mesh.geometry;
  const group = geom?.groups?.[groupIndex];
  if (!group) return;

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const material = materials[group.materialIndex ?? 0];
  if (material) material.visible = visible;
}

export function setMeshPartsVisible(parts: MeshPartInfo[], partIds: string[], visible: boolean) {
  const want = new Set(partIds);
  parts.forEach((p) => {
    if (!want.has(p.id) || !p.mesh) return;
    if (p.kind === "primitive" && p.geometryGroupIndex != null) {
      setPrimitiveVisible(p.mesh, p.geometryGroupIndex, visible);
      return;
    }
    p.mesh.userData._partHidden = !visible;
    p.mesh.visible = visible;
  });
}

export function setAllMeshPartsVisible(parts: MeshPartInfo[], visible: boolean) {
  parts.forEach((p) => {
    if (!p.mesh) return;
    if (p.kind === "primitive" && p.geometryGroupIndex != null) {
      setPrimitiveVisible(p.mesh, p.geometryGroupIndex, visible);
      return;
    }
    if (p.kind === "mesh") {
      p.mesh.userData._partHidden = !visible;
      p.mesh.visible = visible;
    }
  });
}
