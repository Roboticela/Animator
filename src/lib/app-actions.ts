import type { ClipMeta, ModelData } from "@/types/model";
import type { RcanimPlaybackState, RcanimRestTransform } from "@/lib/rcanim-format";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { buildProceduralClip, getProceduralDef, type ProceduralAnimationId } from "@/lib/procedural";
import { buildClipFromData, captureBoneTransform, clipToCustomData, createEmptyCustomClip, deleteBoneKeyframe, ensureBonePoseEasing, nextClipId, setPoseEasing, setPoseEasingForBones, uniqueClipName, upsertKeyframe } from "@/lib/clip-builder";
import type { KeyframeEasingId } from "@/lib/keyframe-easing";
import { copyBoneTransforms, mirrorBonesOnX, pasteBoneTransforms } from "@/lib/bone-clipboard";
import { modelNeedsExternalTextures } from "@/lib/texture-maps";
import {
  buildHtmlTo3dMesh,
  createModelFromHtmlMesh,
  type HtmlTo3dSource,
} from "@/lib/html-to-3d";
import {
  buildReferenceFromHtml,
  buildReferenceFromModelBuffer,
  createEmptySceneModel,
} from "@/lib/reference-import";
import {
  normalizeImportedMaterials,
  prepareMaterialsForEnvironment,
  snapshotMeshMaterials,
} from "@/lib/model-appearance";
import { refreshModelStructure } from "@/lib/model-edit";
import * as THREE from "three";

let clipIdCounter = 0;
function embeddedClipId() {
  clipIdCounter += 1;
  return `embedded-${clipIdCounter}`;
}

/** Loads a parsed model into both stores and seeds the clip library with any embedded clips. */
export function loadModelIntoApp(data: ModelData) {
  const openTexturePrompt = modelNeedsExternalTextures(data.object3D, data.sourceExt);
  useModelStore.getState().loadModel(data, { openTexturePrompt });

  const embeddedMetas: ClipMeta[] = data.embeddedClips.map((clip) => ({
    id: embeddedClipId(),
    name: clip.name || "Embedded Clip",
    source: "embedded",
    duration: clip.duration,
    clip,
  }));

  useAnimationStore.getState().resetForNewModel(embeddedMetas);
}

/** Renders HTML/CSS/JS to a 3D plane and adds it to the scene (or starts a new scene). */
export async function importHtmlPanelToScene(source: HtmlTo3dSource): Promise<void> {
  const store = useModelStore.getState();
  store.setLoading(true, "Converting HTML to 3D…");

  try {
    const { mesh } = await buildHtmlTo3dMesh(source);

    if (!store.model) {
      const modelData = createModelFromHtmlMesh(mesh, source.name?.trim() || "HTML Scene");
      loadModelIntoApp(modelData);
      return;
    }

    normalizeImportedMaterials(mesh);
    store.model.object3D.add(mesh);
    const planeHeight =
      mesh.geometry instanceof THREE.PlaneGeometry
        ? mesh.geometry.parameters.height
        : source.planeWidth / (source.width / Math.max(source.height, 1));
    mesh.position.y = planeHeight * 0.5;

    snapshotMeshMaterials(store.model.object3D);
    prepareMaterialsForEnvironment(store.model.object3D);
    if (!store.showMaterials) store.setShowMaterials(true);

    const refreshed = refreshModelStructure(store.model);
    useModelStore.setState({
      ...refreshed,
      materialRevision: store.materialRevision + 1,
      isLoading: false,
      loadingMessage: null,
    });
  } catch (err) {
    store.setLoading(false);
    throw err;
  }
}

/** Ensures a viewport scene exists so references can be placed without a project model. */
export function ensureViewportScene() {
  if (useModelStore.getState().model) return;
  loadModelIntoApp(createEmptySceneModel());
}

/** Imports a 3D file as a session-only viewport reference (not saved in the project). */
export async function importReferenceFromFile(file: File): Promise<void> {
  ensureViewportScene();
  const store = useModelStore.getState();
  store.setLoading(true, `Importing reference ${file.name}…`);
  try {
    const buffer = await file.arrayBuffer();
    const built = await buildReferenceFromModelBuffer(buffer, file.name);
    store.addReference(built);
  } catch (err) {
    store.setLoading(false);
    throw err;
  }
}

/** Renders HTML/CSS/JS as a session-only viewport reference. */
export async function importHtmlReference(source: HtmlTo3dSource): Promise<void> {
  ensureViewportScene();
  const store = useModelStore.getState();
  store.setLoading(true, "Building HTML reference…");
  try {
    const built = await buildReferenceFromHtml(source);
    store.addReference(built);
  } catch (err) {
    store.setLoading(false);
    throw err;
  }
}

/** Restores a .rcanim project without resetting clips to embedded GLB animations. */
export function loadProjectIntoApp(
  data: ModelData,
  clips: ClipMeta[],
  playback: RcanimPlaybackState,
  restPose: Record<string, RcanimRestTransform>
) {
  useModelStore.getState().loadModel(data);

  const map = new Map<string, { position: number[]; quaternion: number[]; scale: number[] }>();
  const { boneMap } = useModelStore.getState();
  for (const [name, pose] of Object.entries(restPose)) {
    if (boneMap.has(name)) map.set(name, pose);
  }
  useModelStore.setState({ restPose: map });
  useModelStore.getState().resetToRestPose();

  useAnimationStore.getState().restoreProject(clips, playback);
}

function allBones() {
  return Array.from(useModelStore.getState().boneMap.values());
}

/** Builds (or reuses) the procedural clip for `id` and makes it the active clip. */
export function applyPremadeAnimation(id: ProceduralAnimationId) {
  const anim = useAnimationStore.getState();
  const metaId = `premade-${id}`;
  const existing = anim.clips.find((c) => c.id === metaId);

  if (existing) {
    anim.setActiveClipId(metaId);
    return true;
  }

  useModelStore.getState().resetToRestPose();
  const bones = allBones();
  const root = useModelStore.getState().model?.object3D ?? null;
  const clip = buildProceduralClip(id, bones, root);
  if (!clip) return false;

  const def = getProceduralDef(id);
  if (def?.loop === false) {
    useAnimationStore.getState().setLoop(false);
  }

  const meta: ClipMeta = { id: metaId, name: def?.name ?? id, source: "premade", duration: clip.duration, clip };
  anim.addClip(meta, true);
  return true;
}

/** Adds a procedural library animation as an editable custom clip. */
export function addLibraryAnimationAsCustom(id: ProceduralAnimationId): boolean {
  const modelStore = useModelStore.getState();
  const model = modelStore.model;
  if (!model) return false;

  modelStore.resetToRestPose();
  const bones = allBones();
  const clip = buildProceduralClip(id, bones, model.object3D);
  if (!clip) return false;

  const def = getProceduralDef(id);
  if (def?.loop === false) {
    useAnimationStore.getState().setLoop(false);
  }

  const baseName = def?.name ?? id;
  const name = uniqueClipName(baseName, useAnimationStore.getState().clips.map((c) => c.name));
  const data = clipToCustomData(clip, name);
  const built = buildClipFromData(data);
  const meta: ClipMeta = {
    id: data.id,
    name,
    source: "custom",
    duration: data.duration,
    clip: built,
    editable: data,
  };
  useAnimationStore.getState().addClip(meta, true);
  return true;
}

export function createNewCustomClip(name = "New Clip") {
  const data = createEmptyCustomClip(name);
  const clip = buildClipFromData(data);
  const meta: ClipMeta = { id: data.id, name, source: "custom", duration: data.duration, clip, editable: data };
  useAnimationStore.getState().addClip(meta, true);
  return meta;
}

/** Duplicates any clip (embedded/premade/custom) into a new editable custom clip, seeded with its keyframes. */
export function duplicateClipAsCustom(source: ClipMeta) {
  const data = clipToCustomData(source.clip, `${source.name} Copy`);
  const clip = buildClipFromData(data);
  const meta: ClipMeta = { id: data.id, name: data.name, source: "custom", duration: data.duration, clip, editable: data };
  useAnimationStore.getState().addClip(meta, true);
  return meta;
}

export function duplicateCustomClip(source: ClipMeta) {
  if (!source.editable) return duplicateClipAsCustom(source);
  const data = { ...source.editable, id: nextClipId(), name: `${source.name} Copy` };
  const clip = buildClipFromData(data);
  const meta: ClipMeta = { id: data.id, name: data.name, source: "custom", duration: data.duration, clip, editable: data };
  useAnimationStore.getState().addClip(meta, true);
  return meta;
}

/** Record keyframes at the playhead for every currently selected bone. */
export function setKeyframesForSelection(): boolean {
  const { boneMap, selectedBoneNames } = useModelStore.getState();
  const { clips, activeClipId, currentTime, updateCustomClipData } = useAnimationStore.getState();
  const activeClip = clips.find((c) => c.id === activeClipId);
  if (!activeClip?.editable || activeClip.source !== "custom") return false;
  if (selectedBoneNames.length === 0) return false;

  const clipId = activeClip.id;
  updateCustomClipData(clipId, (data) => {
    let next = data;
    for (const name of selectedBoneNames) {
      const bone = boneMap.get(name)?.bone;
      if (!bone) continue;
      (["position", "quaternion", "scale"] as const).forEach((prop) => {
        next = upsertKeyframe(next, bone.name, prop, currentTime, captureBoneTransform(bone, prop));
      });
      next = ensureBonePoseEasing(next, bone.name, currentTime);
    }
    return next;
  });
  return true;
}

/** Set outgoing easing on the selected keyframe (segment to the next keyframe). */
export function setKeyframeEasingForSelection(easing: KeyframeEasingId, applyToAllBonesAtTime = false): boolean {
  const { selectedBoneNames } = useModelStore.getState();
  const { clips, activeClipId, updateCustomClipData } = useAnimationStore.getState();
  const activeClip = clips.find((c) => c.id === activeClipId);
  if (!activeClip?.editable || activeClip.source !== "custom") return false;

  const clipId = activeClip.id;
  updateCustomClipData(clipId, (data) => {
    if (applyToAllBonesAtTime) {
      const times = new Set<number>();
      for (const track of data.tracks) {
        for (const k of track.keyframes) times.add(Number(k.time.toFixed(4)));
      }
      let next = data;
      for (const time of times) {
        const bonesAtTime = data.tracks
          .filter((t) => t.keyframes.some((k) => Math.abs(k.time - time) < 1 / (data.fps * 2)))
          .map((t) => t.boneName);
        next = setPoseEasingForBones(next, [...new Set(bonesAtTime)], time, easing);
      }
      return next;
    }

    if (selectedBoneNames.length === 0) return data;

    let next = data;
    for (const boneName of selectedBoneNames) {
      const times = data.tracks
        .filter((t) => t.boneName === boneName)
        .flatMap((t) => t.keyframes.map((k) => Number(k.time.toFixed(4))));
      const unique = [...new Set(times)].sort((a, b) => a - b);
      if (unique.length === 0) continue;
      // Apply to the latest keyframe at or before playhead, or the first keyframe
      const { currentTime } = useAnimationStore.getState();
      const target =
        unique.filter((t) => t <= currentTime + 1 / (data.fps * 2)).pop() ?? unique[unique.length - 1];
      next = setPoseEasing(next, boneName, target, easing);
    }
    return next;
  });
  return true;
}

/** Set easing on a specific bone keyframe (used by timeline UI). */
export function setBoneKeyframeEasing(boneName: string, time: number, easing: KeyframeEasingId): boolean {
  const { clips, activeClipId, updateCustomClipData } = useAnimationStore.getState();
  const activeClip = clips.find((c) => c.id === activeClipId);
  if (!activeClip?.editable || activeClip.source !== "custom") return false;

  updateCustomClipData(activeClip.id, (data) => setPoseEasing(data, boneName, time, easing));
  return true;
}

/** Apply the same outgoing easing to every bone that has a keyframe at `time`. */
export function setEasingForAllBonesAtTime(time: number, easing: KeyframeEasingId): boolean {
  const { clips, activeClipId, updateCustomClipData } = useAnimationStore.getState();
  const activeClip = clips.find((c) => c.id === activeClipId);
  if (!activeClip?.editable || activeClip.source !== "custom") return false;

  updateCustomClipData(activeClip.id, (data) => {
    const epsilon = 1 / (data.fps * 2);
    const boneNames = [
      ...new Set(
        data.tracks
          .filter((t) => t.keyframes.some((k) => Math.abs(k.time - time) <= epsilon))
          .map((t) => t.boneName)
      ),
    ];
    return setPoseEasingForBones(data, boneNames, time, easing);
  });
  return true;
}

/** Reset selected bones to bind pose. */
export function resetSelectedBones() {
  const { boneMap, restPose, selectedBoneNames } = useModelStore.getState();
  for (const name of selectedBoneNames) {
    const bone = boneMap.get(name)?.bone;
    const rest = restPose.get(name);
    if (!bone || !rest) continue;
    bone.position.fromArray(rest.position);
    bone.quaternion.fromArray(rest.quaternion);
    bone.scale.fromArray(rest.scale);
  }
}

export function copySelectedBoneTransforms(): number {
  const { boneMap, selectedBoneNames } = useModelStore.getState();
  const bones = selectedBoneNames.map((n) => boneMap.get(n)?.bone).filter(Boolean) as import("three").Bone[];
  return copyBoneTransforms(bones);
}

export function pasteSelectedBoneTransforms(): number {
  const { boneMap, selectedBoneNames } = useModelStore.getState();
  const bones = selectedBoneNames.map((n) => boneMap.get(n)?.bone).filter(Boolean) as import("three").Bone[];
  return pasteBoneTransforms(bones);
}

export function mirrorSelectedBonesOnX(): void {
  const { boneMap, selectedBoneNames } = useModelStore.getState();
  const bones = selectedBoneNames.map((n) => boneMap.get(n)?.bone).filter(Boolean) as import("three").Bone[];
  mirrorBonesOnX(bones);
}

/** Remove keyframes at the playhead for all selected bones in the active custom clip. */
export function deleteKeyframesAtPlayheadForSelection(): boolean {
  const { boneMap, selectedBoneNames } = useModelStore.getState();
  const { clips, activeClipId, currentTime, updateCustomClipData } = useAnimationStore.getState();
  const activeClip = clips.find((c) => c.id === activeClipId);
  if (!activeClip?.editable || activeClip.source !== "custom") return false;
  if (selectedBoneNames.length === 0) return false;

  updateCustomClipData(activeClip.id, (data) => {
    let next = data;
    for (const name of selectedBoneNames) {
      if (!boneMap.has(name)) continue;
      next = deleteBoneKeyframe(next, name, currentTime);
    }
    return next;
  });
  return true;
}
