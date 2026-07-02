import type { Bone } from "three";

export interface BoneTransformClipboard {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
}

const clipboard = new Map<string, BoneTransformClipboard>();

export function copyBoneTransforms(bones: Bone[]): number {
  clipboard.clear();
  for (const bone of bones) {
    clipboard.set(bone.name, {
      position: bone.position.toArray() as [number, number, number],
      quaternion: bone.quaternion.toArray() as [number, number, number, number],
      scale: bone.scale.toArray() as [number, number, number],
    });
  }
  return clipboard.size;
}

export function pasteBoneTransforms(bones: Bone[]): number {
  let count = 0;
  for (const bone of bones) {
    const data = clipboard.get(bone.name);
    if (!data) continue;
    bone.position.fromArray(data.position);
    bone.quaternion.fromArray(data.quaternion);
    bone.scale.fromArray(data.scale);
    count += 1;
  }
  return count;
}

export function hasBoneClipboard(): boolean {
  return clipboard.size > 0;
}

/** Mirror selected bone transforms across the X axis (YZ plane). */
export function mirrorBonesOnX(bones: Bone[]): void {
  for (const bone of bones) {
    bone.position.x *= -1;
    bone.quaternion.x *= -1;
    bone.quaternion.w *= -1;
    bone.quaternion.normalize();
  }
}
