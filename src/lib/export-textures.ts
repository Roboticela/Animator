import * as THREE from "three";

const TEXTURE_SLOT_KEYS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "aoMap",
  "emissiveMap",
  "alphaMap",
  "bumpMap",
  "displacementMap",
  "lightMap",
  "envMap",
  "specularMap",
] as const;

export function stripTexturesFromObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((material) => stripMaterialTextures(material));
      return;
    }

    mesh.material = stripMaterialTextures(mesh.material);
  });
}

function stripMaterialTextures(material: THREE.Material): THREE.Material {
  const next = material.clone();
  for (const key of TEXTURE_SLOT_KEYS) {
    if (key in next) {
      (next as unknown as Record<string, unknown>)[key] = null;
    }
  }
  next.needsUpdate = true;
  return next;
}

/** Deep-clones the scene graph for export; optionally strips texture maps. */
export function cloneSceneForExport(root: THREE.Object3D, includeTextures: boolean): THREE.Object3D {
  if (includeTextures) return root;
  const clone = root.clone(true);
  stripTexturesFromObject(clone);
  return clone;
}

export function disposeClonedExportRoot(root: THREE.Object3D, includeTextures: boolean): void {
  if (includeTextures) return;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      material?.dispose();
    }
  });
}

export function ensureMaterialNames(root: THREE.Object3D): void {
  let index = 0;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const apply = (material: THREE.Material) => {
      if (!material.name?.trim()) {
        material.name = `Material_${++index}`;
      }
    };
    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else apply(mesh.material);
  });
}

export async function textureToPngBytes(texture: THREE.Texture): Promise<Uint8Array | null> {
  const image = texture.image as
    | HTMLImageElement
    | HTMLCanvasElement
    | ImageBitmap
    | { width: number; height: number; data?: Uint8ClampedArray }
    | undefined;

  if (!image || !("width" in image) || image.width <= 0 || image.height <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if ("data" in image && image.data instanceof Uint8ClampedArray) {
    const imageData = new ImageData(image.data, image.width, image.height);
    ctx.putImageData(imageData, 0, 0);
  } else {
    ctx.drawImage(image as CanvasImageSource, 0, 0);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return null;
  return new Uint8Array(await blob.arrayBuffer());
}

export function collectUniqueTextures(root: THREE.Object3D): THREE.Texture[] {
  const seen = new Set<THREE.Texture>();
  const textures: THREE.Texture[] = [];

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      for (const key of TEXTURE_SLOT_KEYS) {
        const texture = (material as unknown as Record<string, THREE.Texture | null | undefined>)[key];
        if (!texture || seen.has(texture)) continue;
        seen.add(texture);
        textures.push(texture);
      }
    }
  });

  return textures;
}

export function buildObjMtl(root: THREE.Object3D): string {
  const materials = new Map<string, THREE.Material>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of mats) {
      if (!materials.has(material.uuid)) materials.set(material.uuid, material);
    }
  });

  const lines: string[] = ["# Roboticela Animator OBJ export"];
  for (const material of materials.values()) {
    lines.push("", `newmtl ${material.name}`);
    const color =
      material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhongMaterial
        ? material.color
        : material instanceof THREE.MeshBasicMaterial
          ? material.color
          : new THREE.Color(0.8, 0.8, 0.8);
    lines.push(`Kd ${color.r} ${color.g} ${color.b}`);

    const map =
      material instanceof THREE.MeshStandardMaterial ||
      material instanceof THREE.MeshPhongMaterial ||
      material instanceof THREE.MeshBasicMaterial
        ? material.map
        : null;
    if (map) {
      const fileName = `${sanitizeFileName(material.name)}.png`;
      lines.push(`map_Kd textures/${fileName}`);
    }

    if (material.transparent || material.opacity < 1) {
      lines.push(`d ${material.opacity}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").replace(/^-+|-+$/g, "") || "texture";
}

export function decodeColladaTextureData(data: string): Uint8Array {
  if (data.startsWith("data:")) {
    const base64 = data.split(",")[1] ?? "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new TextEncoder().encode(data);
}
