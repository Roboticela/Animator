import * as THREE from "three";
import {
  getStoredTexturePath,
  setStoredTexturePath,
  textureBasename,
  textureStem,
  type TextureSlot,
} from "@/lib/texture-maps";

export const SCENE_FBX_TEXTURE_PATHS_KEY = "_animatorFbxTexturePaths";

const IMAGE_PATH_EXT = /\.(png|jpe?g|webp|bmp|tga|gif|hdr)$/i;

const SLOT_FROM_PATH = [
  { pattern: /(base[_-]?color|diffuse|albedo|color[_-]?map)/i, slot: "map" as const },
  { pattern: /(normal|norm|nrm|normalmap)/i, slot: "normalMap" as const },
  { pattern: /(cutout|opacity|alpha|transparency|transparent)/i, slot: "alphaMap" as const },
  { pattern: /(refl|reflection|specular|gloss)/i, slot: "specularMap" as const },
  { pattern: /(bump|height|displacement)/i, slot: "bumpMap" as const },
  { pattern: /(emissive|emit|glow)/i, slot: "emissiveMap" as const },
];

const MAX_3DS_RELATIONSHIPS: Array<{ pattern: RegExp; slot: TextureSlot }> = [
  { pattern: /base[_-]?color/i, slot: "map" },
  { pattern: /diffuse/i, slot: "map" },
  { pattern: /cutout/i, slot: "alphaMap" },
  { pattern: /opacity/i, slot: "alphaMap" },
  { pattern: /refl/i, slot: "specularMap" },
  { pattern: /normal/i, slot: "normalMap" },
  { pattern: /bump/i, slot: "bumpMap" },
  { pattern: /emissive/i, slot: "emissiveMap" },
];

export function getSceneFbxTexturePaths(root: THREE.Object3D): string[] {
  const paths = root.userData[SCENE_FBX_TEXTURE_PATHS_KEY];
  return Array.isArray(paths) ? paths.filter((path): path is string => typeof path === "string") : [];
}

function inferSlotFromPath(path: string): TextureSlot {
  const lower = path.toLowerCase();
  for (const { pattern, slot } of SLOT_FROM_PATH) {
    if (pattern.test(lower)) return slot;
  }
  return "map";
}

function inferSlotFromRelationship(relationship: string): TextureSlot | null {
  for (const { pattern, slot } of MAX_3DS_RELATIONSHIPS) {
    if (pattern.test(relationship)) return slot;
  }
  return null;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function materialMatchesPath(materialName: string, path: string): boolean {
  const mat = normalizeName(materialName);
  if (!mat) return false;

  const base = normalizeName(textureBasename(path));
  const stem = normalizeName(textureStem(path));
  if (!base && !stem) return false;

  if (base.includes(mat) || stem.includes(mat) || mat.includes(stem)) return true;

  const compactMat = mat.replace(/_/g, "");
  const compactStem = stem.replace(/_/g, "");
  return compactStem.includes(compactMat) || compactMat.includes(compactStem);
}

/** Pulls image path strings embedded in ASCII or binary FBX files. */
export function extractImagePathsFromFbxBuffer(buffer: ArrayBuffer): string[] {
  const bytes = new Uint8Array(buffer);
  const paths = new Set<string>();
  let current = "";

  const pushPath = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 512 || !IMAGE_PATH_EXT.test(trimmed)) return;
    paths.add(trimmed.replace(/\\/g, "/"));
    paths.add(textureBasename(trimmed));
  };

  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i]!;
    if (c >= 32 && c <= 126) {
      current += String.fromCharCode(c);
    } else {
      pushPath(current);
      current = "";
    }
  }
  pushPath(current);

  const text = new TextDecoder("latin1").decode(bytes);
  for (const match of text.matchAll(/"([^"]+\.(?:png|jpe?g|webp|bmp|tga|gif|hdr))"/gi)) {
    pushPath(match[1] ?? "");
  }

  return [...paths];
}

/** Parses 3ds Max FBX connection hints like `3dsMax|Parameters|base_color_map` near image paths. */
function extractMaxRelationshipBindings(buffer: ArrayBuffer): Array<{ relationship: string; path: string }> {
  const text = new TextDecoder("latin1").decode(new Uint8Array(buffer));
  const bindings: Array<{ relationship: string; path: string }> = [];

  const relPattern =
    /3dsMax\|Parameters\|[A-Za-z0-9_]+[\s\S]{0,400}?([A-Za-z0-9_./\\-]+\.(?:png|jpe?g|webp|bmp|tga|gif|hdr))/gi;

  for (const match of text.matchAll(relPattern)) {
    const relationship = match[0].split(/[\s"]/)[0] ?? "";
    const path = match[1];
    if (relationship && path) bindings.push({ relationship, path: path.replace(/\\/g, "/") });
  }

  return bindings;
}

function collectMaterials(root: THREE.Object3D): THREE.Material[] {
  const seen = new Set<string>();
  const materials: THREE.Material[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of list) {
      if (!material || seen.has(material.uuid)) continue;
      seen.add(material.uuid);
      materials.push(material);
    }
  });
  return materials;
}

/**
 * FBXLoader skips 3ds Max Physical Material maps. Harvest paths from the FBX
 * payload so folder linking and filename matching can still resolve textures.
 */
export function applyFbxTexturePathHints(buffer: ArrayBuffer, root: THREE.Object3D): number {
  const materials = collectMaterials(root);
  if (materials.length === 0) return 0;

  const imagePaths = extractImagePathsFromFbxBuffer(buffer);
  root.userData[SCENE_FBX_TEXTURE_PATHS_KEY] = imagePaths;

  let stored = 0;

  for (const { relationship, path } of extractMaxRelationshipBindings(buffer)) {
    const slot = inferSlotFromRelationship(relationship);
    if (!slot) continue;

    for (const material of materials) {
      if (!materialMatchesPath(material.name, path)) continue;
      if (getStoredTexturePath(material, slot)) continue;
      setStoredTexturePath(material, slot, path);
      stored += 1;
    }
  }

  for (const path of imagePaths) {
    const slot = inferSlotFromPath(path);
    let assigned = false;

    for (const material of materials) {
      if (!materialMatchesPath(material.name, path)) continue;
      if (getStoredTexturePath(material, slot)) continue;
      setStoredTexturePath(material, slot, path);
      stored += 1;
      assigned = true;
    }

    if (assigned) continue;

    const pathStem = normalizeName(textureStem(path));
    for (const material of materials) {
      if (getStoredTexturePath(material, slot)) continue;
      const matStem = normalizeName(material.name);
      if (!matStem || !pathStem) continue;
      if (pathStem.includes(matStem) || matStem.includes(pathStem)) {
        setStoredTexturePath(material, slot, path);
        stored += 1;
        assigned = true;
        break;
      }
    }
  }

  return stored;
}
