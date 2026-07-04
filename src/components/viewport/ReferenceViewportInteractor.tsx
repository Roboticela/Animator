import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { pickReferenceFromClick, useModelStore } from "@/store/modelStore";
import { referenceIdFromObject } from "@/lib/reference-import";

function collectReferenceMeshes(): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  for (const ref of useModelStore.getState().references) {
    if (!ref.visible) continue;
    ref.root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) meshes.push(mesh);
    });
  }
  return meshes;
}

/** Viewport picking for session-only reference objects. */
export function ReferenceViewportInteractor() {
  const references = useModelStore((s) => s.references);
  const viewportSelectionTarget = useModelStore((s) => s.viewportSelectionTarget);
  const { camera, raycaster, gl } = useThree();
  const pointer = useRef(new THREE.Vector2());

  useEffect(() => {
    if (references.length === 0 || viewportSelectionTarget !== "references") return;

    const canvas = gl.domElement;

    const updatePointer = (event: MouseEvent | PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer.current, camera);
    };

    const raycast = () => {
      const meshes = collectReferenceMeshes();
      if (meshes.length === 0) return null;
      const hits = raycaster.intersectObjects(meshes, false);
      return hits[0] ?? null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.target !== canvas) return;
      if (event.button !== 0) return;
      updatePointer(event);
      const hit = raycast();
      if (!hit) return;

      const id = referenceIdFromObject(hit.object);
      if (!id) return;

      const state = useModelStore.getState();
      pickReferenceFromClick(
        state.pickReference,
        id,
        state.selectedReferenceIds,
        event
      );
      event.stopPropagation();
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.target !== canvas) return;
      updatePointer(event);
      const hit = raycast();
      const id = hit ? referenceIdFromObject(hit.object) : null;
      useModelStore.getState().setHoveredReference(id);
    };

    canvas.addEventListener("pointerdown", onPointerDown, { capture: true });
    canvas.addEventListener("pointermove", onPointerMove);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown, { capture: true });
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, [references, viewportSelectionTarget, camera, raycaster, gl]);

  return null;
}
