import type { Bone } from "three";
import * as THREE from "three";

export interface BoneTransformSnapshot {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export function captureBoneSnapshot(bone: Bone): BoneTransformSnapshot {
  return {
    position: bone.position.clone(),
    quaternion: bone.quaternion.clone(),
    scale: bone.scale.clone(),
  };
}

/** Apply the same local transform delta as the primary bone to another bone. */
export function applyPrimaryDelta(
  primary: Bone,
  primaryStart: BoneTransformSnapshot,
  target: Bone,
  targetStart: BoneTransformSnapshot
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

export function updateBoneHierarchy(bones: Bone[]) {
  for (const bone of bones) bone.updateMatrixWorld(true);
}
