import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useModelStore } from "@/store/modelStore";

const HIGHLIGHT = new THREE.Color("#38bdf8");

export function ModelRenderer() {
  const model = useModelStore((s) => s.model);
  const meshParts = useModelStore((s) => s.meshParts);
  const wireframe = useModelStore((s) => s.wireframe);
  const showShadows = useModelStore((s) => s.showShadows);
  const showMesh = useModelStore((s) => s.showMesh);
  const flatShading = useModelStore((s) => s.flatShading);
  const doubleSided = useModelStore((s) => s.doubleSided);
  const selectedMeshUuids = useModelStore((s) => s.selectedMeshUuids);
  const selectedParts = useMemo(
    () => meshParts.filter((p) => selectedMeshUuids.includes(p.id) && p.mesh),
    [meshParts, selectedMeshUuids]
  );

  useEffect(() => {
    if (!model) return;

    model.object3D.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = showShadows;
      mesh.receiveShadow = showShadows;
      const partHidden = mesh.userData._partHidden === true;
      mesh.visible = showMesh && !partHidden;

      const selectionsOnMesh = selectedParts.filter((p) => p.mesh === mesh);
      const selectedWhole = selectionsOnMesh.some((p) => p.kind === "mesh");
      const selectedPrimitiveIndices = new Set(
        selectionsOnMesh
          .filter((p) => p.kind === "primitive" && p.geometryGroupIndex != null)
          .map((p) => p.geometryGroupIndex as number)
      );

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const groups = mesh.geometry?.groups ?? [];

      materials.forEach((m, materialIndex) => {
        const material = m as THREE.MeshStandardMaterial;
        if (!material || !("emissive" in material) || !(material.emissive instanceof THREE.Color)) return;
        if ("wireframe" in material) material.wireframe = wireframe;
        if ("flatShading" in material) material.flatShading = flatShading;
        if ("side" in material) material.side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;

        if (!material.userData._baseEmissive) {
          material.userData._baseEmissive = material.emissive.clone();
          material.userData._baseEmissiveIntensity = material.emissiveIntensity ?? 0;
        }

        const groupIndices = groups
          .map((group, index) => (group.materialIndex === materialIndex ? index : -1))
          .filter((index) => index >= 0);
        const primitiveSelected =
          selectedWhole || groupIndices.some((index) => selectedPrimitiveIndices.has(index));

        if (primitiveSelected) {
          material.emissive.copy(HIGHLIGHT);
          material.emissiveIntensity = 0.22;
        } else if (material.userData._baseEmissive instanceof THREE.Color) {
          material.emissive.copy(material.userData._baseEmissive);
          material.emissiveIntensity = material.userData._baseEmissiveIntensity ?? 0;
        }

        material.needsUpdate = true;
      });
    });
  }, [model, wireframe, showShadows, showMesh, flatShading, doubleSided, selectedParts]);

  if (!model) return null;

  return <primitive object={model.object3D} raycast={() => {}} />;
}
