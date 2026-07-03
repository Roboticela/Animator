import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useModelStore } from "@/store/modelStore";
import { findMeshPartFromHit, isSelectableMeshPart } from "@/lib/mesh-utils";
import {
  handleMeshViewportHit,
  handleMeshViewportPointerMove,
  raycastMeshes,
  resolveMeshRaycastOptions,
} from "@/lib/mesh-edit/viewport-interaction";

function meshHoverAllowed() {
  const state = useModelStore.getState();
  if (state.viewportSelectionTarget !== "parts") return false;
  if (state.meshElementMode !== "object") return false;
  return state.meshEditTool === "select";
}

/** Reliable mesh picking for imported GLTF scenes (primitive onClick is unreliable). */
export function MeshViewportInteractor() {
  const model = useModelStore((s) => s.model);
  const viewportSelectionTarget = useModelStore((s) => s.viewportSelectionTarget);
  const { camera, raycaster, gl } = useThree();
  const pointer = useRef(new THREE.Vector2());

  useEffect(() => {
    if (!model || viewportSelectionTarget !== "parts") return;

    const canvas = gl.domElement;

    const updatePointer = (event: MouseEvent | PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer.current, camera);
    };

    const raycast = () => raycastMeshes(model.object3D, raycaster, resolveMeshRaycastOptions());

    const updateMeshHover = (hit: ReturnType<typeof raycast>) => {
      if (!meshHoverAllowed()) {
        useModelStore.getState().setHoveredMeshPart(null);
        return;
      }
      if (!hit) {
        useModelStore.getState().setHoveredMeshPart(null);
        return;
      }
      const state = useModelStore.getState();
      const selectableById = new Map(
        state.meshParts.filter(isSelectableMeshPart).map((p) => [p.id, p])
      );
      const part = findMeshPartFromHit(hit.mesh, hit.faceIndex, selectableById);
      state.setHoveredMeshPart(part?.id ?? null);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.target !== canvas) return;
      if (event.button !== 0) return;
      updatePointer(event);
      const hit = raycast();
      if (!hit) return;
      const handled = handleMeshViewportHit(hit, event, camera);
      if (handled) {
        event.stopPropagation();
        event.preventDefault();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.target !== canvas) return;
      updatePointer(event);
      const hit = raycast();
      if (handleMeshViewportPointerMove(hit)) return;
      updateMeshHover(hit);
    };

    canvas.addEventListener("pointerdown", onPointerDown, { capture: true });
    canvas.addEventListener("pointermove", onPointerMove);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown, { capture: true });
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, [model, viewportSelectionTarget, camera, raycaster, gl]);

  return null;
}
