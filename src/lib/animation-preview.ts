import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SkeletonUtils } from "three-stdlib";
import { matchBoneRoles, collectSkeletonGroups } from "@/lib/bone-utils";
import { buildProceduralClip, getProceduralDef, type ProceduralAnimationId } from "@/lib/procedural";
import { isBoneDrivenBase } from "@/lib/procedural/animation-requirements";
import { buildSampleRig } from "@/lib/sample-rig";
import { frameBoxOnCamera } from "@/lib/viewport-camera";
import type { BoneInfo } from "@/types/model";

const PREVIEW_ROOT_NAME = "__PreviewAnimRoot__";

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

/** Stable root + mesh names so root/opacity animation tracks bind on any model. */
export function preparePreviewRoot(root: THREE.Object3D): void {
  root.name = PREVIEW_ROOT_NAME;
  let meshIndex = 0;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (!mesh.name) {
      mesh.name = `__PreviewMesh_${meshIndex}`;
      meshIndex += 1;
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material) continue;
      material.transparent = true;
      material.needsUpdate = true;
    }
  });
}

export function collectBonesFromRoot(root: THREE.Object3D): BoneInfo[] {
  return collectSkeletonGroups(root).flatMap((group) => group.bones);
}

export function canPreviewLibraryAnimation(id: ProceduralAnimationId, bones: BoneInfo[]): boolean {
  const def = getProceduralDef(id);
  if (!def) return false;
  if (isBoneDrivenBase(def.baseId)) {
    if (bones.length === 0) return false;
    return Object.keys(matchBoneRoles(bones)).length > 0;
  }
  return true;
}

export function buildLibraryPreviewClip(
  id: ProceduralAnimationId,
  bones: BoneInfo[],
  root: THREE.Object3D
): THREE.AnimationClip | null {
  return buildProceduralClip(id, bones, root);
}

export function frameObjectForCamera(
  object: THREE.Object3D,
  camera: THREE.Camera,
  controls: OrbitControlsImpl | null = null,
  padding = 1.75
) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;

  frameBoxOnCamera(box, camera, controls, padding);
  return box.getCenter(new THREE.Vector3());
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
