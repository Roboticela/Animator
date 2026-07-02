import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { findMeshPartFromHit } from "@/lib/mesh-utils";
import { pickMeshPartFromClick, useModelStore } from "@/store/modelStore";

const HIGHLIGHT = new THREE.Color("#38bdf8");
const noopRaycast = () => {};

export function ModelRenderer() {
  const model = useModelStore((s) => s.model);
  const meshParts = useModelStore((s) => s.meshParts);
  const wireframe = useModelStore((s) => s.wireframe);
  const showShadows = useModelStore((s) => s.showShadows);
  const showMesh = useModelStore((s) => s.showMesh);
  const flatShading = useModelStore((s) => s.flatShading);
  const doubleSided = useModelStore((s) => s.doubleSided);
  const selectedMeshUuids = useModelStore((s) => s.selectedMeshUuids);
  const viewportSelectionTarget = useModelStore((s) => s.viewportSelectionTarget);
  const pickMeshPart = useModelStore((s) => s.pickMeshPart);

  const partsByUuid = useMemo(() => new Map(meshParts.map((p) => [p.uuid, p])), [meshParts]);

  useEffect(() => {
    if (!model) return;
    const selected = new Set(selectedMeshUuids);
    model.object3D.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = showShadows;
      mesh.receiveShadow = showShadows;
      const partHidden = mesh.userData._partHidden === true;
      mesh.visible = showMesh && !partHidden;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((m) => {
        const material = m as THREE.MeshStandardMaterial;
        if (!material) return;
        if ("wireframe" in material) material.wireframe = wireframe;
        if ("flatShading" in material) material.flatShading = flatShading;
        if ("side" in material) material.side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;

        if (!material.userData._baseEmissive && "emissive" in material) {
          material.userData._baseEmissive = material.emissive.clone();
          material.userData._baseEmissiveIntensity = material.emissiveIntensity ?? 0;
        }

        if (selected.has(obj.uuid) && "emissive" in material) {
          material.emissive.copy(HIGHLIGHT);
          material.emissiveIntensity = 0.22;
        } else if (material.userData._baseEmissive && "emissive" in material) {
          material.emissive.copy(material.userData._baseEmissive as THREE.Color);
          material.emissiveIntensity = material.userData._baseEmissiveIntensity ?? 0;
        }

        material.needsUpdate = true;
      });
    });
  }, [model, wireframe, showShadows, showMesh, flatShading, doubleSided, selectedMeshUuids]);

  const onMeshClick = (e: ThreeEvent<MouseEvent>) => {
    if (viewportSelectionTarget !== "parts") return;
    const part = findMeshPartFromHit(e.object, partsByUuid);
    if (!part) return;
    e.stopPropagation();
    pickMeshPartFromClick(pickMeshPart, part.uuid, selectedMeshUuids, e.nativeEvent);
  };

  if (!model) return null;

  return (
    <primitive
      object={model.object3D}
      onClick={viewportSelectionTarget === "parts" ? onMeshClick : undefined}
      raycast={viewportSelectionTarget === "parts" ? undefined : noopRaycast}
    />
  );
}
