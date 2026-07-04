import * as THREE from "three";

export const SAVED_MATERIALS_KEY = "_animatorSavedMaterials";
const FLAT_PROXY_KEY = "_animatorFlatMaterials";
export const ROUGHNESS_KEY = "_animatorRoughness";
export const METALNESS_KEY = "_animatorMetalness";

function createFlatMaterial(): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({
    color: 0x9099a6,
    shininess: 28,
    specular: new THREE.Color(0x222222),
  });
}

function disposeMaterials(materials: THREE.Material | THREE.Material[]) {
  const list = Array.isArray(materials) ? materials : [materials];
  for (const material of list) material.dispose();
}

function fixTextureColorSpace(texture: THREE.Texture, colorData: boolean): void {
  texture.colorSpace = colorData ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  texture.needsUpdate = true;
}

export function roughnessToShininess(roughness: number): number {
  return THREE.MathUtils.clamp((1 - roughness) * 100, 1, 100);
}

export function shininessToRoughness(shininess: number): number {
  return THREE.MathUtils.clamp(1 - shininess / 100, 0.04, 1);
}

export function metalnessToSpecular(metalness: number): THREE.Color {
  const value = THREE.MathUtils.clamp(metalness, 0, 1);
  const level = 0.12 + value * 0.88;
  return new THREE.Color(level, level, level);
}

export function specularToMetalness(specular: THREE.Color): number {
  const avg = (specular.r + specular.g + specular.b) / 3;
  return THREE.MathUtils.clamp((avg - 0.12) / 0.88, 0, 1);
}

function configurePhongMaterial(material: THREE.MeshPhongMaterial): void {
  if (material.map) fixTextureColorSpace(material.map, true);
  if (material.emissiveMap) fixTextureColorSpace(material.emissiveMap, true);
  if (material.normalMap) fixTextureColorSpace(material.normalMap, false);
  if (material.alphaMap) fixTextureColorSpace(material.alphaMap, false);
  if (material.bumpMap) fixTextureColorSpace(material.bumpMap, false);
  if (material.specularMap) fixTextureColorSpace(material.specularMap, false);
  material.needsUpdate = true;
}

function configureBasicMaterial(material: THREE.MeshBasicMaterial): void {
  if (material.map) fixTextureColorSpace(material.map, true);
  material.needsUpdate = true;
}

/** Convert GLTF/FBX PBR materials to Phong — reliable diffuse + texture display in the viewport. */
function convertToPhongMaterial(material: THREE.Material): THREE.MeshPhongMaterial | THREE.MeshBasicMaterial {
  if (material instanceof THREE.MeshBasicMaterial) {
    configureBasicMaterial(material);
    return material;
  }

  if (material instanceof THREE.MeshPhongMaterial) {
    configurePhongMaterial(material);
    return material;
  }

  if (material instanceof THREE.MeshLambertMaterial) {
    const phong = new THREE.MeshPhongMaterial({
      name: material.name,
      color: material.color.clone(),
      map: material.map,
      emissive: material.emissive?.clone() ?? new THREE.Color(0x000000),
      emissiveMap: material.emissiveMap,
      emissiveIntensity: material.emissiveIntensity ?? 1,
      transparent: material.transparent,
      opacity: material.opacity,
      alphaMap: material.alphaMap,
      side: material.side,
      vertexColors: material.vertexColors,
      shininess: 12,
      specular: new THREE.Color(0x111111),
    });
    phong.userData[ROUGHNESS_KEY] = 0.9;
    phong.userData[METALNESS_KEY] = 0;
    material.dispose();
    configurePhongMaterial(phong);
    return phong;
  }

  if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
    const roughness = material.roughness ?? 0.5;
    const metalness = material.metalness ?? 0;
    const phong = new THREE.MeshPhongMaterial({
      name: material.name,
      color: material.color.clone(),
      map: material.map,
      normalMap: material.normalMap,
      normalScale: material.normalScale?.clone(),
      emissive: material.emissive?.clone() ?? new THREE.Color(0x000000),
      emissiveMap: material.emissiveMap,
      emissiveIntensity: material.emissiveIntensity ?? 1,
      transparent: material.transparent,
      opacity: material.opacity,
      alphaMap: material.alphaMap,
      side: material.side,
      vertexColors: material.vertexColors,
      shininess: roughnessToShininess(roughness),
      specular: metalnessToSpecular(metalness),
    });
    phong.userData[ROUGHNESS_KEY] = roughness;
    phong.userData[METALNESS_KEY] = metalness;
    material.dispose();
    configurePhongMaterial(phong);
    return phong;
  }

  const fallback = createFlatMaterial();
  fallback.name = material.name;
  material.dispose();
  return fallback;
}

/** Normalize imported materials to Phong/Basic and fix texture color spaces. */
export function normalizeImportedMaterials(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    const hasVertexColors = Boolean(mesh.geometry?.attributes?.color);
    const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const converted = sourceMaterials.map((material) => {
      const next = convertToPhongMaterial(material);
      if (hasVertexColors && "vertexColors" in next) {
        next.vertexColors = true;
      }
      return next;
    });

    mesh.material = converted.length === 1 ? converted[0]! : converted;
  });
}

/** Persist edited materials so flat ↔ original toggles keep user assignments. */
export function commitMeshMaterials(mesh: THREE.Mesh, materials: THREE.Material | THREE.Material[]): void {
  mesh.material = materials;
  mesh.userData[SAVED_MATERIALS_KEY] = materials;
  const flat = mesh.userData[FLAT_PROXY_KEY] as THREE.Material | THREE.Material[] | undefined;
  if (flat) {
    disposeMaterials(flat);
    delete mesh.userData[FLAT_PROXY_KEY];
  }
}

/** Remember each mesh's imported materials so we can toggle flat ↔ original. */
export function snapshotMeshMaterials(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || SAVED_MATERIALS_KEY in mesh.userData) return;
    mesh.userData[SAVED_MATERIALS_KEY] = mesh.material;
  });
}

/** Re-apply texture color-space fixes after edits. */
export function prepareMaterialsForEnvironment(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (material instanceof THREE.MeshPhongMaterial) {
        configurePhongMaterial(material);
      } else if (material instanceof THREE.MeshBasicMaterial) {
        configureBasicMaterial(material);
      }
    }
  });
}

/** Show original materials/textures or replace with neutral flat shading. */
export function applyMaterialPreference(root: THREE.Object3D, showMaterials: boolean): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    if (!(SAVED_MATERIALS_KEY in mesh.userData)) {
      mesh.userData[SAVED_MATERIALS_KEY] = mesh.material;
    }

    if (showMaterials) {
      mesh.material = mesh.userData[SAVED_MATERIALS_KEY] as THREE.Material | THREE.Material[];
      const flat = mesh.userData[FLAT_PROXY_KEY] as THREE.Material | THREE.Material[] | undefined;
      if (flat) {
        disposeMaterials(flat);
        delete mesh.userData[FLAT_PROXY_KEY];
      }
      return;
    }

    if (!mesh.userData[FLAT_PROXY_KEY]) {
      const saved = mesh.userData[SAVED_MATERIALS_KEY] as THREE.Material | THREE.Material[];
      mesh.userData[FLAT_PROXY_KEY] = Array.isArray(saved)
        ? saved.map(() => createFlatMaterial())
        : createFlatMaterial();
    }
    mesh.material = mesh.userData[FLAT_PROXY_KEY] as THREE.Material | THREE.Material[];
  });
}
