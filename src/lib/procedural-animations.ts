import * as THREE from "three";
import { matchBoneRoles } from "@/lib/bone-utils";
import type { BoneInfo, BoneRole } from "@/types/model";

export type ProceduralAnimationId = "idle" | "walk" | "run" | "wave" | "jump" | "spin" | "dance";

export interface ProceduralAnimationDef {
  id: ProceduralAnimationId;
  name: string;
  description: string;
  duration: number;
}

export const PROCEDURAL_ANIMATIONS: ProceduralAnimationDef[] = [
  { id: "idle", name: "Idle", description: "Subtle breathing sway", duration: 3 },
  { id: "walk", name: "Walk", description: "Basic humanoid walk cycle", duration: 1.1 },
  { id: "run", name: "Run", description: "Faster stride with arm pump", duration: 0.6 },
  { id: "wave", name: "Wave", description: "Raise an arm and wave hello", duration: 1.6 },
  { id: "jump", name: "Jump", description: "Hopping jump loop", duration: 0.9 },
  { id: "spin", name: "Spin", description: "Full turn on the spot", duration: 1.4 },
  { id: "dance", name: "Dance", description: "Playful combo move", duration: 4 },
];

const TAU = Math.PI * 2;
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

type RoleMap = Partial<Record<BoneRole, THREE.Bone>>;

function quaternionTrack(
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

function positionTrack(
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

function addRotation(
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

function buildIdle(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const freq = TAU / duration;

  addRotation(tracks, roles, "chest", duration, samples, X, (t) => Math.sin(t * freq) * 0.025);
  addRotation(tracks, roles, "spine", duration, samples, X, (t) => Math.sin(t * freq) * 0.015);
  addRotation(tracks, roles, "head", duration, samples, Y, (t) => Math.sin(t * freq * 2) * 0.04);
  addRotation(tracks, roles, "shoulderL", duration, samples, Z, (t) => Math.sin(t * freq) * 0.03);
  addRotation(tracks, roles, "shoulderR", duration, samples, Z, (t) => -Math.sin(t * freq) * 0.03);

  const hips = roles.hips;
  if (hips) tracks.push(positionTrack(hips, duration, samples, (t) => new THREE.Vector3(0, Math.sin(t * freq) * 0.008, 0)));

  return tracks;
}

function buildWalkLike(roles: RoleMap, duration: number, legAmp: number, armAmp: number, kneeAmp: number, hipBob: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 40;
  const freq = TAU / duration;

  addRotation(tracks, roles, "upperLegL", duration, samples, X, (t) => Math.sin(t * freq) * legAmp);
  addRotation(tracks, roles, "upperLegR", duration, samples, X, (t) => Math.sin(t * freq + Math.PI) * legAmp);
  addRotation(tracks, roles, "lowerLegL", duration, samples, X, (t) => Math.max(0, -Math.sin(t * freq)) * kneeAmp);
  addRotation(tracks, roles, "lowerLegR", duration, samples, X, (t) => Math.max(0, -Math.sin(t * freq + Math.PI)) * kneeAmp);

  addRotation(tracks, roles, "upperArmL", duration, samples, X, (t) => Math.sin(t * freq + Math.PI) * armAmp);
  addRotation(tracks, roles, "upperArmR", duration, samples, X, (t) => Math.sin(t * freq) * armAmp);
  addRotation(tracks, roles, "lowerArmL", duration, samples, X, (t) => Math.max(0, Math.sin(t * freq + Math.PI)) * armAmp * 0.6);
  addRotation(tracks, roles, "lowerArmR", duration, samples, X, (t) => Math.max(0, Math.sin(t * freq)) * armAmp * 0.6);

  addRotation(tracks, roles, "chest", duration, samples, Y, (t) => Math.sin(t * freq) * 0.05);
  addRotation(tracks, roles, "spine", duration, samples, Z, (t) => Math.sin(t * freq) * 0.02);

  const hips = roles.hips;
  if (hips) {
    tracks.push(positionTrack(hips, duration, samples, (t) => new THREE.Vector3(0, Math.abs(Math.sin(t * freq)) * hipBob, 0)));
  }
  addRotation(tracks, roles, "hips", duration, samples, Y, (t) => Math.sin(t * freq) * 0.04);

  return tracks;
}

function buildWave(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const cycles = 3;
  const freq = (TAU * cycles) / duration;

  addRotation(tracks, roles, "shoulderR", duration, samples, Z, () => 0.35);
  addRotation(tracks, roles, "upperArmR", duration, samples, Z, () => 1.15);
  addRotation(tracks, roles, "lowerArmR", duration, samples, Y, (t) => Math.sin(t * freq) * 0.5);
  addRotation(tracks, roles, "handR", duration, samples, Y, (t) => Math.sin(t * freq) * 0.25);
  addRotation(tracks, roles, "head", duration, samples, Y, (t) => Math.sin((t * freq) / cycles) * 0.08);

  return tracks;
}

function buildJump(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const freq = Math.PI / duration; // half sine == single hop per loop

  const hips = roles.hips;
  if (hips) {
    tracks.push(positionTrack(hips, duration, samples, (t) => new THREE.Vector3(0, Math.sin(t * freq) * 0.22, 0)));
  }

  const crouch = (t: number) => (1 - Math.sin(t * freq)) * 0.5;
  addRotation(tracks, roles, "upperLegL", duration, samples, X, crouch);
  addRotation(tracks, roles, "upperLegR", duration, samples, X, crouch);
  addRotation(tracks, roles, "lowerLegL", duration, samples, X, (t) => crouch(t) * 1.4);
  addRotation(tracks, roles, "lowerLegR", duration, samples, X, (t) => crouch(t) * 1.4);
  addRotation(tracks, roles, "upperArmL", duration, samples, X, (t) => -Math.sin(t * freq) * 0.6);
  addRotation(tracks, roles, "upperArmR", duration, samples, X, (t) => -Math.sin(t * freq) * 0.6);
  addRotation(tracks, roles, "chest", duration, samples, X, (t) => -Math.sin(t * freq) * 0.08);

  return tracks;
}

function buildSpin(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 48;

  addRotation(tracks, roles, "hips", duration, samples, Y, (t) => (t / duration) * TAU);
  addRotation(tracks, roles, "chest", duration, samples, Y, (t) => Math.sin((t / duration) * TAU * 2) * 0.05);
  addRotation(tracks, roles, "upperArmL", duration, samples, Z, (t) => 0.5 + Math.sin((t / duration) * TAU) * 0.2);
  addRotation(tracks, roles, "upperArmR", duration, samples, Z, (t) => -0.5 - Math.sin((t / duration) * TAU) * 0.2);

  const hips = roles.hips;
  if (hips) tracks.push(positionTrack(hips, duration, samples, (t) => new THREE.Vector3(0, Math.sin((t / duration) * TAU * 2) * 0.02, 0)));

  return tracks;
}

function buildDance(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 64;
  const freq = TAU / duration;

  addRotation(tracks, roles, "hips", duration, samples, Y, (t) => Math.sin(t * freq) * 0.3);
  addRotation(tracks, roles, "hips", duration, samples, Z, (t) => Math.sin(t * freq * 2) * 0.06);
  addRotation(tracks, roles, "chest", duration, samples, Y, (t) => -Math.sin(t * freq) * 0.2);
  addRotation(tracks, roles, "spine", duration, samples, Z, (t) => Math.sin(t * freq * 2) * 0.05);
  addRotation(tracks, roles, "head", duration, samples, Z, (t) => Math.sin(t * freq * 2 + 1) * 0.08);
  addRotation(tracks, roles, "upperArmL", duration, samples, Z, (t) => 0.6 + Math.sin(t * freq * 2) * 0.4);
  addRotation(tracks, roles, "upperArmR", duration, samples, Z, (t) => -0.6 - Math.sin(t * freq * 2 + Math.PI) * 0.4);
  addRotation(tracks, roles, "lowerArmL", duration, samples, X, (t) => Math.sin(t * freq * 2) * 0.4);
  addRotation(tracks, roles, "lowerArmR", duration, samples, X, (t) => Math.sin(t * freq * 2 + Math.PI) * 0.4);
  addRotation(tracks, roles, "upperLegL", duration, samples, Z, (t) => Math.sin(t * freq) * 0.12);
  addRotation(tracks, roles, "upperLegR", duration, samples, Z, (t) => -Math.sin(t * freq) * 0.12);

  const hips = roles.hips;
  if (hips) tracks.push(positionTrack(hips, duration, samples, (t) => new THREE.Vector3(0, Math.abs(Math.sin(t * freq * 2)) * 0.05, 0)));

  return tracks;
}

/**
 * Builds a procedural THREE.AnimationClip for the given animation id using
 * whichever humanoid bone roles are found on the rig (bone-name heuristics —
 * see lib/bone-utils.ts). Roles that aren't found are silently skipped, so
 * the animation still plays (partially) on non-standard rigs.
 */
export function buildProceduralClip(id: ProceduralAnimationId, bones: BoneInfo[]): THREE.AnimationClip | null {
  if (bones.length === 0) return null;
  const roles = matchBoneRoles(bones);
  const def = PROCEDURAL_ANIMATIONS.find((a) => a.id === id);
  if (!def) return null;

  let tracks: THREE.KeyframeTrack[] = [];
  switch (id) {
    case "idle":
      tracks = buildIdle(roles, def.duration);
      break;
    case "walk":
      tracks = buildWalkLike(roles, def.duration, 0.5, 0.4, 0.9, 0.03);
      break;
    case "run":
      tracks = buildWalkLike(roles, def.duration, 0.85, 0.7, 1.3, 0.07);
      break;
    case "wave":
      tracks = buildWave(roles, def.duration);
      break;
    case "jump":
      tracks = buildJump(roles, def.duration);
      break;
    case "spin":
      tracks = buildSpin(roles, def.duration);
      break;
    case "dance":
      tracks = buildDance(roles, def.duration);
      break;
  }

  if (tracks.length === 0) return null;
  return new THREE.AnimationClip(def.name, def.duration, tracks);
}

export function countMatchedRoles(bones: BoneInfo[]): number {
  return Object.keys(matchBoneRoles(bones)).length;
}
