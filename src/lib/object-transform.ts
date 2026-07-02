import type { Object3D } from "three";
import * as THREE from "three";

export interface ObjectTransformSnapshot {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export function captureObjectSnapshot(object: Object3D): ObjectTransformSnapshot {
  return {
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
  };
}

/** Apply the same local transform delta as the primary object to another object. */
export function applyPrimaryObjectDelta(
  primary: Object3D,
  primaryStart: ObjectTransformSnapshot,
  target: Object3D,
  targetStart: ObjectTransformSnapshot
) {
  const deltaQuat = primary.quaternion.clone().multiply(primaryStart.quaternion.clone().invert());
  const deltaPos = primary.position.clone().sub(primaryStart.position);
  const deltaScale = new THREE.Vector3(
    primaryStart.scale.x !== 0 ? primary.scale.x / primaryStart.scale.x : 1,
    primaryStart.scale.y !== 0 ? primary.scale.y / primaryStart.scale.y : 1,
    primaryStart.scale.z !== 0 ? primary.scale.z / primaryStart.scale.z : 1
  );

  target.position.copy(targetStart.position).add(deltaPos);
  target.quaternion.copy(deltaQuat).multiply(targetStart.quaternion);
  target.scale.set(
    targetStart.scale.x * deltaScale.x,
    targetStart.scale.y * deltaScale.y,
    targetStart.scale.z * deltaScale.z
  );
}

export function updateObjectHierarchy(objects: Object3D[]) {
  for (const object of objects) object.updateMatrixWorld(true);
}
