import { exportModelAsGlb } from "@/lib/export";
import { loadModelFromBuffer } from "@/lib/model-loader";
import { buildClipFromData, clipToCustomData } from "@/lib/clip-builder";
import { base64ToBytes, bytesToBase64 } from "@/lib/binary-encoding";
import { gzipBytes, gunzipBytes } from "@/lib/compression";
import {
  isRcanimModelV2,
  isRcanimProject,
  RCANIM_FORMAT,
  RCANIM_VERSION,
  type RcanimProjectFile,
  type RcanimRestTransform,
} from "@/lib/rcanim-format";
import { saveBytes, type OpenedFile } from "@/lib/tauri";
import { loadProjectIntoApp } from "@/lib/app-actions";
import { useAnimationStore } from "@/store/animationStore";
import { useModelStore } from "@/store/modelStore";
import type { ClipMeta, SourceExtension } from "@/types/model";

function projectNameFromPath(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "") || "Project";
}

function modelFileName(sourceName: string, sourceExt: SourceExtension): string {
  const lower = sourceName.toLowerCase();
  if (lower.endsWith(`.${sourceExt}`)) return sourceName;
  const base = sourceName.replace(/\.[^.]+$/, "") || "model";
  return `${base}.${sourceExt}`;
}

function clipMetaFromRcanim(entry: RcanimProjectFile["clips"][number]): ClipMeta {
  const editable = { ...entry.editable, id: entry.id, name: entry.name };
  const clip = buildClipFromData(editable);
  return {
    id: entry.id,
    name: entry.name,
    source: "custom",
    duration: editable.duration,
    clip,
    editable,
  };
}

export class RcanimError extends Error {}

async function decodeModelBytes(project: RcanimProjectFile): Promise<Uint8Array> {
  const { model } = project;
  if (isRcanimModelV2(model)) {
    const gzipped = base64ToBytes(model.dataGzipBase64);
    return gunzipBytes(gzipped);
  }
  return base64ToBytes(model.glbBase64);
}

export async function parseRcanimBuffer(buffer: ArrayBuffer): Promise<RcanimProjectFile> {
  const raw = new Uint8Array(buffer);
  const jsonBytes = await gunzipBytes(raw);
  let parsed: unknown;
  try {
    const text = new TextDecoder().decode(jsonBytes);
    parsed = JSON.parse(text);
  } catch {
    throw new RcanimError("Invalid .rcanim file — could not parse project data.");
  }

  if (!isRcanimProject(parsed)) {
    throw new RcanimError("Unsupported or invalid .rcanim project file.");
  }

  return parsed;
}

async function encodeModelPayload(model: NonNullable<ReturnType<typeof useModelStore.getState>["model"]>) {
  let bytes: Uint8Array;
  let sourceExt = model.sourceExt;

  const useOriginalBytes =
    model.sourceBuffer && model.sourceBuffer.byteLength > 0 && !model.texturesEmbedded;

  if (useOriginalBytes) {
    bytes = new Uint8Array(model.sourceBuffer!);
  } else {
    useModelStore.getState().resetToRestPose();
    const glbBuffer = await exportModelAsGlb(model.object3D, model.embeddedClips ?? []);
    bytes = new Uint8Array(glbBuffer);
    sourceExt = "glb";
  }

  const dataGzipBase64 = bytesToBase64(await gzipBytes(bytes));
  return {
    sourceName: model.sourceName,
    sourceExt,
    dataGzipBase64,
  };
}

export async function buildRcanimProject(projectName: string): Promise<RcanimProjectFile> {
  const modelStore = useModelStore.getState();
  const animStore = useAnimationStore.getState();
  const model = modelStore.model;
  if (!model) throw new RcanimError("Load a model before saving a project.");

  const modelPayload = await encodeModelPayload(model);

  const restPose: Record<string, RcanimRestTransform> = {};
  modelStore.restPose.forEach((pose, name) => {
    restPose[name] = pose;
  });

  const clips = animStore.clips.map((meta) => {
    const editable = meta.editable ?? clipToCustomData(meta.clip, meta.name, 30);
    const proceduralId = meta.id.startsWith("premade-") ? meta.id.slice("premade-".length) : undefined;
    return {
      id: meta.id,
      name: meta.name,
      source: meta.source,
      proceduralId,
      editable: { ...editable, id: meta.id, name: meta.name },
    };
  });

  return {
    format: RCANIM_FORMAT,
    version: RCANIM_VERSION,
    projectName,
    savedAt: new Date().toISOString(),
    model: modelPayload,
    restPose,
    clips,
    playback: {
      activeClipId: animStore.activeClipId,
      loop: animStore.loop,
      loopInRange: animStore.loopInRange,
      playRangeStart: animStore.playRangeStart,
      playRangeEnd: animStore.playRangeEnd,
      speed: animStore.speed,
      currentTime: animStore.currentTime,
    },
  };
}

export async function serializeRcanimProject(project: RcanimProjectFile): Promise<Uint8Array> {
  const json = JSON.stringify(project);
  const jsonBytes = new TextEncoder().encode(json);
  return gzipBytes(jsonBytes);
}

export async function saveRcanimProject(projectName?: string): Promise<boolean> {
  const model = useModelStore.getState().model;
  const name = projectName?.trim() || projectNameFromPath(model?.sourceName ?? "project");
  const project = await buildRcanimProject(name);
  const bytes = await serializeRcanimProject(project);
  return saveBytes(`${name}.rcanim`, bytes, "rcanim");
}

export async function loadRcanimProjectFromBuffer(buffer: ArrayBuffer, fileName: string): Promise<void> {
  const project = await parseRcanimBuffer(buffer);
  const modelBytes = await decodeModelBytes(project);
  const modelBuffer = modelBytes.buffer.slice(
    modelBytes.byteOffset,
    modelBytes.byteOffset + modelBytes.byteLength
  ) as ArrayBuffer;

  const isV2 = isRcanimModelV2(project.model);
  const sourceExt = isV2 ? project.model.sourceExt || "glb" : "glb";
  const displayName = project.model.sourceName || project.projectName || projectNameFromPath(fileName);
  const loadName = modelFileName(displayName, sourceExt);

  const modelData = await loadModelFromBuffer(modelBuffer, loadName, { keepSourceBuffer: true });
  modelData.sourceName = displayName;
  modelData.sourceExt = sourceExt;

  const clips = project.clips.map(clipMetaFromRcanim);
  loadProjectIntoApp(modelData, clips, project.playback, project.restPose);
}

export async function openRcanimFromFile(file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  await loadRcanimProjectFromBuffer(buffer, file.name);
}

export async function openRcanimFromNative(opened: OpenedFile): Promise<void> {
  await loadRcanimProjectFromBuffer(opened.data, opened.name);
}
