import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { findMeshPartFromHit, isSelectableMeshPart } from "@/lib/mesh-utils";
import { handleMeshEditPointerDown, handleMeshEditPointerMove } from "@/lib/mesh-edit/pointer";
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
  const meshElementMode = useModelStore((s) => s.meshElementMode);
  const pickMeshPart = useModelStore((s) => s.pickMeshPart);
  const { camera } = useThree();

  const selectableById = useMemo(
    () => new Map(meshParts.filter(isSelectableMeshPart).map((p) => [p.id, p])),
    [meshParts]
  );

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
        if (!material) return;
        if ("wireframe" in material) material.wireframe = wireframe;
        if ("flatShading" in material) material.flatShading = flatShading;
        if ("side" in material) material.side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;

        if (!material.userData._baseEmissive && "emissive" in material) {
          material.userData._baseEmissive = material.emissive.clone();
          material.userData._baseEmissiveIntensity = material.emissiveIntensity ?? 0;
        }

        const groupIndices = groups
          .map((group, index) => (group.materialIndex === materialIndex ? index : -1))
          .filter((index) => index >= 0);
        const primitiveSelected =
          selectedWhole || groupIndices.some((index) => selectedPrimitiveIndices.has(index));

        if (primitiveSelected && "emissive" in material) {
          material.emissive.copy(HIGHLIGHT);
          material.emissiveIntensity = 0.22;
        } else if (material.userData._baseEmissive && "emissive" in material) {
          material.emissive.copy(material.userData._baseEmissive as THREE.Color);
          material.emissiveIntensity = material.userData._baseEmissiveIntensity ?? 0;
        }

        material.needsUpdate = true;
      });
    });
  }, [model, wireframe, showShadows, showMesh, flatShading, doubleSided, selectedParts]);

  const onMeshClick = (e: ThreeEvent<MouseEvent>) => {
    if (viewportSelectionTarget !== "parts") return;
    const mesh = e.object as THREE.Mesh;
    if (mesh.isMesh && handleMeshEditPointerDown(e, mesh, camera)) return;

    if (meshElementMode !== "object") return;
    const part = findMeshPartFromHit(e.object, e.faceIndex ?? undefined, selectableById);
    if (!part) return;
    e.stopPropagation();
    pickMeshPartFromClick(pickMeshPart, part.id, selectedMeshUuids, e.nativeEvent);
  };

  const onMeshPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (viewportSelectionTarget !== "parts") return;
    const mesh = e.object as THREE.Mesh;
    if (mesh.isMesh) handleMeshEditPointerMove(e, mesh);
  };

  if (!model) return null;

  return (
    <primitive
      object={model.object3D}
      onClick={viewportSelectionTarget === "parts" ? onMeshClick : undefined}
      onPointerMove={viewportSelectionTarget === "parts" ? onMeshPointerMove : undefined}
      raycast={viewportSelectionTarget === "parts" ? undefined : noopRaycast}
    />
  );
}
