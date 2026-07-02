import { useEffect } from "react";
import * as THREE from "three";
import { useModelStore } from "@/store/modelStore";

export function ModelRenderer() {
  const model = useModelStore((s) => s.model);
  const wireframe = useModelStore((s) => s.wireframe);
  const showShadows = useModelStore((s) => s.showShadows);

  useEffect(() => {
    if (!model) return;
    model.object3D.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = showShadows;
      mesh.receiveShadow = showShadows;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((m) => {
        const material = m as THREE.MeshStandardMaterial;
        if (material && "wireframe" in material) material.wireframe = wireframe;
      });
    });
  }, [model, wireframe, showShadows]);

  if (!model) return null;
  return <primitive object={model.object3D} />;
}
