import * as THREE from "three";
import {
  AXIS_X,
  AXIS_Y,
  AXIS_Z,
  TAU,
  addRotation,
  modelExtents,
  positionTrack,
  prepareMeshOpacity,
  rootPositionTrack,
  rootQuaternionTrack,
  rootScaleTrack,
  meshOpacityTracks,
  ensureRootName,
  type RoleMap,
} from "@/lib/procedural/tracks";
import { easeInBack, easeInCubic, easeOutBack, easeOutCubic, lerp } from "@/lib/procedural/easing";

function walkLike(roles: RoleMap, duration: number, legAmp: number, armAmp: number, kneeAmp: number, hipBob: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 40;
  const freq = TAU / duration;

  addRotation(tracks, roles, "upperLegL", duration, samples, AXIS_X, (t) => Math.sin(t * freq) * legAmp);
  addRotation(tracks, roles, "upperLegR", duration, samples, AXIS_X, (t) => Math.sin(t * freq + Math.PI) * legAmp);
  addRotation(tracks, roles, "lowerLegL", duration, samples, AXIS_X, (t) => Math.max(0, -Math.sin(t * freq)) * kneeAmp);
  addRotation(tracks, roles, "lowerLegR", duration, samples, AXIS_X, (t) => Math.max(0, -Math.sin(t * freq + Math.PI)) * kneeAmp);
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_X, (t) => Math.sin(t * freq + Math.PI) * armAmp);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_X, (t) => Math.sin(t * freq) * armAmp);
  addRotation(tracks, roles, "lowerArmL", duration, samples, AXIS_X, (t) => Math.max(0, Math.sin(t * freq + Math.PI)) * armAmp * 0.6);
  addRotation(tracks, roles, "lowerArmR", duration, samples, AXIS_X, (t) => Math.max(0, Math.sin(t * freq)) * armAmp * 0.6);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_Y, (t) => Math.sin(t * freq) * 0.05);
  addRotation(tracks, roles, "spine", duration, samples, AXIS_Z, (t) => Math.sin(t * freq) * 0.02);

  const hips = roles.hips;
  if (hips) tracks.push(positionTrack(hips, duration, samples, (t) => new THREE.Vector3(0, Math.abs(Math.sin(t * freq)) * hipBob, 0)));
  addRotation(tracks, roles, "hips", duration, samples, AXIS_Y, (t) => Math.sin(t * freq) * 0.04);

  return tracks;
}

export function buildIdle(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const freq = TAU / duration;

  addRotation(tracks, roles, "chest", duration, samples, AXIS_X, (t) => Math.sin(t * freq) * 0.025);
  addRotation(tracks, roles, "spine", duration, samples, AXIS_X, (t) => Math.sin(t * freq) * 0.015);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Y, (t) => Math.sin(t * freq * 2) * 0.04);
  addRotation(tracks, roles, "shoulderL", duration, samples, AXIS_Z, (t) => Math.sin(t * freq) * 0.03);
  addRotation(tracks, roles, "shoulderR", duration, samples, AXIS_Z, (t) => -Math.sin(t * freq) * 0.03);

  const hips = roles.hips;
  if (hips) tracks.push(positionTrack(hips, duration, samples, (t) => new THREE.Vector3(0, Math.sin(t * freq) * 0.008, 0)));
  return tracks;
}

export function buildWalk(roles: RoleMap, duration: number) {
  return walkLike(roles, duration, 0.5, 0.4, 0.9, 0.03);
}

export function buildRun(roles: RoleMap, duration: number) {
  return walkLike(roles, duration, 0.85, 0.7, 1.3, 0.07);
}

export function buildStrafe(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks = walkLike(roles, duration, 0.35, 0.25, 0.6, 0.02);
  const samples = 40;
  const freq = TAU / duration;
  addRotation(tracks, roles, "hips", duration, samples, AXIS_Z, (t) => Math.sin(t * freq) * 0.12);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_Z, (t) => -Math.sin(t * freq) * 0.06);
  return tracks;
}

export function buildSneak(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks = walkLike(roles, duration, 0.25, 0.15, 0.5, 0.01);
  const samples = 40;
  addRotation(tracks, roles, "hips", duration, samples, AXIS_X, () => 0.25);
  addRotation(tracks, roles, "spine", duration, samples, AXIS_X, () => 0.1);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_X, () => 0.08);
  return tracks;
}

export function buildTiptoe(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks = walkLike(roles, duration, 0.2, 0.1, 0.35, 0.015);
  const samples = 40;
  const freq = TAU / duration;
  addRotation(tracks, roles, "footL", duration, samples, AXIS_X, (t) => Math.max(0, Math.sin(t * freq)) * 0.35);
  addRotation(tracks, roles, "footR", duration, samples, AXIS_X, (t) => Math.max(0, Math.sin(t * freq + Math.PI)) * 0.35);
  return tracks;
}

export function buildZombie(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks = walkLike(roles, duration, 0.3, 0.15, 0.4, 0.01);
  const samples = 32;
  const freq = TAU / duration;
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_X, () => 0.4);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_X, () => 0.35);
  addRotation(tracks, roles, "head", duration, samples, AXIS_X, () => 0.15);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Y, (t) => Math.sin(t * freq * 0.5) * 0.2);
  return tracks;
}

export function buildRobot(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 24;
  const freq = TAU / duration;
  const step = (t: number) => (Math.floor(t * freq / Math.PI) % 2 === 0 ? 1 : -1);

  addRotation(tracks, roles, "upperLegL", duration, samples, AXIS_X, (t) => step(t) * 0.45);
  addRotation(tracks, roles, "upperLegR", duration, samples, AXIS_X, (t) => -step(t) * 0.45);
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_X, (t) => -step(t) * 0.35);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_X, (t) => step(t) * 0.35);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Y, (t) => step(t) * 0.08);
  return tracks;
}

export function buildJump(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const freq = Math.PI / duration;

  const hips = roles.hips;
  if (hips) tracks.push(positionTrack(hips, duration, samples, (t) => new THREE.Vector3(0, Math.sin(t * freq) * 0.22, 0)));

  const crouch = (t: number) => (1 - Math.sin(t * freq)) * 0.5;
  addRotation(tracks, roles, "upperLegL", duration, samples, AXIS_X, crouch);
  addRotation(tracks, roles, "upperLegR", duration, samples, AXIS_X, crouch);
  addRotation(tracks, roles, "lowerLegL", duration, samples, AXIS_X, (t) => crouch(t) * 1.4);
  addRotation(tracks, roles, "lowerLegR", duration, samples, AXIS_X, (t) => crouch(t) * 1.4);
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_X, (t) => -Math.sin(t * freq) * 0.6);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_X, (t) => -Math.sin(t * freq) * 0.6);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_X, (t) => -Math.sin(t * freq) * 0.08);
  return tracks;
}

export function buildSpin(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 48;

  addRotation(tracks, roles, "hips", duration, samples, AXIS_Y, (t) => (t / duration) * TAU);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_Y, (t) => Math.sin((t / duration) * TAU * 2) * 0.05);
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_Z, (t) => 0.5 + Math.sin((t / duration) * TAU) * 0.2);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_Z, (t) => -0.5 - Math.sin((t / duration) * TAU) * 0.2);

  const hips = roles.hips;
  if (hips) tracks.push(positionTrack(hips, duration, samples, (t) => new THREE.Vector3(0, Math.sin((t / duration) * TAU * 2) * 0.02, 0)));
  return tracks;
}

export function buildDance(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 64;
  const freq = TAU / duration;

  addRotation(tracks, roles, "hips", duration, samples, AXIS_Y, (t) => Math.sin(t * freq) * 0.3);
  addRotation(tracks, roles, "hips", duration, samples, AXIS_Z, (t) => Math.sin(t * freq * 2) * 0.06);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_Y, (t) => -Math.sin(t * freq) * 0.2);
  addRotation(tracks, roles, "spine", duration, samples, AXIS_Z, (t) => Math.sin(t * freq * 2) * 0.05);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Z, (t) => Math.sin(t * freq * 2 + 1) * 0.08);
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_Z, (t) => 0.6 + Math.sin(t * freq * 2) * 0.4);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_Z, (t) => -0.6 - Math.sin(t * freq * 2 + Math.PI) * 0.4);
  addRotation(tracks, roles, "lowerArmL", duration, samples, AXIS_X, (t) => Math.sin(t * freq * 2) * 0.4);
  addRotation(tracks, roles, "lowerArmR", duration, samples, AXIS_X, (t) => Math.sin(t * freq * 2 + Math.PI) * 0.4);
  addRotation(tracks, roles, "upperLegL", duration, samples, AXIS_Z, (t) => Math.sin(t * freq) * 0.12);
  addRotation(tracks, roles, "upperLegR", duration, samples, AXIS_Z, (t) => -Math.sin(t * freq) * 0.12);

  const hips = roles.hips;
  if (hips) tracks.push(positionTrack(hips, duration, samples, (t) => new THREE.Vector3(0, Math.abs(Math.sin(t * freq * 2)) * 0.05, 0)));
  return tracks;
}

export function buildWave(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const cycles = 3;
  const freq = (TAU * cycles) / duration;

  addRotation(tracks, roles, "shoulderR", duration, samples, AXIS_Z, () => 0.35);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_Z, () => 1.15);
  addRotation(tracks, roles, "lowerArmR", duration, samples, AXIS_Y, (t) => Math.sin(t * freq) * 0.5);
  addRotation(tracks, roles, "handR", duration, samples, AXIS_Y, (t) => Math.sin(t * freq) * 0.25);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Y, (t) => Math.sin((t * freq) / cycles) * 0.08);
  return tracks;
}

export function buildPoint(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 24;
  addRotation(tracks, roles, "shoulderR", duration, samples, AXIS_Z, () => 0.2);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_Z, () => 0.9);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_X, () => -0.3);
  addRotation(tracks, roles, "lowerArmR", duration, samples, AXIS_X, () => 0.05);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Y, () => 0.12);
  return tracks;
}

export function buildSalute(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 24;
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_Z, () => 1.4);
  addRotation(tracks, roles, "lowerArmR", duration, samples, AXIS_X, () => -0.6);
  addRotation(tracks, roles, "handR", duration, samples, AXIS_X, () => 0.1);
  addRotation(tracks, roles, "head", duration, samples, AXIS_X, () => -0.05);
  return tracks;
}

export function buildBow(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const mid = duration * 0.5;
  const bend = (t: number) => {
    if (t < mid) return easeOutCubic(t / mid) * 0.45;
    return easeInCubic((duration - t) / (duration - mid)) * 0.45;
  };
  addRotation(tracks, roles, "hips", duration, samples, AXIS_X, bend);
  addRotation(tracks, roles, "spine", duration, samples, AXIS_X, (t) => bend(t) * 0.5);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_X, (t) => bend(t) * 0.3);
  addRotation(tracks, roles, "head", duration, samples, AXIS_X, (t) => -bend(t) * 0.2);
  return tracks;
}

export function buildShrug(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const freq = TAU / duration;
  addRotation(tracks, roles, "shoulderL", duration, samples, AXIS_Z, (t) => 0.15 + Math.sin(t * freq) * 0.1);
  addRotation(tracks, roles, "shoulderR", duration, samples, AXIS_Z, (t) => -0.15 - Math.sin(t * freq) * 0.1);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Z, (t) => Math.sin(t * freq) * 0.06);
  return tracks;
}

export function buildClap(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const freq = TAU / duration;
  const arm = (t: number) => 0.7 + Math.max(0, Math.sin(t * freq * 2)) * 0.35;
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_Z, arm);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_Z, (t) => -arm(t));
  addRotation(tracks, roles, "lowerArmL", duration, samples, AXIS_X, (t) => -0.8 + Math.max(0, Math.sin(t * freq * 2)) * 0.3);
  addRotation(tracks, roles, "lowerArmR", duration, samples, AXIS_X, (t) => -0.8 + Math.max(0, Math.sin(t * freq * 2)) * 0.3);
  return tracks;
}

export function buildThumbsUp(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 24;
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_Z, () => 0.8);
  addRotation(tracks, roles, "lowerArmR", duration, samples, AXIS_X, () => -1.2);
  addRotation(tracks, roles, "handR", duration, samples, AXIS_X, () => 0.3);
  return tracks;
}

export function buildStretch(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const freq = TAU / duration;
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_Z, () => 0.9);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_Z, () => -0.9);
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_X, (t) => -0.2 + Math.sin(t * freq) * 0.05);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_X, (t) => -0.2 + Math.sin(t * freq) * 0.05);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_X, (t) => Math.sin(t * freq) * 0.04);
  return tracks;
}

export function buildLookAround(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 48;
  const freq = TAU / duration;
  addRotation(tracks, roles, "head", duration, samples, AXIS_Y, (t) => Math.sin(t * freq) * 0.5);
  addRotation(tracks, roles, "head", duration, samples, AXIS_X, (t) => Math.sin(t * freq * 2) * 0.15);
  addRotation(tracks, roles, "neck", duration, samples, AXIS_Y, (t) => Math.sin(t * freq) * 0.15);
  return tracks;
}

export function buildCelebrate(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks = buildJump(roles, duration);
  const samples = 32;
  const freq = TAU / duration;
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_Z, () => 1.2);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_Z, () => -1.2);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Y, (t) => Math.sin(t * freq * 2) * 0.2);
  return tracks;
}

export function buildStumble(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 40;
  const freq = TAU / duration;
  addRotation(tracks, roles, "hips", duration, samples, AXIS_Z, (t) => Math.sin(t * freq * 3) * 0.15);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_Z, (t) => -Math.sin(t * freq * 3) * 0.1);
  addRotation(tracks, roles, "upperLegL", duration, samples, AXIS_X, (t) => Math.sin(t * freq * 2) * 0.3);
  addRotation(tracks, roles, "upperLegR", duration, samples, AXIS_X, (t) => Math.sin(t * freq * 2 + 1) * 0.25);
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_Z, (t) => Math.sin(t * freq * 2) * 0.4);
  return tracks;
}

export function buildPunch(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const strike = duration * 0.35;
  const arm = (t: number) => {
    if (t < strike) return easeOutCubic(t / strike) * 1.1;
    return easeInCubic((duration - t) / (duration - strike)) * 0.2;
  };
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_X, (t) => -arm(t));
  addRotation(tracks, roles, "lowerArmR", duration, samples, AXIS_X, (t) => -arm(t) * 0.3);
  addRotation(tracks, roles, "hips", duration, samples, AXIS_Y, (t) => (t < strike ? easeOutCubic(t / strike) * 0.2 : 0));
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_X, () => -0.2);
  return tracks;
}

export function buildKick(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const strike = duration * 0.4;
  const leg = (t: number) => {
    if (t < strike) return easeOutCubic(t / strike) * 0.9;
    return easeInCubic((duration - t) / (duration - strike)) * 0.1;
  };
  addRotation(tracks, roles, "upperLegR", duration, samples, AXIS_X, leg);
  addRotation(tracks, roles, "lowerLegR", duration, samples, AXIS_X, (t) => leg(t) * 0.8);
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_X, (t) => (t < strike ? -0.5 : -0.1));
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_X, (t) => (t < strike ? 0.4 : 0.1));
  return tracks;
}

export function buildDodge(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const mid = duration * 0.5;
  const lean = (t: number) => {
    if (t < mid) return easeOutCubic(t / mid) * 0.35;
    return easeInCubic((duration - t) / (duration - mid)) * 0.35;
  };
  addRotation(tracks, roles, "hips", duration, samples, AXIS_Z, lean);
  addRotation(tracks, roles, "spine", duration, samples, AXIS_Z, (t) => lean(t) * 0.6);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Z, (t) => -lean(t) * 0.3);
  return tracks;
}

// --- Transitions & effects (root / material) ---

export function buildFadeIn(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  prepareMeshOpacity(root);
  return meshOpacityTracks(root, duration, 24, (t, d) => easeOutCubic(t / d));
}

export function buildFadeOut(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  prepareMeshOpacity(root);
  return meshOpacityTracks(root, duration, 24, (t, d) => 1 - easeInCubic(t / d));
}

export function buildPopIn(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  return [rootScaleTrack(root, duration, 32, (t, d) => easeOutBack(t / d))];
}

export function buildPopOut(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  return [rootScaleTrack(root, duration, 28, (t, d) => 1 - easeInBack(t / d))];
}

export function buildRiseUp(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const { height } = modelExtents(root);
  return [
    rootPositionTrack(root, duration, 32, (t, d) => new THREE.Vector3(0, -height * (1 - easeOutCubic(t / d)), 0)),
  ];
}

export function buildDropDown(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const { height } = modelExtents(root);
  return [
    rootPositionTrack(root, duration, 32, (t, d) => new THREE.Vector3(0, height * (1 - easeOutCubic(t / d)), 0)),
  ];
}

export function buildSlideInLeft(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const { width } = modelExtents(root);
  return [
    rootPositionTrack(root, duration, 32, (t, d) => new THREE.Vector3(-width * 1.5 * (1 - easeOutCubic(t / d)), 0, 0)),
  ];
}

export function buildSlideInRight(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const { width } = modelExtents(root);
  return [
    rootPositionTrack(root, duration, 32, (t, d) => new THREE.Vector3(width * 1.5 * (1 - easeOutCubic(t / d)), 0, 0)),
  ];
}

export function buildSlideOutLeft(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const { width } = modelExtents(root);
  return [
    rootPositionTrack(root, duration, 28, (t, d) => new THREE.Vector3(-width * 1.5 * easeInCubic(t / d), 0, 0)),
  ];
}

export function buildSlideOutRight(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const { width } = modelExtents(root);
  return [
    rootPositionTrack(root, duration, 28, (t, d) => new THREE.Vector3(width * 1.5 * easeInCubic(t / d), 0, 0)),
  ];
}

export function buildFlipIn(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  return [rootQuaternionTrack(root, duration, 32, (t, d) => lerp(Math.PI / 2, 0, easeOutCubic(t / d)), AXIS_Y)];
}

export function buildFlipOut(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  return [rootQuaternionTrack(root, duration, 28, (t, d) => lerp(0, Math.PI / 2, easeInCubic(t / d)), AXIS_Y)];
}

export function buildBounce(root: THREE.Object3D, roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 40;
  const freq = TAU / duration;
  const amp = modelExtents(root).height * 0.08;
  tracks.push(rootPositionTrack(root, duration, samples, (t) => new THREE.Vector3(0, Math.abs(Math.sin(t * freq)) * amp, 0)));
  addRotation(tracks, roles, "hips", duration, samples, AXIS_X, (t) => Math.sin(t * freq) * 0.04);
  return tracks;
}

export function buildShake(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const samples = 48;
  const freq = TAU / duration * 6;
  return [
    rootQuaternionTrack(root, duration, samples, (t) => Math.sin(t * freq) * 0.04, AXIS_Z),
    rootQuaternionTrack(root, duration, samples, (t) => Math.sin(t * freq * 1.3) * 0.03, AXIS_X),
  ];
}

export function buildWiggle(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 40;
  const freq = TAU / duration * 3;
  addRotation(tracks, roles, "hips", duration, samples, AXIS_Y, (t) => Math.sin(t * freq) * 0.2);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_Y, (t) => -Math.sin(t * freq) * 0.12);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Y, (t) => Math.sin(t * freq * 1.5) * 0.15);
  return tracks;
}

export function buildPulse(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const samples = 32;
  const freq = TAU / duration;
  return [rootScaleTrack(root, duration, samples, (t) => 1 + Math.sin(t * freq) * 0.06)];
}

export function buildFloat(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const samples = 40;
  const freq = TAU / duration;
  const amp = modelExtents(root).height * 0.04;
  return [rootPositionTrack(root, duration, samples, (t) => new THREE.Vector3(0, Math.sin(t * freq) * amp, 0))];
}

export function buildHover(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const tracks = buildFloat(root, duration);
  const samples = 40;
  const freq = TAU / duration;
  tracks.push(rootQuaternionTrack(root, duration, samples, (t) => Math.sin(t * freq * 0.5) * 0.05, AXIS_Y));
  return tracks;
}

export function buildSquashStretch(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const samples = 32;
  const freq = TAU / duration;
  const rest = root.scale.clone();
  const times: number[] = [];
  const values: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * duration;
    const s = Math.sin(t * freq);
    const sy = 1 + s * 0.12;
    const sxz = 1 - s * 0.06;
    times.push(t);
    values.push(rest.x * sxz, rest.y * sy, rest.z * sxz);
  }
  return [new THREE.VectorKeyframeTrack(`${ensureRootName(root)}.scale`, times, values)];
}

export function buildSpinFast(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 48;
  addRotation(tracks, roles, "hips", duration, samples, AXIS_Y, (t) => (t / duration) * TAU * 2);
  addRotation(tracks, roles, "upperArmL", duration, samples, AXIS_Z, () => 0.6);
  addRotation(tracks, roles, "upperArmR", duration, samples, AXIS_Z, () => -0.6);
  return tracks;
}

export function buildTumble(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const samples = 48;
  return [
    rootQuaternionTrack(root, duration, samples, (t, d) => (t / d) * TAU, AXIS_X),
    rootQuaternionTrack(root, duration, samples, (t, d) => (t / d) * TAU * 0.5, AXIS_Z),
  ];
}

export function buildGrowShrink(root: THREE.Object3D, duration: number): THREE.KeyframeTrack[] {
  const samples = 40;
  const freq = TAU / duration;
  return [rootScaleTrack(root, duration, samples, (t) => 1 + Math.sin(t * freq) * 0.15)];
}

export function buildSway(root: THREE.Object3D, roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 40;
  const freq = TAU / duration;
  tracks.push(rootQuaternionTrack(root, duration, samples, (t) => Math.sin(t * freq) * 0.08, AXIS_Z));
  addRotation(tracks, roles, "chest", duration, samples, AXIS_Z, (t) => Math.sin(t * freq) * 0.05);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Z, (t) => -Math.sin(t * freq) * 0.04);
  return tracks;
}

export function buildBreathe(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks = buildIdle(roles, duration);
  const samples = 32;
  const freq = TAU / duration;
  addRotation(tracks, roles, "chest", duration, samples, AXIS_X, (t) => Math.sin(t * freq) * 0.06);
  addRotation(tracks, roles, "shoulderL", duration, samples, AXIS_Z, (t) => Math.sin(t * freq) * 0.05);
  addRotation(tracks, roles, "shoulderR", duration, samples, AXIS_Z, (t) => -Math.sin(t * freq) * 0.05);
  return tracks;
}

export function buildNod(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 32;
  const freq = TAU / duration * 2;
  addRotation(tracks, roles, "head", duration, samples, AXIS_X, (t) => Math.sin(t * freq) * 0.25);
  addRotation(tracks, roles, "neck", duration, samples, AXIS_X, (t) => Math.sin(t * freq) * 0.1);
  return tracks;
}

export function buildTwist(roles: RoleMap, duration: number): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];
  const samples = 40;
  const freq = TAU / duration;
  addRotation(tracks, roles, "hips", duration, samples, AXIS_Y, (t) => Math.sin(t * freq) * 0.35);
  addRotation(tracks, roles, "chest", duration, samples, AXIS_Y, (t) => -Math.sin(t * freq) * 0.25);
  addRotation(tracks, roles, "head", duration, samples, AXIS_Y, (t) => Math.sin(t * freq) * 0.15);
  return tracks;
}
