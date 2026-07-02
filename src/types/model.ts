import type * as THREE from "three";

export type SourceExtension = "glb" | "gltf" | "fbx" | "obj";

export interface BoneInfo {
  uuid: string;
  name: string;
  depth: number;
  parentUuid: string | null;
  bone: THREE.Bone;
}

/** One imported skeleton, grouped under its "Armature" root (Blender-style naming). */
export interface SkeletonGroup {
  id: string;
  rootName: string;
  bones: BoneInfo[];
}

export interface SceneStats {
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  materialCount: number;
  skinnedMeshCount: number;
}

export interface ModelData {
  object3D: THREE.Group;
  skeletonGroups: SkeletonGroup[];
  embeddedClips: THREE.AnimationClip[];
  stats: SceneStats;
  sourceName: string;
  sourceExt: SourceExtension;
}

export type ClipSource = "embedded" | "premade" | "custom";

export interface ClipMeta {
  id: string;
  name: string;
  source: ClipSource;
  duration: number;
  clip: THREE.AnimationClip;
  /** Only present for "custom" clips — the editable keyframe representation the clip was built from. */
  editable?: CustomClipData;
}

export type TransformProperty = "position" | "quaternion" | "scale";

export type KeyframeEasingId =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "hold"
  | "easeInBack"
  | "easeOutBack"
  | "bounce"
  | "elastic";

export interface Keyframe {
  id: string;
  time: number;
  value: number[];
}

/** Outgoing easing from this bone pose keyframe to the next one on the timeline. */
export interface BonePoseEasing {
  boneName: string;
  time: number;
  easing: KeyframeEasingId;
}

export interface BoneTrackData {
  boneName: string;
  property: TransformProperty;
  keyframes: Keyframe[];
}

export interface CustomClipData {
  id: string;
  name: string;
  duration: number;
  fps: number;
  loop: boolean;
  tracks: BoneTrackData[];
  /** Per-pose outgoing easing (bone + time); defaults to linear when missing. */
  poseEasings?: BonePoseEasing[];
}

export type BoneRole =
  | "hips"
  | "spine"
  | "chest"
  | "neck"
  | "head"
  | "shoulderL"
  | "shoulderR"
  | "upperArmL"
  | "upperArmR"
  | "lowerArmL"
  | "lowerArmR"
  | "handL"
  | "handR"
  | "upperLegL"
  | "upperLegR"
  | "lowerLegL"
  | "lowerLegR"
  | "footL"
  | "footR";
