import { useEffect } from "react";
import * as THREE from "three";
import { useModelStore } from "@/store/modelStore";

export function ModelRenderer() {
  const model = useModelStore((s) => s.model);
  const wireframe = useModelStore((s) => s.wireframe);
  const showShadows = useModelStore((s) => s.showShadows);
  const showMesh = useModelStore((s) => s.showMesh);
  const flatShading = useModelStore((s) => s.flatShading);
  const doubleSided = useModelStore((s) => s.doubleSided);

  useEffect(() => {
    if (!model) return;
    model.object3D.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = showShadows;
      mesh.receiveShadow = showShadows;
      mesh.visible = showMesh;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((m) => {
        const material = m as THREE.MeshStandardMaterial;
        if (!material) return;
        if ("wireframe" in material) material.wireframe = wireframe;
        if ("flatShading" in material) material.flatShading = flatShading;
        if ("side" in material) material.side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;
        material.needsUpdate = true;
      });
    });
  }, [model, wireframe, showShadows, showMesh, flatShading, doubleSided]);

  if (!model) return null;
  return <primitive object={model.object3D} />;
}
