import * as THREE from "three";

export interface AnimationVariant {
  speedMul: number;
  intensityMul: number;
  label: string;
}

/** 19 distinct presets — combined with 50 base clips → 950 variants (+ 50 originals = 1000). */
export const VARIANT_PRESETS: AnimationVariant[] = [
  { speedMul: 0.55, intensityMul: 0.65, label: "Gentle" },
  { speedMul: 0.7, intensityMul: 0.75, label: "Soft" },
  { speedMul: 0.85, intensityMul: 0.9, label: "Calm" },
  { speedMul: 1.15, intensityMul: 1.05, label: "Brisk" },
  { speedMul: 1.35, intensityMul: 1.15, label: "Energetic" },
  { speedMul: 1.55, intensityMul: 1.25, label: "Hectic" },
  { speedMul: 0.75, intensityMul: 1.35, label: "Heavy" },
  { speedMul: 1.2, intensityMul: 0.7, label: "Light" },
  { speedMul: 1.45, intensityMul: 1.45, label: "Dramatic" },
  { speedMul: 0.65, intensityMul: 0.55, label: "Minimal" },
  { speedMul: 1.5, intensityMul: 1.6, label: "Wild" },
  { speedMul: 0.9, intensityMul: 0.95, label: "Smooth" },
  { speedMul: 1.4, intensityMul: 1.3, label: "Snappy" },
  { speedMul: 0.6, intensityMul: 0.8, label: "Lazy" },
  { speedMul: 1.1, intensityMul: 1.2, label: "Bold" },
  { speedMul: 0.95, intensityMul: 1.4, label: "Expressive" },
  { speedMul: 1.25, intensityMul: 0.85, label: "Tight" },
  { speedMul: 0.8, intensityMul: 1.15, label: "Loose" },
  { speedMul: 1.65, intensityMul: 1.55, label: "Extreme" },
];

export const VARIANTS_PER_BASE = VARIANT_PRESETS.length;

export function clampVariantDuration(duration: number): number {
  return Math.max(0.25, Math.min(12, duration));
}

function scaleQuaternionValues(values: ArrayLike<number>, intensity: number): Float32Array {
  const out = new Float32Array(values.length);
  const q0 = new THREE.Quaternion(values[0], values[1], values[2], values[3]);
  const q = new THREE.Quaternion();
  const result = new THREE.Quaternion();

  for (let i = 0; i < values.length; i += 4) {
    q.set(values[i], values[i + 1], values[i + 2], values[i + 3]);
    result.copy(q0).slerp(q, intensity);
    out[i] = result.x;
    out[i + 1] = result.y;
    out[i + 2] = result.z;
    out[i + 3] = result.w;
  }
  return out;
}

function scaleVectorOffsets(values: ArrayLike<number>, intensity: number): Float32Array {
  const out = new Float32Array(values.length);
  const bx = values[0];
  const by = values[1];
  const bz = values[2];

  for (let i = 0; i < values.length; i += 3) {
    out[i] = bx + (values[i] - bx) * intensity;
    out[i + 1] = by + (values[i + 1] - by) * intensity;
    out[i + 2] = bz + (values[i + 2] - bz) * intensity;
  }
  return out;
}

function scaleScaleValues(values: ArrayLike<number>, intensity: number): Float32Array {
  const out = new Float32Array(values.length);
  const bx = values[0];
  const by = values[1];
  const bz = values[2];

  for (let i = 0; i < values.length; i += 3) {
    out[i] = bx + (values[i] - bx) * intensity;
    out[i + 1] = by + (values[i + 1] - by) * intensity;
    out[i + 2] = bz + (values[i + 2] - bz) * intensity;
  }
  return out;
}

function scaleNumberOffsets(values: ArrayLike<number>, intensity: number): Float32Array {
  const out = new Float32Array(values.length);
  const base = values[0];
  for (let i = 0; i < values.length; i++) {
    out[i] = base + (values[i] - base) * intensity;
  }
  return out;
}

/** Scales motion amplitude on generated keyframe tracks. */
export function applyIntensityToTracks(tracks: THREE.KeyframeTrack[], intensity: number): THREE.KeyframeTrack[] {
  if (intensity === 1 || tracks.length === 0) return tracks;

  return tracks.map((track) => {
    if (track instanceof THREE.QuaternionKeyframeTrack) {
      return new THREE.QuaternionKeyframeTrack(
        track.name,
        track.times.slice(),
        scaleQuaternionValues(track.values, intensity)
      );
    }
    if (track instanceof THREE.VectorKeyframeTrack) {
      const scaled = scaleVectorOffsets(track.values, intensity);
      if (track.name.endsWith(".scale")) {
        return new THREE.VectorKeyframeTrack(track.name, track.times.slice(), scaleScaleValues(track.values, intensity));
      }
      return new THREE.VectorKeyframeTrack(track.name, track.times.slice(), scaled);
    }
    if (track instanceof THREE.NumberKeyframeTrack) {
      return new THREE.NumberKeyframeTrack(
        track.name,
        track.times.slice(),
        scaleNumberOffsets(track.values, intensity)
      );
    }
    return track;
  });
}
