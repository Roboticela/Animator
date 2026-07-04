import * as THREE from "three";

const SAVED_MATERIALS_KEY = "_animatorSavedMaterials";
const FLAT_PROXY_KEY = "_animatorFlatMaterials";

function createFlatMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x9099a6, roughness: 0.72, metalness: 0.08 });
}

function disposeMaterials(materials: THREE.Material | THREE.Material[]) {
  const list = Array.isArray(materials) ? materials : [materials];
  for (const material of list) material.dispose();
}

/** Remember each mesh's imported materials so we can toggle flat ↔ original. */
export function snapshotMeshMaterials(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || SAVED_MATERIALS_KEY in mesh.userData) return;
    mesh.userData[SAVED_MATERIALS_KEY] = mesh.material;
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
