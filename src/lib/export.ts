import * as THREE from "three";
import { GLTFExporter } from "three-stdlib";
import { saveBytes } from "@/lib/tauri";

/** Ensures skinned meshes and skeletons are up to date before GLB export. */
export function prepareModelForExport(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    const skinned = obj as THREE.SkinnedMesh;
    if (skinned.isSkinnedMesh && skinned.skeleton) {
      skinned.skeleton.update();
      skinned.updateMatrixWorld(true);
    }
  });
}

/**
 * Exports a scene + a set of animation clips as a single binary .glb.
 * Output is always .glb regardless of the original import format — three.js
 * has no reliable FBX exporter, so GLB is the one universally-supported
 * round-trip format we can guarantee here.
 */
export function exportModelAsGlb(root: THREE.Object3D, clips: THREE.AnimationClip[]): Promise<ArrayBuffer> {
  prepareModelForExport(root);
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      root,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else resolve(new TextEncoder().encode(JSON.stringify(result)).buffer as ArrayBuffer);
      },
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
      { binary: true, animations: clips, onlyVisible: false }
    );
  });
}

export async function exportAndSave(root: THREE.Object3D, clips: THREE.AnimationClip[], fileBaseName: string) {
  const buffer = await exportModelAsGlb(root, clips);
  const name = fileBaseName.replace(/\.[^.]+$/, "") || "model";
  return saveBytes(`${name}.glb`, new Uint8Array(buffer), "glb");
}
