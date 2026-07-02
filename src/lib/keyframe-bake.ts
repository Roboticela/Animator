import * as THREE from "three";
import type { CustomClipData, Keyframe, TransformProperty } from "@/types/model";
import type { KeyframeEasingId } from "@/lib/keyframe-easing";
import { applyKeyframeEasing, DEFAULT_KEYFRAME_EASING } from "@/lib/keyframe-easing";

function timeKey(time: number) {
  return Number(time.toFixed(4));
}

function getPoseEasing(clip: CustomClipData, boneName: string, time: number): KeyframeEasingId {
  const t = timeKey(time);
  const entry = clip.poseEasings?.find((e) => e.boneName === boneName && timeKey(e.time) === t);
  return entry?.easing ?? DEFAULT_KEYFRAME_EASING;
}

function lerpValues(a: number[], b: number[], t: number): number[] {
  if (a.length === 4) {
    const qa = new THREE.Quaternion().fromArray(a);
    const qb = new THREE.Quaternion().fromArray(b);
    return qa.clone().slerp(qb, t).toArray() as number[];
  }
  return a.map((v, i) => v + (b[i] - v) * t);
}

function segmentSamples(t0: number, t1: number, fps: number, easing: KeyframeEasingId): number {
  const span = t1 - t0;
  if (span <= 0) return 2;
  if (easing === "hold") return 2;
  return Math.min(48, Math.max(4, Math.ceil(span * fps)));
}

function bakeSegment(
  k0: Keyframe,
  k1: Keyframe,
  easing: KeyframeEasingId,
  fps: number,
  skipFirst: boolean
): { times: number[]; values: number[] } {
  const times: number[] = [];
  const values: number[] = [];
  const n = segmentSamples(k0.time, k1.time, fps, easing);

  for (let i = skipFirst ? 1 : 0; i <= n; i++) {
    const u = i / n;
    const eased = applyKeyframeEasing(easing, u);
    const time = k0.time + (k1.time - k0.time) * u;
    const value = lerpValues(k0.value, k1.value, eased);
    times.push(time);
    values.push(...value);
  }

  return { times, values };
}

function bakePropertyTrack(
  keyframes: Keyframe[],
  boneName: string,
  property: TransformProperty,
  clip: CustomClipData
): THREE.KeyframeTrack | null {
  if (keyframes.length === 0) return null;
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  const trackName = `${boneName}.${property}`;

  const allLinear = sorted.every((kf, i) => {
    if (i === sorted.length - 1) return true;
    return getPoseEasing(clip, boneName, kf.time) === "linear";
  });

  if (allLinear) {
    const times = sorted.map((k) => k.time);
    const values = sorted.flatMap((k) => k.value);
    return property === "quaternion"
      ? new THREE.QuaternionKeyframeTrack(trackName, times, values)
      : new THREE.VectorKeyframeTrack(trackName, times, values);
  }

  const times: number[] = [];
  const values: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const k0 = sorted[i];
    if (i === sorted.length - 1) {
      if (times.length === 0 || times[times.length - 1] !== k0.time) {
        times.push(k0.time);
        values.push(...k0.value);
      }
      continue;
    }

    const k1 = sorted[i + 1];
    const easing = getPoseEasing(clip, boneName, k0.time);
    const baked = bakeSegment(k0, k1, easing, clip.fps, times.length > 0);
    times.push(...baked.times);
    values.push(...baked.values);
  }

  if (times.length === 0) return null;

  return property === "quaternion"
    ? new THREE.QuaternionKeyframeTrack(trackName, times, values)
    : new THREE.VectorKeyframeTrack(trackName, times, values);
}

/** Bakes eased segments into THREE keyframe tracks for playback. */
export function bakeTracksFromClipData(data: CustomClipData): THREE.KeyframeTrack[] {
  const tracks: THREE.KeyframeTrack[] = [];

  for (const track of data.tracks) {
    if (track.keyframes.length === 0) continue;
    const baked = bakePropertyTrack(track.keyframes, track.boneName, track.property, data);
    if (baked) tracks.push(baked);
  }

  return tracks;
}
