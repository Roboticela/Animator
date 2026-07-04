import * as THREE from "three";
import type { ModelData } from "@/types/model";
import { REFERENCE_ID_KEY, type ReferenceKind } from "@/types/reference";
import { loadModelFromBuffer } from "@/lib/model-loader";
import { buildHtmlTo3dMesh, type HtmlTo3dSource } from "@/lib/html-to-3d";
import {
  applyMaterialPreference,
  normalizeImportedMaterials,
  prepareMaterialsForEnvironment,
} from "@/lib/model-appearance";
import { repairSceneTextures } from "@/lib/texture-maps";
import { computeSceneStats } from "@/lib/bone-utils";
import { useModelStore } from "@/store/modelStore";

let referenceIdCounter = 0;

export function nextReferenceId(): string {
  referenceIdCounter += 1;
  return `ref-${referenceIdCounter}`;
}

export function tagReferenceHierarchy(root: THREE.Object3D, id: string) {
  root.userData[REFERENCE_ID_KEY] = id;
  root.traverse((obj) => {
    obj.userData[REFERENCE_ID_KEY] = id;
  });
}

export function referenceIdFromObject(obj: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = obj;
  while (current) {
    const id = current.userData[REFERENCE_ID_KEY];
    if (typeof id === "string") return id;
    current = current.parent;
  }
  return null;
}

export function disposeReferenceRoot(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material)) {
        if (value && typeof value === "object" && "isTexture" in value && (value as THREE.Texture).isTexture) {
          (value as THREE.Texture).dispose();
        }
      }
      material.dispose();
    }
  });
  root.parent?.remove(root);
}

/** Creates an empty scene model for reference-only workspaces. */
export function createEmptySceneModel(): ModelData {
  const root = new THREE.Group();
  root.name = "Scene";
  return {
    object3D: root,
    skeletonGroups: [],
    embeddedClips: [],
    stats: computeSceneStats(root),
    sourceName: "Scene",
    sourceExt: "glb",
  };
}

export interface BuiltReference {
  root: THREE.Group;
  name: string;
  kind: ReferenceKind;
  sourceName?: string;
}

function prepareReferenceObject3D(object3D: THREE.Object3D) {
  normalizeImportedMaterials(object3D);
  repairSceneTextures(object3D);
  prepareMaterialsForEnvironment(object3D);
  applyMaterialPreference(object3D, useModelStore.getState().showMaterials);
}

export async function buildReferenceFromModelBuffer(
  buffer: ArrayBuffer,
  fileName: string
): Promise<BuiltReference> {
  const data = await loadModelFromBuffer(buffer, fileName, { keepSourceBuffer: false });
  prepareReferenceObject3D(data.object3D);

  const root = new THREE.Group();
  root.name = data.sourceName;
  root.add(data.object3D);

  return {
    root,
    name: data.sourceName,
    kind: "model",
    sourceName: fileName,
  };
}

export async function buildReferenceFromHtml(source: HtmlTo3dSource): Promise<BuiltReference> {
  const { mesh } = await buildHtmlTo3dMesh(source);
  const planeHeight =
    mesh.geometry instanceof THREE.PlaneGeometry
      ? mesh.geometry.parameters.height
      : source.planeWidth / (source.width / Math.max(source.height, 1));
  mesh.position.y = planeHeight * 0.5;

  const root = new THREE.Group();
  root.name = source.name?.trim() || "HTML Reference";
  root.add(mesh);

  return {
    root,
    name: root.name,
    kind: "html",
  };
}
