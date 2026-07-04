import * as THREE from "three";
import { zipSync } from "fflate";
import {
  ColladaExporter,
  GLTFExporter,
  OBJExporter,
  PLYExporter,
  STLExporter,
  USDZExporter,
} from "three-stdlib";
import { FBXExporter } from "@comfyorg/fbx-exporter-three";
import type { ExportFormatId } from "@/lib/export-formats";
import {
  buildObjMtl,
  cloneSceneForExport,
  decodeColladaTextureData,
  disposeClonedExportRoot,
  ensureMaterialNames,
  textureToPngBytes,
} from "@/lib/export-textures";
import { saveBytes } from "@/lib/tauri";

export interface ExportSceneOptions {
  root: THREE.Object3D;
  format: ExportFormatId;
  includeTextures: boolean;
  animations: THREE.AnimationClip[];
  fileBaseName: string;
}

export interface ExportFilePayload {
  fileName: string;
  data: Uint8Array;
}

const textEncoder = new TextEncoder();

function sanitizeBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[<>:"/\\|?*]+/g, "_").trim() || "model";
}

function toUint8Array(data: ArrayBuffer | Uint8Array | string): Uint8Array {
  if (typeof data === "string") return textEncoder.encode(data);
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

function zipFiles(files: Array<{ path: string; data: Uint8Array }>, zipName: string): ExportFilePayload {
  const entries: Record<string, Uint8Array> = {};
  for (const file of files) entries[file.path] = file.data;
  return { fileName: zipName, data: zipSync(entries) };
}

/** Ensures skinned meshes and skeletons are up to date before export. */
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

export function exportModelAsGlb(root: THREE.Object3D, clips: THREE.AnimationClip[]): Promise<ArrayBuffer> {
  return exportAsGlb(root, clips);
}

function exportAsGlb(root: THREE.Object3D, clips: THREE.AnimationClip[]): Promise<ArrayBuffer> {
  prepareModelForExport(root);
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      root,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else resolve(textEncoder.encode(JSON.stringify(result)).buffer as ArrayBuffer);
      },
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
      { binary: true, animations: clips, onlyVisible: false }
    );
  });
}

function exportAsGltfJson(root: THREE.Object3D, clips: THREE.AnimationClip[]): Promise<object> {
  prepareModelForExport(root);
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      root,
      (result) => {
        if (result instanceof ArrayBuffer) {
          reject(new Error("Unexpected binary result for glTF JSON export."));
          return;
        }
        resolve(result as object);
      },
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
      { binary: false, animations: clips, onlyVisible: false }
    );
  });
}

async function exportAsFbx(
  root: THREE.Object3D,
  clips: THREE.AnimationClip[],
  includeTextures: boolean
): Promise<Uint8Array> {
  prepareModelForExport(root);
  const exporter = new FBXExporter();
  return exporter.parseAsync(root, {
    preset: "threejs",
    animations: clips,
    includeAnimations: clips.length > 0,
    embedTextures: includeTextures,
    onlyVisible: false,
  });
}

async function exportAsUsdz(root: THREE.Object3D): Promise<Uint8Array> {
  prepareModelForExport(root);
  const exporter = new USDZExporter();
  const result = await exporter.parse(root);
  return toUint8Array(result as ArrayBuffer);
}

function exportAsStl(root: THREE.Object3D): Uint8Array {
  prepareModelForExport(root);
  return textEncoder.encode(new STLExporter().parse(root));
}

function exportAsPly(root: THREE.Object3D): Uint8Array {
  prepareModelForExport(root);
  const text = new PLYExporter().parse(root, undefined, {}) as string;
  return textEncoder.encode(text);
}

async function exportAsObjBundle(
  root: THREE.Object3D,
  baseName: string,
  includeTextures: boolean
): Promise<ExportFilePayload> {
  prepareModelForExport(root);
  ensureMaterialNames(root);

  let objText = new OBJExporter().parse(root);
  const mtlName = `${baseName}.mtl`;
  if (!objText.includes("mtllib")) {
    objText = `mtllib ${mtlName}\n${objText}`;
  }

  const files: Array<{ path: string; data: Uint8Array }> = [
    { path: `${baseName}.obj`, data: textEncoder.encode(objText) },
    { path: mtlName, data: textEncoder.encode(buildObjMtl(root)) },
  ];

  if (includeTextures) {
    const written = new Set<THREE.Texture>();
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        const map =
          material instanceof THREE.MeshStandardMaterial ||
          material instanceof THREE.MeshPhongMaterial ||
          material instanceof THREE.MeshBasicMaterial
            ? material.map
            : null;
        if (!map || written.has(map)) continue;
        written.add(map);
      }
    });

    for (const texture of written) {
      const bytes = await textureToPngBytes(texture);
      if (!bytes) continue;
      const ownerMaterial = findMaterialUsingTexture(root, texture);
      const fileStem = sanitizeBaseName(ownerMaterial?.name ?? texture.name ?? "texture");
      files.push({ path: `textures/${fileStem}.png`, data: bytes });
    }
  }

  return zipFiles(files, `${baseName}-obj.zip`);
}

function findMaterialUsingTexture(root: THREE.Object3D, texture: THREE.Texture): THREE.Material | null {
  let found: THREE.Material | null = null;
  root.traverse((obj) => {
    if (found) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const map =
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhongMaterial ||
        material instanceof THREE.MeshBasicMaterial
          ? material.map
          : null;
      if (map === texture) {
        found = material;
        return;
      }
    }
  });
  return found;
}

function exportAsColladaBundle(root: THREE.Object3D, baseName: string, includeTextures: boolean): ExportFilePayload {
  prepareModelForExport(root);
  const exporter = new ColladaExporter();
  const result = exporter.parse(
    root,
    () => {},
    {
      author: "Roboticela Animator",
      textureDirectory: includeTextures ? "textures/" : "",
    }
  );

  if (!result?.data) {
    throw new Error("Collada export failed.");
  }

  const files: Array<{ path: string; data: Uint8Array }> = [
    { path: `${baseName}.dae`, data: textEncoder.encode(result.data) },
  ];

  if (includeTextures && Array.isArray(result.textures) && result.textures.length > 0) {
    for (const texture of result.textures as Array<{ name: string; ext: string; data: string }>) {
      files.push({
        path: `textures/${texture.name}.${texture.ext}`,
        data: decodeColladaTextureData(texture.data),
      });
    }
    return zipFiles(files, `${baseName}-dae.zip`);
  }

  return { fileName: `${baseName}.dae`, data: files[0]!.data };
}

export async function exportScene(options: ExportSceneOptions): Promise<ExportFilePayload> {
  const baseName = sanitizeBaseName(options.fileBaseName);
  const { root, format, includeTextures, animations } = options;
  const ownsClone = !includeTextures;
  const exportRoot = cloneSceneForExport(root, includeTextures);

  try {
    switch (format) {
      case "glb": {
        const buffer = await exportAsGlb(exportRoot, animations);
        return { fileName: `${baseName}.glb`, data: new Uint8Array(buffer) };
      }
      case "gltf": {
        const json = await exportAsGltfJson(exportRoot, animations);
        return {
          fileName: `${baseName}.gltf`,
          data: textEncoder.encode(JSON.stringify(json, null, 2)),
        };
      }
      case "fbx": {
        const bytes = await exportAsFbx(exportRoot, animations, includeTextures);
        return { fileName: `${baseName}.fbx`, data: bytes };
      }
      case "obj":
        return exportAsObjBundle(exportRoot, baseName, includeTextures);
      case "dae":
        return exportAsColladaBundle(exportRoot, baseName, includeTextures);
      case "usdz": {
        const bytes = await exportAsUsdz(exportRoot);
        return { fileName: `${baseName}.usdz`, data: bytes };
      }
      case "stl": {
        const bytes = exportAsStl(exportRoot);
        return { fileName: `${baseName}.stl`, data: bytes };
      }
      case "ply": {
        const bytes = exportAsPly(exportRoot);
        return { fileName: `${baseName}.ply`, data: bytes };
      }
      default:
        throw new Error(`Unsupported export format: ${String(format)}`);
    }
  } finally {
    if (ownsClone) disposeClonedExportRoot(exportRoot, false);
  }
}

export async function exportSceneAndSave(options: ExportSceneOptions): Promise<boolean> {
  const payload = await exportScene(options);
  const extension = payload.fileName.split(".").pop() ?? "bin";
  return saveBytes(payload.fileName, payload.data, extension);
}

/** @deprecated Use exportSceneAndSave */
export async function exportAndSave(root: THREE.Object3D, clips: THREE.AnimationClip[], fileBaseName: string) {
  return exportSceneAndSave({
    root,
    format: "glb",
    includeTextures: true,
    animations: clips,
    fileBaseName,
  });
}
