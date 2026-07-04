import * as THREE from "three";
import { findSceneMaterialById } from "@/lib/scene-materials";
import { commitMeshMaterials } from "@/lib/model-appearance";
import { yieldToMain } from "@/lib/yield-main";
import type { SourceExtension } from "@/types/model";

export const TEXTURE_PATHS_KEY = "_animatorTexturePaths";
export const SOURCE_MAP_KEY = "_animatorSourceMap";

export type TextureSlot =
  | "map"
  | "normalMap"
  | "emissiveMap"
  | "alphaMap"
  | "bumpMap"
  | "specularMap";

export type TextureIssueSeverity = "error" | "warning" | "info";

export interface TextureIssue {
  id: string;
  severity: TextureIssueSeverity;
  message: string;
}

export interface TextureSlotInfo {
  slot: TextureSlot;
  label: string;
  path: string | null;
  assigned: boolean;
  loaded: boolean;
  broken: boolean;
  colorSpaceOk: boolean;
}

export interface MaterialTextureReport {
  materialId: string;
  materialName: string;
  materialType: string;
  meshNames: string[];
  color: string;
  looksWhite: boolean;
  issues: TextureIssue[];
  slots: TextureSlotInfo[];
}

export const TEXTURE_SLOT_LABELS: Record<TextureSlot, string> = {
  map: "Diffuse / color",
  normalMap: "Normal",
  emissiveMap: "Emissive",
  alphaMap: "Alpha",
  bumpMap: "Bump",
  specularMap: "Specular",
};

const COLOR_SLOTS = new Set<TextureSlot>(["map", "emissiveMap"]);
const PHONG_SLOTS: TextureSlot[] = [
  "map",
  "normalMap",
  "emissiveMap",
  "alphaMap",
  "bumpMap",
  "specularMap",
];

function slotUsesSrgb(slot: TextureSlot): boolean {
  return COLOR_SLOTS.has(slot);
}

function isPhongLike(
  material: THREE.Material
): material is THREE.MeshPhongMaterial | THREE.MeshBasicMaterial {
  return material instanceof THREE.MeshPhongMaterial || material instanceof THREE.MeshBasicMaterial;
}

function getTextureOnMaterial(material: THREE.Material, slot: TextureSlot): THREE.Texture | null | undefined {
  if (!isPhongLike(material)) return null;
  if (material instanceof THREE.MeshBasicMaterial) {
    if (slot === "map") return material.map;
    if (slot === "alphaMap") return material.alphaMap;
    return null;
  }
  if (slot === "map") return material.map;
  if (slot === "normalMap") return material.normalMap;
  if (slot === "emissiveMap") return material.emissiveMap;
  if (slot === "alphaMap") return material.alphaMap;
  if (slot === "bumpMap") return material.bumpMap;
  if (slot === "specularMap") return material.specularMap;
  return null;
}

function setTextureOnMaterial(
  material: THREE.MeshPhongMaterial | THREE.MeshBasicMaterial,
  slot: TextureSlot,
  texture: THREE.Texture | null
): void {
  if (material instanceof THREE.MeshBasicMaterial && slot !== "map" && slot !== "alphaMap") return;
  if (slot === "map") {
    material.map = texture;
    if (texture) material.userData[SOURCE_MAP_KEY] = texture;
    else delete material.userData[SOURCE_MAP_KEY];
    return;
  }
  if (material instanceof THREE.MeshPhongMaterial) {
    material[slot] = texture;
  }
}

export function getStoredTexturePath(material: THREE.Material, slot: TextureSlot): string | null {
  const paths = material.userData[TEXTURE_PATHS_KEY] as Partial<Record<TextureSlot, string>> | undefined;
  const stored = paths?.[slot];
  if (typeof stored === "string" && stored.trim()) return stored;
  return null;
}

export function setStoredTexturePath(material: THREE.Material, slot: TextureSlot, path: string | null): void {
  const paths =
    (material.userData[TEXTURE_PATHS_KEY] as Partial<Record<TextureSlot, string>> | undefined) ?? {};
  if (path) paths[slot] = path;
  else delete paths[slot];
  material.userData[TEXTURE_PATHS_KEY] = paths;
}

export function inferTexturePath(texture: THREE.Texture | null | undefined): string | null {
  if (!texture) return null;
  if (texture.name?.trim()) return texture.name;

  const image = texture.image as
    | HTMLImageElement
    | ImageBitmap
    | HTMLCanvasElement
    | { name?: string }
    | undefined;

  if (image && "src" in image && typeof image.src === "string" && image.src) {
    try {
      const url = new URL(image.src);
      const name = url.pathname.split("/").pop();
      if (name) return decodeURIComponent(name);
    } catch {
      if (image.src.startsWith("blob:")) return "embedded (browser)";
      return image.src.length > 48 ? `${image.src.slice(0, 45)}…` : image.src;
    }
  }

  if (image && "name" in image && typeof image.name === "string" && image.name) return image.name;
  const sourceData = texture.source?.data;
  if (sourceData && typeof sourceData === "object" && "name" in sourceData) {
    const name = (sourceData as { name?: string }).name;
    if (typeof name === "string" && name) return name;
  }

  return "embedded";
}

export function isTextureBroken(texture: THREE.Texture | null | undefined): boolean {
  if (!texture) return false;
  const image = texture.image as
    | HTMLImageElement
    | ImageBitmap
    | HTMLCanvasElement
    | { width?: number; height?: number; data?: unknown }
    | undefined;
  if (!image) return true;
  if (image instanceof HTMLImageElement) {
    return !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0;
  }
  if (image instanceof ImageBitmap) return image.width === 0 || image.height === 0;
  if (image instanceof HTMLCanvasElement) return image.width === 0 || image.height === 0;
  if ("width" in image && typeof image.width === "number") return image.width === 0;
  if ("data" in image && image.data) return false;
  return false;
}

export function isTextureColorSpaceOk(texture: THREE.Texture | null | undefined, slot: TextureSlot): boolean {
  if (!texture) return true;
  const expected = slotUsesSrgb(slot) ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  return texture.colorSpace === expected;
}

export function fixTextureColorSpace(texture: THREE.Texture, slot: TextureSlot): void {
  texture.colorSpace = slotUsesSrgb(slot) ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  texture.needsUpdate = true;
}

function isColorNearlyWhite(color: THREE.Color): boolean {
  return color.r > 0.93 && color.g > 0.93 && color.b > 0.93;
}

function materialTypeName(material: THREE.Material): string {
  return material.type.replace("Mesh", "");
}

function hexFromColor(color: THREE.Color): string {
  return `#${color.getHexString()}`;
}

export function inspectTextureSlot(material: THREE.Material, slot: TextureSlot): TextureSlotInfo {
  const texture = getTextureOnMaterial(material, slot);
  const path = getStoredTexturePath(material, slot) ?? inferTexturePath(texture);
  const assigned = Boolean(texture);
  const broken = assigned && isTextureBroken(texture);
  const loaded = assigned && !broken;
  return {
    slot,
    label: TEXTURE_SLOT_LABELS[slot],
    path,
    assigned,
    loaded,
    broken,
    colorSpaceOk: !texture || isTextureColorSpaceOk(texture, slot),
  };
}

export function auditMaterial(
  material: THREE.Material,
  meshNames: string[],
  sourceExt?: SourceExtension
): MaterialTextureReport {
  const issues: TextureIssue[] = [];
  const slots: TextureSlotInfo[] = [];

  if (isPhongLike(material)) {
    const availableSlots =
      material instanceof THREE.MeshBasicMaterial ? (["map", "alphaMap"] as TextureSlot[]) : PHONG_SLOTS;
    for (const slot of availableSlots) {
      slots.push(inspectTextureSlot(material, slot));
    }
  }

  const diffuse = slots.find((s) => s.slot === "map");
  const color =
    material instanceof THREE.MeshPhongMaterial ||
    material instanceof THREE.MeshLambertMaterial ||
    material instanceof THREE.MeshBasicMaterial ||
    material instanceof THREE.MeshStandardMaterial
      ? hexFromColor(material.color)
      : "#9099a6";

  const looksWhite = isColorNearlyWhite(
    material instanceof THREE.MeshPhongMaterial ||
      material instanceof THREE.MeshLambertMaterial ||
      material instanceof THREE.MeshBasicMaterial ||
      material instanceof THREE.MeshStandardMaterial
      ? material.color
      : new THREE.Color("#9099a6")
  );

  if (!isPhongLike(material)) {
    issues.push({
      id: "unsupported-material",
      severity: "warning",
      message: `Material type "${materialTypeName(material)}" may not display textures correctly.`,
    });
  }

  if (diffuse?.broken) {
    issues.push({
      id: "broken-diffuse",
      severity: "error",
      message: `Diffuse texture failed to load${diffuse.path ? ` (${diffuse.path})` : ""}. Pick the image file again.`,
    });
  } else if (!diffuse?.loaded && looksWhite) {
    const extHint =
      sourceExt === "fbx" || sourceExt === "obj"
        ? " FBX/OBJ often need external image files beside the model."
        : sourceExt === "gltf"
          ? " GLTF may reference separate image files — load them below."
          : "";
    issues.push({
      id: "missing-diffuse",
      severity: "warning",
      message: `No working diffuse texture and base color is near-white — surface may look blank.${extHint}`,
    });
  }

  for (const slotInfo of slots) {
    if (slotInfo.broken) {
      issues.push({
        id: `broken-${slotInfo.slot}`,
        severity: "error",
        message: `${slotInfo.label} texture is missing or failed to load${slotInfo.path ? ` (${slotInfo.path})` : ""}.`,
      });
    }
    if (slotInfo.assigned && !slotInfo.colorSpaceOk) {
      issues.push({
        id: `colorspace-${slotInfo.slot}`,
        severity: "warning",
        message: `${slotInfo.label} may look washed out (wrong color space). Use “Fix color spaces”.`,
      });
    }
  }

  if (sourceExt === "fbx" && !diffuse?.loaded) {
    issues.push({
      id: "fbx-external",
      severity: "info",
      message: "FBX rarely embeds textures. Use Browse to link each diffuse/normal image.",
    });
  }

  return {
    materialId: material.uuid,
    materialName: material.name?.trim() || "Unnamed material",
    materialType: materialTypeName(material),
    meshNames,
    color,
    looksWhite,
    issues,
    slots,
  };
}

export function collectMaterialMeshNames(root: THREE.Object3D): Map<string, string[]> {
  const map = new Map<string, string[]>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const meshName = mesh.name?.trim() || "Mesh";
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material) continue;
      const list = map.get(material.uuid) ?? [];
      if (!list.includes(meshName)) list.push(meshName);
      map.set(material.uuid, list);
    }
  });
  return map;
}

export function auditSceneMaterials(
  root: THREE.Object3D,
  sourceExt?: SourceExtension
): MaterialTextureReport[] {
  const meshNamesByMaterial = collectMaterialMeshNames(root);
  const seen = new Set<string>();
  const reports: MaterialTextureReport[] = [];

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material || seen.has(material.uuid)) continue;
      seen.add(material.uuid);
      reports.push(
        auditMaterial(material, meshNamesByMaterial.get(material.uuid) ?? [], sourceExt)
      );
    }
  });

  return reports.sort((a, b) => a.materialName.localeCompare(b.materialName));
}

export function repairSceneTextures(root: THREE.Object3D): number {
  let fixed = 0;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!isPhongLike(material)) continue;
      const slots =
        material instanceof THREE.MeshBasicMaterial
          ? (["map", "alphaMap"] as TextureSlot[])
          : PHONG_SLOTS;
      for (const slot of slots) {
        const texture = getTextureOnMaterial(material, slot);
        if (!texture) continue;
        if (!isTextureColorSpaceOk(texture, slot)) {
          fixTextureColorSpace(texture, slot);
          fixed += 1;
        }
        const path = inferTexturePath(texture);
        if (path) setStoredTexturePath(material, slot, path);
      }
      material.needsUpdate = true;
    }
  });
  return fixed;
}

function replaceMaterialOnMeshes(root: THREE.Object3D, materialId: string, next: THREE.Material): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? [...mesh.material] : [mesh.material];
    let changed = false;
    for (let i = 0; i < materials.length; i++) {
      if (materials[i]?.uuid === materialId) {
        materials[i] = next;
        changed = true;
      }
    }
    if (changed) {
      commitMeshMaterials(mesh, materials.length === 1 ? materials[0]! : materials);
    }
  });
}

function materialStillInScene(root: THREE.Object3D, material: THREE.Material): boolean {
  let found = false;
  root.traverse((obj) => {
    if (found) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (materials.includes(material)) found = true;
  });
  return found;
}

function replaceMaterialInstanceOnMeshes(
  root: THREE.Object3D,
  sourceMaterial: THREE.Material,
  next: THREE.Material
): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? [...mesh.material] : [mesh.material];
    let changed = false;
    for (let i = 0; i < materials.length; i++) {
      if (materials[i] === sourceMaterial) {
        materials[i] = next;
        changed = true;
      }
    }
    if (changed) {
      commitMeshMaterials(mesh, materials.length === 1 ? materials[0]! : materials);
    }
  });
}

const TEXTURE_LOAD_TIMEOUT_MS = 20_000;

async function loadTextureFromFile(file: File, slot: TextureSlot): Promise<THREE.Texture> {
  const load = async (): Promise<THREE.Texture> => {
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file);
        const texture = new THREE.Texture(bitmap);
        texture.colorSpace = slotUsesSrgb(slot) ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
      } catch {
        // Fall through to Image + TextureLoader path.
      }
    }

    return new Promise<THREE.Texture>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        const texture = new THREE.Texture(image);
        fixTextureColorSpace(texture, slot);
        texture.needsUpdate = true;
        resolve(texture);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to decode image: ${file.name}`));
      };
      image.src = url;
    });
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      load(),
      new Promise<THREE.Texture>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timed out loading texture: ${file.name}`)),
          TEXTURE_LOAD_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function referencePathsForSlot(material: THREE.Material, slot: TextureSlot): string[] {
  const paths = new Set<string>();
  const stored = getStoredTexturePath(material, slot);
  if (stored) paths.add(stored);
  const texture = getTextureOnMaterial(material, slot);
  const inferred = inferTexturePath(texture);
  if (inferred) paths.add(inferred);
  if (texture?.name?.trim()) paths.add(texture.name.trim());
  return [...paths].filter(isResolvableReferencePath);
}

export async function assignTextureFileToMaterial(
  root: THREE.Object3D,
  materialId: string,
  slot: TextureSlot,
  file: File
): Promise<void> {
  const material = findSceneMaterialById(root, materialId);
  if (!material) return;
  await assignTextureFilesToMaterial(root, material, [{ slot, file }]);
}

export async function assignTextureFilesToMaterial(
  root: THREE.Object3D,
  sourceMaterial: THREE.Material,
  assignments: Array<{ slot: TextureSlot; file: File }>
): Promise<boolean> {
  if (assignments.length === 0) return false;
  if (!isPhongLike(sourceMaterial) || !materialStillInScene(root, sourceMaterial)) return false;

  const next =
    sourceMaterial instanceof THREE.MeshPhongMaterial
      ? sourceMaterial.clone()
      : (sourceMaterial as THREE.MeshBasicMaterial).clone();

  for (const { slot, file } of assignments) {
    const texture = await loadTextureFromFile(file, slot);
    setStoredTexturePath(next, slot, file.name);
    setTextureOnMaterial(next, slot, texture);
    await yieldToMain();
  }

  next.needsUpdate = true;
  replaceMaterialInstanceOnMeshes(root, sourceMaterial, next);
  return true;
}

export function linkTextureBetweenMaterials(
  root: THREE.Object3D,
  targetMaterialId: string,
  sourceMaterialId: string,
  slot: TextureSlot
): boolean {
  const source = findSceneMaterialById(root, sourceMaterialId);
  const target = findSceneMaterialById(root, targetMaterialId);
  if (!source || !target || !isPhongLike(source) || !isPhongLike(target)) return false;

  const sourceTexture = getTextureOnMaterial(source, slot);
  if (!sourceTexture || isTextureBroken(sourceTexture)) return false;

  const texture = sourceTexture.clone();
  texture.needsUpdate = true;
  const path = getStoredTexturePath(source, slot) ?? inferTexturePath(sourceTexture);
  if (path) setStoredTexturePath(target, slot, path);

  const next =
    target instanceof THREE.MeshPhongMaterial
      ? target.clone()
      : (target as THREE.MeshBasicMaterial).clone();
  setTextureOnMaterial(next, slot, texture);
  next.needsUpdate = true;
  replaceMaterialOnMeshes(root, targetMaterialId, next);
  return true;
}

export function clearMaterialTextureSlot(
  root: THREE.Object3D,
  materialId: string,
  slot: TextureSlot
): void {
  const material = findSceneMaterialById(root, materialId);
  if (!material || !isPhongLike(material)) return;

  const next =
    material instanceof THREE.MeshPhongMaterial
      ? material.clone()
      : (material as THREE.MeshBasicMaterial).clone();
  setTextureOnMaterial(next, slot, null);
  setStoredTexturePath(next, slot, null);
  next.needsUpdate = true;
  replaceMaterialOnMeshes(root, materialId, next);
}

export function fixMaterialTextureColorSpaces(root: THREE.Object3D, materialId: string): number {
  const material = findSceneMaterialById(root, materialId);
  if (!material || !isPhongLike(material)) return 0;

  let fixed = 0;
  const slots =
    material instanceof THREE.MeshBasicMaterial
      ? (["map", "alphaMap"] as TextureSlot[])
      : PHONG_SLOTS;
  for (const slot of slots) {
    const texture = getTextureOnMaterial(material, slot);
    if (!texture || isTextureColorSpaceOk(texture, slot)) continue;
    fixTextureColorSpace(texture, slot);
    fixed += 1;
  }

  if (fixed > 0) {
    const next =
      material instanceof THREE.MeshPhongMaterial
        ? material.clone()
        : (material as THREE.MeshBasicMaterial).clone();
    next.needsUpdate = true;
    replaceMaterialOnMeshes(root, materialId, next);
  }
  return fixed;
}

export function summarizeTextureIssues(reports: MaterialTextureReport[]): {
  errors: number;
  warnings: number;
  infos: number;
} {
  let errors = 0;
  let warnings = 0;
  let infos = 0;
  for (const report of reports) {
    for (const issue of report.issues) {
      if (issue.severity === "error") errors += 1;
      else if (issue.severity === "warning") warnings += 1;
      else infos += 1;
    }
  }
  return { errors, warnings, infos };
}

/** True when the model likely needs external image files (FBX/OBJ/GLTF) or has broken/missing maps. */
export function modelNeedsExternalTextures(
  object3D: THREE.Object3D,
  sourceExt: SourceExtension
): boolean {
  if (sourceExt === "glb") return false;

  if (sourceExt === "fbx" || sourceExt === "obj") return true;

  const reports = auditSceneMaterials(object3D, sourceExt);
  return reports.some(
    (report) =>
      report.issues.some(
        (issue) =>
          issue.id === "missing-diffuse" ||
          issue.id === "broken-diffuse" ||
          issue.id.startsWith("broken-")
      ) || report.slots.some((slot) => {
        if (slot.broken) return true;
        if (slot.loaded) return false;
        const path = slot.path?.trim();
        return Boolean(path && path !== "embedded" && !path.startsWith("embedded "));
      })
  );
}

const IMAGE_FILE_EXT = /\.(png|jpe?g|webp|bmp|tga|gif|hdr)$/i;

export interface TextureFolderIndex {
  byRelative: Map<string, File>;
  byBasename: Map<string, File[]>;
  byStem: Map<string, File[]>;
  fileCount: number;
}

export interface TextureFolderLoadResult {
  folderName: string | null;
  fileCount: number;
  matched: number;
  skipped: number;
  failed: number;
  unmatched: string[];
}

const SLOT_NAME_HINTS: Partial<Record<TextureSlot, string[]>> = {
  map: ["diffuse", "albedo", "basecolor", "base_color", "color", "col"],
  normalMap: ["normal", "norm", "nrm", "normalmap"],
  emissiveMap: ["emissive", "emit", "glow"],
  alphaMap: ["alpha", "opacity", "transparent"],
  bumpMap: ["bump", "height", "displacement"],
  specularMap: ["specular", "spec", "gloss"],
};

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_FILE_EXT.test(file.name);
}

function getFileRelativePath(file: File): string {
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return rel?.trim() || file.name;
}

export function normalizeTexturePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(/^([a-z]:)/i, "")
    .replace(/^(\.\/)+/, "")
    .replace(/^\/+/, "")
    .toLowerCase();
}

export function textureBasename(path: string): string {
  const norm = path.replace(/\\/g, "/");
  const parts = norm.split("/");
  return (parts.pop() ?? norm).toLowerCase();
}

function stripRootFolderPrefix(relativePath: string): string {
  const norm = relativePath.replace(/\\/g, "/");
  const slash = norm.indexOf("/");
  return slash >= 0 ? norm.slice(slash + 1) : norm;
}

function isResolvableReferencePath(path: string | null | undefined): path is string {
  if (!path?.trim()) return false;
  const norm = normalizeTexturePath(path);
  return norm !== "embedded" && !norm.startsWith("embedded ");
}

export function textureStem(path: string): string {
  const base = textureBasename(path);
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(0, dot) : base;
}

export function indexTextureFolderFiles(files: Iterable<File>): TextureFolderIndex {
  const byRelative = new Map<string, File>();
  const byBasename = new Map<string, File[]>();
  const byStem = new Map<string, File[]>();
  let fileCount = 0;

  for (const file of files) {
    if (!isImageFile(file)) continue;
    fileCount += 1;

    const rel = getFileRelativePath(file);
    const withoutRoot = normalizeTexturePath(stripRootFolderPrefix(rel));
    const fullNorm = normalizeTexturePath(rel);
    const base = textureBasename(rel);
    const stem = textureStem(rel);

    byRelative.set(withoutRoot, file);
    byRelative.set(fullNorm, file);
    byRelative.set(base, file);

    const baseList = byBasename.get(base) ?? [];
    baseList.push(file);
    byBasename.set(base, baseList);

    const stemList = byStem.get(stem) ?? [];
    stemList.push(file);
    byStem.set(stem, stemList);
  }

  return { byRelative, byBasename, byStem, fileCount };
}

export function inferTextureFolderName(files: File[]): string | null {
  const first = files[0];
  if (!first) return null;
  const rel = getFileRelativePath(first);
  const slash = rel.indexOf("/");
  if (slash > 0) return rel.slice(0, slash);
  return null;
}

export function resolveTextureFileFromFolder(
  referencePath: string,
  index: TextureFolderIndex
): File | null {
  const norm = normalizeTexturePath(referencePath);
  const base = textureBasename(referencePath);

  const exact = index.byRelative.get(norm);
  if (exact) return exact;

  for (const [key, file] of index.byRelative) {
    if (key === norm) return file;
    if (key.endsWith(`/${norm}`) || norm.endsWith(`/${key}`)) return file;
  }

  const candidates = index.byBasename.get(base);
  if (!candidates?.length) return null;
  if (candidates.length === 1) return candidates[0]!;

  let best: File | null = null;
  let bestScore = -1;
  for (const file of candidates) {
    const rel = normalizeTexturePath(stripRootFolderPrefix(getFileRelativePath(file)));
    let score = 0;
    if (rel === norm) score = 100;
    else if (rel.endsWith(`/${norm}`) || norm.endsWith(`/${rel}`)) score = 80;
    else if (textureBasename(rel) === base) score = 20;
    if (score > bestScore) {
      bestScore = score;
      best = file;
    }
  }
  return best;
}

function guessTextureFileForMaterialSlot(
  materialName: string,
  slot: TextureSlot,
  index: TextureFolderIndex
): File | null {
  const safe = materialName.replace(/[^\w\- ]+/g, " ").trim().replace(/\s+/g, "_");
  if (!safe) return null;

  const hints = SLOT_NAME_HINTS[slot] ?? [];
  const stems = new Set<string>([
    safe,
    safe.toLowerCase(),
    safe.replace(/\s+/g, ""),
    safe.replace(/\s+/g, "_").toLowerCase(),
  ]);
  for (const hint of hints) {
    stems.add(`${safe}_${hint}`);
    stems.add(`${safe}${hint}`);
    stems.add(`${safe}.${hint}`);
    stems.add(`${safe}-${hint}`);
    stems.add(`${safe.toLowerCase()}_${hint}`);
    stems.add(`${safe.toLowerCase()}-${hint}`);
  }

  for (const stem of stems) {
    const key = stem.toLowerCase();
    const stemFiles = index.byStem.get(key);
    if (stemFiles?.length === 1) return stemFiles[0]!;
    for (const ext of ["png", "jpg", "jpeg", "webp", "tga", "bmp"]) {
      const files = index.byBasename.get(`${key}.${ext}`);
      if (files?.length === 1) return files[0]!;
    }
  }

  const needle = safe.toLowerCase();
  if (needle.length >= 2) {
    const fuzzy: File[] = [];
    for (const [stem, files] of index.byStem) {
      if (stem.includes(needle) || needle.includes(stem)) {
        fuzzy.push(...files);
      }
    }
    if (fuzzy.length === 1) return fuzzy[0]!;
  }

  return null;
}

function resolveTextureFileFromReferences(
  referencePaths: string[],
  index: TextureFolderIndex
): File | null {
  for (const ref of referencePaths) {
    const file = resolveTextureFileFromFolder(ref, index);
    if (file) return file;
    const stem = textureStem(ref);
    const stemFiles = index.byStem.get(stem);
    if (stemFiles?.length === 1) return stemFiles[0]!;
  }
  return null;
}

export async function autoLoadTexturesFromFolder(
  root: THREE.Object3D,
  files: File[],
  onProgress?: (message: string) => void
): Promise<TextureFolderLoadResult> {
  const imageFiles = [...files].filter(isImageFile);
  const index = indexTextureFolderFiles(imageFiles);
  const folderName = inferTextureFolderName(imageFiles);
  const reports = auditSceneMaterials(root);

  let matched = 0;
  let skipped = 0;
  let failed = 0;
  const unmatched = new Set<string>();
  const pending = new Map<THREE.Material, Array<{ slot: TextureSlot; file: File }>>();

  for (const report of reports) {
    const material = findSceneMaterialById(root, report.materialId);
    if (!material || !isPhongLike(material)) continue;

    for (const slotInfo of report.slots) {
      const slot = slotInfo.slot;
      if (slotInfo.loaded && !slotInfo.broken) {
        skipped += 1;
        continue;
      }

      const referencePaths = referencePathsForSlot(material, slot);
      let file: File | null = resolveTextureFileFromReferences(referencePaths, index);

      if (!file && slot === "map") {
        file = guessTextureFileForMaterialSlot(report.materialName, slot, index);
      }

      if (!file) {
        for (const ref of referencePaths) unmatched.add(ref);
        skipped += 1;
        continue;
      }

      const list = pending.get(material) ?? [];
      list.push({ slot, file });
      pending.set(material, list);
    }
  }

  const batches = [...pending.entries()];
  let batchIndex = 0;
  for (const [material, assignments] of batches) {
    batchIndex += 1;
    onProgress?.(`Linking textures (${batchIndex}/${batches.length})…`);
    if (!materialStillInScene(root, material)) {
      skipped += assignments.length;
      continue;
    }
    try {
      const ok = await assignTextureFilesToMaterial(root, material, assignments);
      if (ok) matched += assignments.length;
      else skipped += assignments.length;
    } catch {
      failed += assignments.length;
    }
    await yieldToMain();
  }

  repairSceneTextures(root);

  return {
    folderName,
    fileCount: index.fileCount,
    matched,
    skipped,
    failed,
    unmatched: [...unmatched].sort((a, b) => a.localeCompare(b)),
  };
}
