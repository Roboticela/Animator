import * as THREE from "three";
import type { MeshPartInfo } from "@/types/model";
import { isSelectableMeshPart } from "@/lib/mesh-utils";
import { commitMeshMaterials } from "@/lib/model-appearance";

const PAINT_COLOR_KEY = "_animatorPaintColor";
const COLOR_OPACITY_KEY = "_animatorColorOpacity";
const MATERIAL_OPACITY_KEY = "_animatorMaterialOpacity";
const SOURCE_MAP_KEY = "_animatorSourceMap";

export interface SceneMaterialSwatch {
  id: string;
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  colorOpacity: number;
  materialOpacity: number;
  hasMap: boolean;
  previewUrl: string | null;
}

export interface MaterialPaintOptions {
  color: string;
  roughness?: number;
  metalness?: number;
  /** 0 = no color tint, 1 = full picked color (does not hide the surface) */
  colorOpacity?: number;
  /** 0 = fully transparent surface, 1 = opaque */
  materialOpacity?: number;
  /** @deprecated Use materialOpacity */
  opacity?: number;
}

export const MATERIAL_PRESETS: {
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  materialOpacity?: number;
  colorOpacity?: number;
  opacity?: number;
}[] = [
  { name: "Skin", color: "#e8b796", roughness: 0.82, metalness: 0.02 },
  { name: "Fabric", color: "#4a6fa5", roughness: 0.95, metalness: 0 },
  { name: "Leather", color: "#5c3d2e", roughness: 0.78, metalness: 0.04 },
  { name: "Metal", color: "#b8c4ce", roughness: 0.28, metalness: 0.92 },
  { name: "Plastic", color: "#e23d3d", roughness: 0.42, metalness: 0.08 },
  { name: "Rubber", color: "#1a1a1a", roughness: 0.88, metalness: 0 },
  { name: "Wood", color: "#8b5a2b", roughness: 0.86, metalness: 0 },
  { name: "Grass", color: "#3d8b4a", roughness: 0.94, metalness: 0 },
  { name: "Glass", color: "#c8e8ff", roughness: 0.08, metalness: 0.05, materialOpacity: 0.35 },
  { name: "Clear", color: "#ffffff", roughness: 0.15, metalness: 0, materialOpacity: 0.12 },
];

const previewUrlCache = new Map<string, string>();

function hexFromColor(color: THREE.Color): string {
  return `#${color.getHexString()}`;
}

function readPaintColor(material: THREE.Material): string {
  const stored = material.userData[PAINT_COLOR_KEY];
  if (typeof stored === "string") return stored;
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhongMaterial ||
    material instanceof THREE.MeshLambertMaterial ||
    material instanceof THREE.MeshBasicMaterial
  ) {
    return hexFromColor(material.color);
  }
  return "#9099a6";
}

function getSourceMap(material: THREE.Material): THREE.Texture | null {
  const stored = material.userData[SOURCE_MAP_KEY];
  if (stored instanceof THREE.Texture) return stored;
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhongMaterial ||
    material instanceof THREE.MeshLambertMaterial ||
    material instanceof THREE.MeshBasicMaterial
  ) {
    return material.map ?? null;
  }
  return null;
}

function hasStoredTexture(material: THREE.Material): boolean {
  return getSourceMap(material) != null;
}

function storeSourceMap(material: THREE.MeshStandardMaterial, map: THREE.Texture | null | undefined): void {
  if (map) material.userData[SOURCE_MAP_KEY] = map;
}

function readStoredColorOpacity(material: THREE.Material): number {
  const stored = material.userData[COLOR_OPACITY_KEY];
  if (typeof stored === "number") return THREE.MathUtils.clamp(stored, 0, 1);
  return 1;
}

function readStoredMaterialOpacity(material: THREE.Material): number {
  const stored = material.userData[MATERIAL_OPACITY_KEY];
  if (typeof stored === "number") return THREE.MathUtils.clamp(stored, 0, 1);
  return material.opacity ?? 1;
}

function readPbr(material: THREE.Material): {
  color: string;
  roughness: number;
  metalness: number;
  colorOpacity: number;
  materialOpacity: number;
  hasMap: boolean;
} {
  const colorOpacity = readStoredColorOpacity(material);
  const materialOpacity = readStoredMaterialOpacity(material);
  const paintColor = readPaintColor(material);
  const hasMap = hasStoredTexture(material);
  if (material instanceof THREE.MeshStandardMaterial) {
    return {
      color: paintColor,
      roughness: material.roughness ?? 0.5,
      metalness: material.metalness ?? 0,
      colorOpacity,
      materialOpacity,
      hasMap,
    };
  }
  if (material instanceof THREE.MeshPhongMaterial) {
    return {
      color: paintColor,
      roughness: 0.55,
      metalness: 0.05,
      colorOpacity,
      materialOpacity,
      hasMap,
    };
  }
  if (material instanceof THREE.MeshLambertMaterial) {
    return {
      color: paintColor,
      roughness: 0.9,
      metalness: 0,
      colorOpacity,
      materialOpacity,
      hasMap,
    };
  }
  if (material instanceof THREE.MeshBasicMaterial) {
    return {
      color: paintColor,
      roughness: 1,
      metalness: 0,
      colorOpacity,
      materialOpacity,
      hasMap,
    };
  }
  return {
    color: "#9099a6",
    roughness: 0.72,
    metalness: 0.08,
    colorOpacity: 1,
    materialOpacity: 1,
    hasMap: false,
  };
}

/**
 * Color opacity only scales the tint (0 = neutral / no tint).
 * Material opacity controls overall surface transparency.
 */
function applyPaintAppearance(
  material: THREE.MeshStandardMaterial,
  paintColor: string,
  colorOpacity: number,
  materialOpacity: number
): void {
  const colorOp = THREE.MathUtils.clamp(colorOpacity, 0, 1);
  const matOp = THREE.MathUtils.clamp(materialOpacity, 0, 1);
  const sourceMap = getSourceMap(material);

  material.userData[PAINT_COLOR_KEY] = paintColor;
  material.userData[COLOR_OPACITY_KEY] = colorOp;
  material.userData[MATERIAL_OPACITY_KEY] = matOp;
  if (sourceMap) storeSourceMap(material, sourceMap);

  const userColor = new THREE.Color(paintColor);
  const white = new THREE.Color(1, 1, 1);
  material.color.copy(white).lerp(userColor, colorOp);

  if (sourceMap) {
    material.map = sourceMap;
    material.map.needsUpdate = true;
  } else {
    material.map = null;
  }

  material.alphaMap = null;
  material.envMapIntensity = 1;
  material.opacity = matOp;
  material.transparent = matOp < 0.999;
  material.depthWrite = matOp >= 0.999;
  material.needsUpdate = true;
}

function texturePreviewUrl(material: THREE.Material): string | null {
  const map = getSourceMap(material);
  if (!map?.image) return null;

  const key = material.uuid;
  const cached = previewUrlCache.get(key);
  if (cached) return cached;

  try {
    const canvas = document.createElement("canvas");
    const image = map.image as CanvasImageSource;
    const width = (image as HTMLImageElement).width || 64;
    const height = (image as HTMLImageElement).height || 64;
    canvas.width = Math.min(width, 128);
    canvas.height = Math.min(height, 128);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/jpeg", 0.82);
    previewUrlCache.set(key, url);
    return url;
  } catch {
    return null;
  }
}

export function clearMaterialPreviewCache(): void {
  previewUrlCache.clear();
}

/** Unique materials currently used in the scene — for the textures palette. */
export function collectSceneMaterials(root: THREE.Object3D): SceneMaterialSwatch[] {
  const seen = new Set<string>();
  const swatches: SceneMaterialSwatch[] = [];

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material || seen.has(material.uuid)) continue;
      seen.add(material.uuid);
      const pbr = readPbr(material);
      swatches.push({
        id: material.uuid,
        name: material.name?.trim() || `Material ${swatches.length + 1}`,
        color: pbr.color,
        roughness: pbr.roughness,
        metalness: pbr.metalness,
        colorOpacity: pbr.colorOpacity,
        materialOpacity: pbr.materialOpacity,
        hasMap: pbr.hasMap,
        previewUrl: texturePreviewUrl(material),
      });
    }
  });

  return swatches.sort((a, b) => a.name.localeCompare(b.name));
}

export function findSceneMaterialById(root: THREE.Object3D, materialId: string): THREE.Material | null {
  let found: THREE.Material | null = null;
  root.traverse((obj) => {
    if (found) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (material?.uuid === materialId) {
        found = material;
        return;
      }
    }
  });
  return found;
}

function materialIndicesForPart(part: MeshPartInfo): number[] {
  const mesh = part.mesh;
  if (!mesh) return [];

  if (part.kind === "primitive" && part.geometryGroupIndex != null) {
    const groups = mesh.geometry?.groups ?? [];
    const group = groups[part.geometryGroupIndex];
    return [group?.materialIndex ?? 0];
  }

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  return materials.map((_, index) => index);
}

function ensureMaterialArray(mesh: THREE.Mesh): THREE.Material[] {
  if (Array.isArray(mesh.material)) return [...mesh.material];
  return [mesh.material];
}

function setMaterialAtIndex(mesh: THREE.Mesh, index: number, material: THREE.Material): THREE.Material[] {
  const materials = ensureMaterialArray(mesh);
  while (materials.length <= index) {
    materials.push(materials[materials.length - 1]!.clone());
  }
  materials[index] = material;
  return materials;
}

function resolveColorOpacity(options: MaterialPaintOptions, source: THREE.Material | null): number {
  if (options.colorOpacity != null) return THREE.MathUtils.clamp(options.colorOpacity, 0, 1);
  if (source) return readStoredColorOpacity(source);
  return 1;
}

function resolveMaterialOpacity(options: MaterialPaintOptions, source: THREE.Material | null): number {
  if (options.materialOpacity != null) return THREE.MathUtils.clamp(options.materialOpacity, 0, 1);
  if (options.opacity != null) return THREE.MathUtils.clamp(options.opacity, 0, 1);
  if (source) return readStoredMaterialOpacity(source);
  return 1;
}

function toStandardMaterial(
  source: THREE.Material | null,
  options: MaterialPaintOptions
): THREE.MeshStandardMaterial {
  const paintColor = options.color;
  const roughness = options.roughness ?? 0.72;
  const metalness = options.metalness ?? 0.08;
  const colorOpacity = resolveColorOpacity(options, source);
  const materialOpacity = resolveMaterialOpacity(options, source);

  if (source instanceof THREE.MeshStandardMaterial) {
    const next = source.clone();
    next.roughness = roughness;
    next.metalness = metalness;
    const sourceMap = getSourceMap(source);
    if (sourceMap) storeSourceMap(next, sourceMap);
    applyPaintAppearance(next, paintColor, colorOpacity, materialOpacity);
    return next;
  }

  const next = new THREE.MeshStandardMaterial({ color: paintColor, roughness, metalness });
  if (
    source &&
    (source instanceof THREE.MeshPhongMaterial ||
      source instanceof THREE.MeshLambertMaterial ||
      source instanceof THREE.MeshBasicMaterial) &&
    source.map
  ) {
    storeSourceMap(next, source.map);
  }
  applyPaintAppearance(next, paintColor, colorOpacity, materialOpacity);
  return next;
}

function applyMaterialToPart(part: MeshPartInfo, material: THREE.Material): void {
  const mesh = part.mesh;
  if (!mesh) return;

  const indices = materialIndicesForPart(part);
  let materials = ensureMaterialArray(mesh);
  for (const index of indices) {
    materials = setMaterialAtIndex(mesh, index, material.clone());
  }
  commitMeshMaterials(mesh, materials.length === 1 ? materials[0]! : materials);
}

export function applyColorToParts(parts: MeshPartInfo[], options: MaterialPaintOptions): void {
  for (const part of parts) {
    if (!isSelectableMeshPart(part)) continue;
    const mesh = part.mesh;
    if (!mesh) continue;

    const indices = materialIndicesForPart(part);
    let materials = ensureMaterialArray(mesh);
    for (const index of indices) {
      const current = materials[index] ?? materials[0] ?? null;
      const next = toStandardMaterial(current, options);
      materials = setMaterialAtIndex(mesh, index, next);
    }
    commitMeshMaterials(mesh, materials.length === 1 ? materials[0]! : materials);
  }
}

export function applySceneMaterialToParts(parts: MeshPartInfo[], source: THREE.Material): void {
  for (const part of parts) {
    if (!isSelectableMeshPart(part)) continue;
    applyMaterialToPart(part, source);
  }
}

export function readPartMaterialColor(parts: MeshPartInfo[]): (MaterialPaintOptions & { hasTexture?: boolean }) | null {
  const colors: string[] = [];
  let roughness = 0.72;
  let metalness = 0.08;
  let colorOpacity = 1;
  let materialOpacity = 1;
  let hasTexture = false;

  for (const part of parts) {
    if (!isSelectableMeshPart(part) || !part.mesh) continue;
    const materials = ensureMaterialArray(part.mesh);
    for (const index of materialIndicesForPart(part)) {
      const material = materials[index];
      if (!material) continue;
      const pbr = readPbr(material);
      colors.push(pbr.color);
      roughness = pbr.roughness;
      metalness = pbr.metalness;
      colorOpacity = pbr.colorOpacity;
      materialOpacity = pbr.materialOpacity;
      hasTexture = hasTexture || hasStoredTexture(material);
    }
  }

  if (colors.length === 0) return null;
  const unique = [...new Set(colors)];
  const color = unique[0]!;
  return { color, roughness, metalness, colorOpacity, materialOpacity, hasTexture };
}

export async function applyTextureMapToParts(parts: MeshPartInfo[], file: File): Promise<void> {
  const url = URL.createObjectURL(file);
  try {
    const loader = new THREE.TextureLoader();
    const texture = await loader.loadAsync(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    for (const part of parts) {
      if (!isSelectableMeshPart(part) || !part.mesh) continue;
      const mesh = part.mesh;
      const indices = materialIndicesForPart(part);
      let materials = ensureMaterialArray(mesh);

      for (const index of indices) {
        const current = materials[index] ?? materials[0] ?? null;
        const pbr = current ? readPbr(current) : null;
        const paintColor = pbr?.color ?? "#ffffff";
        const next = toStandardMaterial(current, {
          color: paintColor,
          roughness: pbr?.roughness ?? 0.72,
          metalness: pbr?.metalness ?? 0.08,
          colorOpacity: pbr?.colorOpacity ?? 1,
          materialOpacity: pbr?.materialOpacity ?? 1,
        });
        const clonedTexture = texture.clone();
        clonedTexture.needsUpdate = true;
        storeSourceMap(next, clonedTexture);
        applyPaintAppearance(
          next,
          paintColor,
          pbr?.colorOpacity ?? 1,
          pbr?.materialOpacity ?? 1
        );
        materials = setMaterialAtIndex(mesh, index, next);
      }

      commitMeshMaterials(mesh, materials.length === 1 ? materials[0]! : materials);
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
