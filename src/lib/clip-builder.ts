import * as THREE from "three";
import type { BonePoseEasing, BoneTrackData, CustomClipData, Keyframe, KeyframeEasingId, TransformProperty } from "@/types/model";
import { bakeTracksFromClipData } from "@/lib/keyframe-bake";
import { DEFAULT_KEYFRAME_EASING } from "@/lib/keyframe-easing";

let keyframeUid = 0;
export function nextKeyframeId() {
  keyframeUid += 1;
  return `kf-${keyframeUid}`;
}

let clipUid = 0;
export function nextClipId() {
  clipUid += 1;
  return `clip-${clipUid}`;
}

export function createEmptyCustomClip(name: string, duration = 2, fps = 30): CustomClipData {
  return { id: nextClipId(), name, duration, fps, loop: true, tracks: [], poseEasings: [] };
}

function timeKey(time: number) {
  return Number(time.toFixed(4));
}

export function getPoseEasing(clip: CustomClipData, boneName: string, time: number): KeyframeEasingId {
  const t = timeKey(time);
  const entry = clip.poseEasings?.find((e) => e.boneName === boneName && timeKey(e.time) === t);
  return entry?.easing ?? DEFAULT_KEYFRAME_EASING;
}

export function setPoseEasing(
  clip: CustomClipData,
  boneName: string,
  time: number,
  easing: KeyframeEasingId
): CustomClipData {
  const t = timeKey(time);
  const rest = (clip.poseEasings ?? []).filter((e) => !(e.boneName === boneName && timeKey(e.time) === t));
  const poseEasings: BonePoseEasing[] = [...rest, { boneName, time: t, easing }];
  return { ...clip, poseEasings };
}

export function setPoseEasingForBones(
  clip: CustomClipData,
  boneNames: string[],
  time: number,
  easing: KeyframeEasingId
): CustomClipData {
  let next = clip;
  for (const boneName of boneNames) {
    next = setPoseEasing(next, boneName, time, easing);
  }
  return next;
}

function ensurePoseEasingEntry(clip: CustomClipData, boneName: string, time: number): CustomClipData {
  const t = timeKey(time);
  const exists = clip.poseEasings?.some((e) => e.boneName === boneName && timeKey(e.time) === t);
  if (exists) return clip;
  return setPoseEasing(clip, boneName, time, DEFAULT_KEYFRAME_EASING);
}

function movePoseEasing(clip: CustomClipData, boneName: string, oldTime: number, newTime: number): CustomClipData {
  const easing = getPoseEasing(clip, boneName, oldTime);
  const without = (clip.poseEasings ?? []).filter((e) => !(e.boneName === boneName && timeKey(e.time) === timeKey(oldTime)));
  return { ...clip, poseEasings: [...without, { boneName, time: timeKey(newTime), easing }] };
}

function deletePoseEasing(clip: CustomClipData, boneName: string, time: number): CustomClipData {
  const t = timeKey(time);
  return {
    ...clip,
    poseEasings: (clip.poseEasings ?? []).filter((e) => !(e.boneName === boneName && timeKey(e.time) === t)),
  };
}

function clearPoseEasingsForBone(clip: CustomClipData, boneName: string): CustomClipData {
  return { ...clip, poseEasings: (clip.poseEasings ?? []).filter((e) => e.boneName !== boneName) };
}

export function ensureBonePoseEasing(clip: CustomClipData, boneName: string, time: number): CustomClipData {
  return ensurePoseEasingEntry(clip, boneName, time);
}

export function getBoneKeyframeEasings(clip: CustomClipData, boneName: string): Map<number, KeyframeEasingId> {
  const map = new Map<number, KeyframeEasingId>();
  for (const t of getBoneKeyframeTimes(clip, boneName)) {
    map.set(t, getPoseEasing(clip, boneName, t));
  }
  return map;
}

export function captureBoneTransform(bone: THREE.Object3D, property: TransformProperty): number[] {
  if (property === "position") return bone.position.toArray();
  if (property === "scale") return bone.scale.toArray();
  return bone.quaternion.toArray() as number[];
}

export function applyValueToBone(bone: THREE.Object3D, property: TransformProperty, value: number[]) {
  if (property === "position") bone.position.fromArray(value);
  else if (property === "scale") bone.scale.fromArray(value);
  else bone.quaternion.fromArray(value);
}

function findTrack(clip: CustomClipData, boneName: string, property: TransformProperty) {
  return clip.tracks.find((t) => t.boneName === boneName && t.property === property);
}

/** Returns a new CustomClipData with the keyframe added/replaced (same-time keyframes are overwritten). */
export function upsertKeyframe(
  clip: CustomClipData,
  boneName: string,
  property: TransformProperty,
  time: number,
  value: number[]
): CustomClipData {
  const epsilon = 1 / (clip.fps * 2);
  const existingTrack = findTrack(clip, boneName, property);

  const newKeyframe: Keyframe = { id: nextKeyframeId(), time, value };

  let nextTracks: BoneTrackData[];
  if (!existingTrack) {
    nextTracks = [...clip.tracks, { boneName, property, keyframes: [newKeyframe] }];
  } else {
    nextTracks = clip.tracks.map((t) => {
      if (t !== existingTrack) return t;
      const withoutClose = t.keyframes.filter((k) => Math.abs(k.time - time) > epsilon);
      const keyframes = [...withoutClose, newKeyframe].sort((a, b) => a.time - b.time);
      return { ...t, keyframes };
    });
  }

  return { ...clip, tracks: nextTracks };
}

export function removeKeyframe(clip: CustomClipData, boneName: string, property: TransformProperty, keyframeId: string): CustomClipData {
  const nextTracks = clip.tracks
    .map((t) => {
      if (t.boneName !== boneName || t.property !== property) return t;
      return { ...t, keyframes: t.keyframes.filter((k) => k.id !== keyframeId) };
    })
    .filter((t) => t.keyframes.length > 0);
  return { ...clip, tracks: nextTracks };
}

export function moveKeyframe(
  clip: CustomClipData,
  boneName: string,
  property: TransformProperty,
  keyframeId: string,
  newTime: number
): CustomClipData {
  const nextTracks = clip.tracks.map((t) => {
    if (t.boneName !== boneName || t.property !== property) return t;
    const keyframes = t.keyframes
      .map((k) => (k.id === keyframeId ? { ...k, time: Math.max(0, Math.min(newTime, clip.duration)) } : k))
      .sort((a, b) => a.time - b.time);
    return { ...t, keyframes };
  });
  return { ...clip, tracks: nextTracks };
}

export function removeBoneTrack(clip: CustomClipData, boneName: string): CustomClipData {
  return clearPoseEasingsForBone({ ...clip, tracks: clip.tracks.filter((t) => t.boneName !== boneName) }, boneName);
}

/** Bone-level view: the app UI treats a "keyframe" as one pose snapshot for a bone, even though
 * it's stored as up to three per-property (position/quaternion/scale) keyframe entries sharing a time. */
export function getBoneKeyframeTimes(clip: CustomClipData, boneName: string): number[] {
  const times = new Set<number>();
  for (const track of clip.tracks) {
    if (track.boneName !== boneName) continue;
    for (const k of track.keyframes) times.add(Number(k.time.toFixed(4)));
  }
  return Array.from(times).sort((a, b) => a - b);
}

export function getAnimatedBoneNames(clip: CustomClipData): string[] {
  const names = new Set<string>();
  for (const track of clip.tracks) {
    if (track.keyframes.length > 0) names.add(track.boneName);
  }
  return Array.from(names);
}

export function moveBoneKeyframe(clip: CustomClipData, boneName: string, oldTime: number, newTime: number): CustomClipData {
  const epsilon = 1 / (clip.fps * 2);
  const clampedNew = Math.max(0, Math.min(newTime, clip.duration));
  const nextTracks = clip.tracks.map((t) => {
    if (t.boneName !== boneName) return t;
    const keyframes = t.keyframes
      .map((k) => (Math.abs(k.time - oldTime) <= epsilon ? { ...k, time: clampedNew } : k))
      .sort((a, b) => a.time - b.time);
    return { ...t, keyframes };
  });
  return movePoseEasing({ ...clip, tracks: nextTracks }, boneName, oldTime, clampedNew);
}

export function deleteBoneKeyframe(clip: CustomClipData, boneName: string, time: number): CustomClipData {
  const epsilon = 1 / (clip.fps * 2);
  const nextTracks = clip.tracks
    .map((t) => {
      if (t.boneName !== boneName) return t;
      return { ...t, keyframes: t.keyframes.filter((k) => Math.abs(k.time - time) > epsilon) };
    })
    .filter((t) => t.keyframes.length > 0);
  return deletePoseEasing({ ...clip, tracks: nextTracks }, boneName, time);
}

export interface BoneKeyframeRef {
  boneName: string;
  time: number;
}

/** All unique bone pose keyframes in the clip. */
export function getAllBoneKeyframeRefs(clip: CustomClipData): BoneKeyframeRef[] {
  const map = new Map<string, BoneKeyframeRef>();
  for (const track of clip.tracks) {
    for (const k of track.keyframes) {
      const t = timeKey(k.time);
      const id = `${track.boneName}|${t}`;
      if (!map.has(id)) map.set(id, { boneName: track.boneName, time: t });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.time - b.time || a.boneName.localeCompare(b.boneName));
}

export function deleteBoneKeyframes(clip: CustomClipData, refs: BoneKeyframeRef[]): CustomClipData {
  let next = clip;
  for (const ref of refs) {
    next = deleteBoneKeyframe(next, ref.boneName, ref.time);
  }
  return next;
}

export function moveBoneKeyframes(
  clip: CustomClipData,
  moves: { boneName: string; oldTime: number; newTime: number }[]
): CustomClipData {
  let next = clip;
  for (const { boneName, oldTime, newTime } of moves) {
    next = moveBoneKeyframe(next, boneName, oldTime, newTime);
  }
  return next;
}

export function setClipDuration(clip: CustomClipData, duration: number): CustomClipData {
  const nextDuration = Math.max(0.1, duration);
  const epsilon = 1 / (clip.fps * 2);
  const tracks = clip.tracks
    .map((t) => ({
      ...t,
      keyframes: t.keyframes
        .filter((k) => k.time <= nextDuration + epsilon)
        .map((k) => ({ ...k, time: Math.min(k.time, nextDuration) })),
    }))
    .filter((t) => t.keyframes.length > 0);
  const poseEasings = (clip.poseEasings ?? []).filter((e) => e.time <= nextDuration + epsilon);
  return { ...clip, duration: nextDuration, tracks, poseEasings };
}

/** Converts the app's editable per-bone keyframe data into a playable THREE.AnimationClip. */
export function buildClipFromData(data: CustomClipData): THREE.AnimationClip {
  const tracks = bakeTracksFromClipData(data);
  return new THREE.AnimationClip(data.name, data.duration, tracks);
}

export function boneHasKeyframes(clip: CustomClipData, boneName: string): boolean {
  return clip.tracks.some((t) => t.boneName === boneName && t.keyframes.length > 0);
}

/** Converts a baked THREE.AnimationClip (embedded or procedural) back into editable keyframe data. */
export function clipToCustomData(clip: THREE.AnimationClip, name: string, fps = 30): CustomClipData {
  const tracks: BoneTrackData[] = clip.tracks
    .map((t): BoneTrackData | null => {
      const dot = t.name.lastIndexOf(".");
      if (dot === -1) return null;
      const boneName = t.name.slice(0, dot);
      const property = t.name.slice(dot + 1) as TransformProperty;
      if (property !== "position" && property !== "quaternion" && property !== "scale") return null;
      const stride = property === "quaternion" ? 4 : 3;
      const keyframes: Keyframe[] = [];
      for (let i = 0; i < t.times.length; i++) {
        keyframes.push({
          id: nextKeyframeId(),
          time: t.times[i],
          value: Array.from(t.values.slice(i * stride, i * stride + stride)),
        });
      }
      return { boneName, property, keyframes };
    })
    .filter((t): t is BoneTrackData => t !== null);

  return { id: nextClipId(), name, duration: clip.duration, fps, loop: true, tracks, poseEasings: [] };
}
