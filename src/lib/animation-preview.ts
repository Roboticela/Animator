import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { collectSkeletonGroups } from "@/lib/bone-utils";
import { buildProceduralClip, getProceduralDef, type ProceduralAnimationId } from "@/lib/procedural";
import { buildSampleRig } from "@/lib/sample-rig";
import type { BoneInfo } from "@/types/model";

let defaultPreviewSource: THREE.Object3D | null = null;
let defaultPreviewBones: BoneInfo[] | null = null;

/** Cached sample rig used for library previews when no model is loaded in the app. */
export function getDefaultPreviewSource(): THREE.Object3D {
  if (!defaultPreviewSource) {
    defaultPreviewSource = buildSampleRig().object3D;
  }
  return defaultPreviewSource;
}

export function resetDefaultPreviewSource() {
  defaultPreviewSource = null;
  defaultPreviewBones = null;
}

export function getDefaultPreviewBones(): BoneInfo[] {
  if (!defaultPreviewBones) {
    defaultPreviewBones = collectSkeletonGroups(getDefaultPreviewSource()).flatMap((group) => group.bones);
  }
  return defaultPreviewBones;
}

/** Model in the viewport, or the built-in sample rig for library previews. */
export function getPreviewSourceRoot(loaded?: THREE.Object3D | null): THREE.Object3D {
  return loaded ?? getDefaultPreviewSource();
}

export function cloneModelForPreview(source: THREE.Object3D): THREE.Object3D {
  const clone = SkeletonUtils.clone(source);
  clone.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => m.clone());
    } else {
      mesh.material = mesh.material.clone();
    }
  });
  return clone;
}

export function collectBonesFromRoot(root: THREE.Object3D): BoneInfo[] {
  return collectSkeletonGroups(root).flatMap((group) => group.bones);
}

export function canPreviewLibraryAnimation(id: ProceduralAnimationId, bones: BoneInfo[], hasModel: boolean): boolean {
  if (!hasModel) return false;
  const def = getProceduralDef(id);
  if (!def) return false;
  const boneDriven = def.category === "locomotion" || def.category === "gesture" || def.category === "action";
  if (boneDriven && bones.length === 0) return false;
  return true;
}

export function buildLibraryPreviewClip(
  id: ProceduralAnimationId,
  bones: BoneInfo[],
  root: THREE.Object3D
): THREE.AnimationClip | null {
  return buildProceduralClip(id, bones, root);
}

export function frameObjectForCamera(object: THREE.Object3D, camera: THREE.Camera) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.35);
  const distance = maxDim * 2.1;

  camera.position.set(center.x + distance * 0.55, center.y + distance * 0.42, center.z + distance * 0.85);
  if ("lookAt" in camera && typeof camera.lookAt === "function") {
    camera.lookAt(center);
  }
  if ("updateProjectionMatrix" in camera && typeof camera.updateProjectionMatrix === "function") {
    camera.updateProjectionMatrix();
  }

  return center;
}

/** Releases GPU resources for a cloned preview rig (safe after unmounting from the scene). */
export function disposePreviewRoot(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      material?.dispose();
    }
  });
}
