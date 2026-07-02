import type { ClipMeta, ModelData } from "@/types/model";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { buildProceduralClip, PROCEDURAL_ANIMATIONS, type ProceduralAnimationId } from "@/lib/procedural-animations";
import { buildClipFromData, captureBoneTransform, clipToCustomData, createEmptyCustomClip, nextClipId, upsertKeyframe } from "@/lib/clip-builder";
import { copyBoneTransforms, mirrorBonesOnX, pasteBoneTransforms } from "@/lib/bone-clipboard";

let clipIdCounter = 0;
function embeddedClipId() {
  clipIdCounter += 1;
  return `embedded-${clipIdCounter}`;
}

/** Loads a parsed model into both stores and seeds the clip library with any embedded clips. */
export function loadModelIntoApp(data: ModelData) {
  useModelStore.getState().loadModel(data);

  const embeddedMetas: ClipMeta[] = data.embeddedClips.map((clip) => ({
    id: embeddedClipId(),
    name: clip.name || "Embedded Clip",
    source: "embedded",
    duration: clip.duration,
    clip,
  }));

  useAnimationStore.getState().resetForNewModel(embeddedMetas);
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
  const clip = buildProceduralClip(id, bones);
  if (!clip) return false;

  const def = PROCEDURAL_ANIMATIONS.find((a) => a.id === id);
  const meta: ClipMeta = { id: metaId, name: def?.name ?? id, source: "premade", duration: clip.duration, clip };
  anim.addClip(meta, true);
  return true;
}

/** Creates a brand-new, empty custom clip and activates it for editing. */
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
    }
    return next;
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
