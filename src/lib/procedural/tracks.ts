import * as THREE from "three";
import type { BoneRole } from "@/types/model";
import { clamp01 } from "@/lib/procedural/easing";

export const TAU = Math.PI * 2;
export const AXIS_X = new THREE.Vector3(1, 0, 0);
export const AXIS_Y = new THREE.Vector3(0, 1, 0);
export const AXIS_Z = new THREE.Vector3(0, 0, 1);

export type RoleMap = Partial<Record<BoneRole, THREE.Bone>>;

export function ensureRootName(root: THREE.Object3D) {
  if (!root.name) root.name = "__ModelRoot__";
  return root.name;
}

/** Use a stable animation target name on cloned preview roots. */
export function ensureAnimationRootName(root: THREE.Object3D, name = "__PreviewAnimRoot__") {
  root.name = name;
  return name;
}

export function modelExtents(root: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return { width: 1, height: 1, depth: 1 };
  const size = box.getSize(new THREE.Vector3());
  return { width: Math.max(size.x, 0.1), height: Math.max(size.y, 0.1), depth: Math.max(size.z, 0.1) };
}

export function prepareMeshOpacity(root: THREE.Object3D) {
  let meshIndex = 0;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (!mesh.name) {
      mesh.name = `__AnimMesh_${meshIndex}`;
      meshIndex += 1;
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((m) => {
      if (!m) return;
      m.transparent = true;
      m.needsUpdate = true;
    });
  });
}

export function quaternionTrack(
  bone: THREE.Bone,
  duration: number,
  samples: number,
  axis: THREE.Vector3,
  angleFn: (t: number) => number
): THREE.QuaternionKeyframeTrack {
  const rest = bone.quaternion.clone();
  const times: number[] = [];
  const values: number[] = [];
  const delta = new THREE.Quaternion();
  const q = new THREE.Quaternion();

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * duration;
    delta.setFromAxisAngle(axis, angleFn(t));
    q.copy(rest).multiply(delta);
    times.push(t);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values);
}

export function positionTrack(
  bone: THREE.Bone,
  duration: number,
  samples: number,
  offsetFn: (t: number) => THREE.Vector3
): THREE.VectorKeyframeTrack {
  const rest = bone.position.clone();
  const times: number[] = [];
  const values: number[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * duration;
    const off = offsetFn(t);
    times.push(t);
    values.push(rest.x + off.x, rest.y + off.y, rest.z + off.z);
  }
  return new THREE.VectorKeyframeTrack(`${bone.name}.position`, times, values);
}

export function rootPositionTrack(
  root: THREE.Object3D,
  duration: number,
  samples: number,
  offsetFn: (t: number, duration: number) => THREE.Vector3
): THREE.VectorKeyframeTrack {
  const rest = root.position.clone();
  const times: number[] = [];
  const values: number[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * duration;
    const off = offsetFn(t, duration);
    times.push(t);
    values.push(rest.x + off.x, rest.y + off.y, rest.z + off.z);
  }
  return new THREE.VectorKeyframeTrack(`${ensureRootName(root)}.position`, times, values);
}

export function rootScaleTrack(
  root: THREE.Object3D,
  duration: number,
  samples: number,
  scaleFn: (t: number, duration: number) => number
): THREE.VectorKeyframeTrack {
  const rest = root.scale.clone();
  const times: number[] = [];
  const values: number[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * duration;
    const m = scaleFn(t, duration);
    times.push(t);
    values.push(rest.x * m, rest.y * m, rest.z * m);
  }
  return new THREE.VectorKeyframeTrack(`${ensureRootName(root)}.scale`, times, values);
}

export function rootQuaternionTrack(
  root: THREE.Object3D,
  duration: number,
  samples: number,
  angleFn: (t: number, duration: number) => number,
  axis: THREE.Vector3 = AXIS_Y
): THREE.QuaternionKeyframeTrack {
  const rest = root.quaternion.clone();
  const times: number[] = [];
  const values: number[] = [];
  const delta = new THREE.Quaternion();
  const q = new THREE.Quaternion();

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * duration;
    delta.setFromAxisAngle(axis, angleFn(t, duration));
    q.copy(rest).multiply(delta);
    times.push(t);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${ensureRootName(root)}.quaternion`, times, values);
}

export function meshOpacityTracks(
  root: THREE.Object3D,
  duration: number,
  samples: number,
  opacityFn: (t: number, duration: number) => number
): THREE.NumberKeyframeTrack[] {
  const tracks: THREE.NumberKeyframeTrack[] = [];

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (!mesh.name) {
      mesh.name = `__AnimMesh_${tracks.length}`;
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((material, index) => {
      if (!material) return;
      const times: number[] = [];
      const values: number[] = [];
      const base = material.opacity ?? 1;

      for (let i = 0; i <= samples; i++) {
        const t = (i / samples) * duration;
        times.push(t);
        values.push(base * clamp01(opacityFn(t, duration)));
      }

      const path =
        materials.length > 1 ? `${mesh.name}.material[${index}].opacity` : `${mesh.name}.material.opacity`;
      tracks.push(new THREE.NumberKeyframeTrack(path, times, values));
    });
  });

  return tracks;
}

export function addRotation(
  tracks: THREE.KeyframeTrack[],
  roles: RoleMap,
  role: BoneRole,
  duration: number,
  samples: number,
  axis: THREE.Vector3,
  angleFn: (t: number) => number
) {
  const bone = roles[role];
  if (!bone) return;
  tracks.push(quaternionTrack(bone, duration, samples, axis, angleFn));
}
