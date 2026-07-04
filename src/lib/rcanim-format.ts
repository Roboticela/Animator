import type { ClipSource, CustomClipData, SourceExtension } from "@/types/model";

export const RCANIM_FORMAT = "rcanim" as const;
export const RCANIM_VERSION = 2;
export const RCANIM_VERSION_LEGACY = 1;

export interface RcanimRestTransform {
  position: number[];
  quaternion: number[];
  scale: number[];
}

export interface RcanimClip {
  id: string;
  name: string;
  source: ClipSource;
  /** Set when the clip originated from the procedural library. */
  proceduralId?: string;
  editable: CustomClipData;
}

export interface RcanimPlaybackState {
  activeClipId: string | null;
  loop: boolean;
  loopInRange: boolean;
  playRangeStart: number;
  playRangeEnd: number;
  speed: number;
  currentTime: number;
}

export interface RcanimModelPayloadV2 {
  sourceName: string;
  sourceExt: SourceExtension;
  /** gzip-compressed model bytes, base64-encoded */
  dataGzipBase64: string;
}

/** v1 on-disk shape — still supported when opening older projects. */
export interface RcanimModelPayloadV1 {
  sourceName: string;
  sourceExt: SourceExtension;
  glbBase64: string;
}

export type RcanimModelPayload = RcanimModelPayloadV2 | RcanimModelPayloadV1;

export interface RcanimProjectFile {
  format: typeof RCANIM_FORMAT;
  version: number;
  projectName: string;
  savedAt: string;
  model: RcanimModelPayload;
  restPose: Record<string, RcanimRestTransform>;
  clips: RcanimClip[];
  playback: RcanimPlaybackState;
}

function hasModelPayload(model: unknown): model is RcanimModelPayload {
  if (!model || typeof model !== "object") return false;
  const m = model as Record<string, unknown>;
  return typeof m.dataGzipBase64 === "string" || typeof m.glbBase64 === "string";
}

export function isRcanimProject(value: unknown): value is RcanimProjectFile {
  if (!value || typeof value !== "object") return false;
  const file = value as RcanimProjectFile;
  return (
    file.format === RCANIM_FORMAT &&
    (file.version === RCANIM_VERSION || file.version === RCANIM_VERSION_LEGACY) &&
    hasModelPayload(file.model) &&
    Array.isArray(file.clips)
  );
}

export function isRcanimModelV2(model: RcanimModelPayload): model is RcanimModelPayloadV2 {
  return "dataGzipBase64" in model && typeof model.dataGzipBase64 === "string";
}
