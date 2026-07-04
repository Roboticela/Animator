import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useModelStore } from "@/store/modelStore";
import { frameBoxOnCamera } from "@/lib/viewport-camera";

function frameModel(model: NonNullable<ReturnType<typeof useModelStore.getState>["model"]>, camera: THREE.Camera, controls: OrbitControlsImpl | null) {
  const box = new THREE.Box3().setFromObject(model.object3D);
  frameBoxOnCamera(box, camera, controls, 1.7);
}

function frameBones(
  boneNames: string[],
  boneMap: ReturnType<typeof useModelStore.getState>["boneMap"],
  camera: THREE.Camera,
  controls: OrbitControlsImpl | null
) {
  const box = new THREE.Box3();
  const p = new THREE.Vector3();
  for (const name of boneNames) {
    const bone = boneMap.get(name)?.bone;
    if (!bone) continue;
    bone.getWorldPosition(p);
    box.expandByPoint(p);
  }
  if (!box.isEmpty()) box.expandByScalar(0.15);
  frameBoxOnCamera(box, camera, controls, 2.2);
}

export function ViewportCamera() {
  const model = useModelStore((s) => s.model);
  const sceneRadius = useModelStore((s) => s.sceneRadius);
  const orthographicCamera = useModelStore((s) => s.orthographicCamera);
  const autoRotate = useModelStore((s) => s.autoRotate);
  const frameCameraTick = useModelStore((s) => s.frameCameraTick);
  const frameSelectionTick = useModelStore((s) => s.frameSelectionTick);

  const { camera, set, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const savedPerspective = useRef<{ position: THREE.Vector3; quaternion: THREE.Quaternion; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const target = controlsRef.current?.target.clone() ?? new THREE.Vector3();

    if (orthographicCamera && !(camera instanceof THREE.OrthographicCamera)) {
      savedPerspective.current = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        target,
      };
      const frustum = sceneRadius * 2.5;
      const ortho = new THREE.OrthographicCamera((-frustum * aspect) / 2, (frustum * aspect) / 2, frustum / 2, -frustum / 2, 0.01, 1000);
      ortho.position.copy(camera.position);
      ortho.quaternion.copy(camera.quaternion);
      set({ camera: ortho });
    } else if (!orthographicCamera && !(camera instanceof THREE.PerspectiveCamera)) {
      const persp = new THREE.PerspectiveCamera(45, aspect, 0.01, 1000);
      if (savedPerspective.current) {
        persp.position.copy(savedPerspective.current.position);
        persp.quaternion.copy(savedPerspective.current.quaternion);
      } else {
        persp.position.copy(camera.position);
        persp.quaternion.copy(camera.quaternion);
      }
      persp.updateProjectionMatrix();
      set({ camera: persp });
      if (controlsRef.current && savedPerspective.current) {
        controlsRef.current.target.copy(savedPerspective.current.target);
        controlsRef.current.update();
      }
    } else if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    } else if (camera instanceof THREE.OrthographicCamera) {
      const frustum = sceneRadius * 2.5;
      camera.left = (-frustum * aspect) / 2;
      camera.right = (frustum * aspect) / 2;
      camera.top = frustum / 2;
      camera.bottom = -frustum / 2;
      camera.updateProjectionMatrix();
    }
  }, [orthographicCamera, sceneRadius, size, camera, set]);

  useEffect(() => {
    if (!model) return;
    frameModel(model, camera, controlsRef.current);
  }, [model, frameCameraTick, camera]);

  useEffect(() => {
    const { selectedBoneNames, selectedReferenceIds, references, boneMap } = useModelStore.getState();
    if (selectedReferenceIds.length > 0 && useModelStore.getState().viewportSelectionTarget === "references") {
      const box = new THREE.Box3();
      for (const id of selectedReferenceIds) {
        const ref = references.find((r) => r.id === id);
        if (ref?.root) box.expandByObject(ref.root);
      }
      if (!box.isEmpty()) frameBoxOnCamera(box, camera, controlsRef.current, 2);
      return;
    }
    if (selectedBoneNames.length === 0) return;
    frameBones(selectedBoneNames, boneMap, camera, controlsRef.current);
  }, [frameSelectionTick, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      autoRotate={autoRotate}
      autoRotateSpeed={0.85}
    />
  );
}
