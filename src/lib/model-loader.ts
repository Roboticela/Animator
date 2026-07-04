import * as THREE from "three";
import { FBXLoader, GLTFLoader, OBJLoader } from "three-stdlib";
import { collectSkeletonGroups, computeSceneStats } from "@/lib/bone-utils";
import { yieldToMain } from "@/lib/yield-main";
import type { ModelData, SourceExtension } from "@/types/model";

export class ModelLoadError extends Error {}

function extensionOf(fileName: string): SourceExtension | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "glb" || ext === "gltf" || ext === "fbx" || ext === "obj") return ext;
  return null;
}

function loadGltf(buffer: ArrayBuffer): Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.parse(
      buffer,
      "",
      (gltf) => resolve({ scene: gltf.scene as THREE.Group, animations: gltf.animations ?? [] }),
      (err) => reject(err instanceof Error ? err : new ModelLoadError(String(err)))
    );
  });
}

function parseFbx(buffer: ArrayBuffer): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const loader = new FBXLoader();
  const group = loader.parse(buffer, "");
  return { scene: group, animations: group.animations ?? [] };
}

function parseObj(buffer: ArrayBuffer): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const text = new TextDecoder().decode(buffer);
  const loader = new OBJLoader();
  const group = loader.parse(text);
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && !mesh.material) {
      mesh.material = new THREE.MeshStandardMaterial({ color: 0x9099a6, roughness: 0.7 });
    }
  });
  return { scene: group, animations: [] };
}

/** Loads a GLB/GLTF/FBX/OBJ buffer into ModelData. Yields to the main thread so the UI stays responsive. */
export async function loadModelFromBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  options?: { keepSourceBuffer?: boolean }
): Promise<ModelData> {
  await yieldToMain();

  const ext = extensionOf(fileName);
  if (!ext) {
    throw new ModelLoadError(`Unsupported file type: "${fileName}". Use .glb, .gltf, .fbx or .obj.`);
  }

  let scene: THREE.Group;
  let animations: THREE.AnimationClip[];

  try {
    if (ext === "glb" || ext === "gltf") {
      ({ scene, animations } = await loadGltf(buffer));
    } else if (ext === "fbx") {
      await yieldToMain();
      ({ scene, animations } = parseFbx(buffer));
      await yieldToMain();
    } else {
      await yieldToMain();
      ({ scene, animations } = parseObj(buffer));
      await yieldToMain();
    }
  } catch (err) {
    throw new ModelLoadError(
      `Failed to parse "${fileName}": ${err instanceof Error ? err.message : String(err)}`
    );
  }

  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  await yieldToMain();
  const skeletonGroups = collectSkeletonGroups(scene);
  await yieldToMain();
  const stats = computeSceneStats(scene);

  return {
    object3D: scene,
    skeletonGroups,
    embeddedClips: animations,
    stats,
    sourceName: fileName,
    sourceExt: ext,
    sourceBuffer: options?.keepSourceBuffer !== false ? buffer.slice(0) : undefined,
  };
}

export async function loadModelFromFile(file: File): Promise<ModelData> {
  await yieldToMain();
  const buffer = await file.arrayBuffer();
  return loadModelFromBuffer(buffer, file.name);
}
