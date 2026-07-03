import * as THREE from "three";
import { matchBoneRoles } from "@/lib/bone-utils";
import type { BoneInfo } from "@/types/model";
import * as B from "@/lib/procedural/builders";
import { getProceduralDef, type ProceduralAnimationId } from "@/lib/procedural/catalog";
import type { BaseAnimationId } from "@/lib/procedural/base-defs";
import { applyIntensityToTracks } from "@/lib/procedural/variants";
import { ensureRootName } from "@/lib/procedural/tracks";

export {
  PROCEDURAL_ANIMATIONS,
  PROCEDURAL_CATEGORIES,
  PROCEDURAL_ANIMATION_IDS,
  LIBRARY_ANIMATION_COUNT,
  BASE_ANIMATIONS,
  BASE_ANIMATION_IDS,
  getProceduralDef,
  getBaseAnimationId,
  type ProceduralAnimationDef,
  type ProceduralAnimationId,
  type ProceduralCategory,
  type BaseAnimationId,
} from "@/lib/procedural/defs";

function buildBaseTracks(
  baseId: BaseAnimationId,
  roles: ReturnType<typeof matchBoneRoles>,
  modelRoot: THREE.Object3D | null,
  duration: number
): THREE.KeyframeTrack[] {
  let tracks: THREE.KeyframeTrack[] = [];

  switch (baseId) {
    case "idle":
      tracks = B.buildIdle(roles, duration);
      break;
    case "walk":
      tracks = B.buildWalk(roles, duration);
      break;
    case "run":
      tracks = B.buildRun(roles, duration);
      break;
    case "strafe":
      tracks = B.buildStrafe(roles, duration);
      break;
    case "sneak":
      tracks = B.buildSneak(roles, duration);
      break;
    case "tiptoe":
      tracks = B.buildTiptoe(roles, duration);
      break;
    case "zombie":
      tracks = B.buildZombie(roles, duration);
      break;
    case "robot":
      tracks = B.buildRobot(roles, duration);
      break;
    case "wave":
      tracks = B.buildWave(roles, duration);
      break;
    case "point":
      tracks = B.buildPoint(roles, duration);
      break;
    case "salute":
      tracks = B.buildSalute(roles, duration);
      break;
    case "bow":
      tracks = B.buildBow(roles, duration);
      break;
    case "shrug":
      tracks = B.buildShrug(roles, duration);
      break;
    case "clap":
      tracks = B.buildClap(roles, duration);
      break;
    case "thumbsUp":
      tracks = B.buildThumbsUp(roles, duration);
      break;
    case "stretch":
      tracks = B.buildStretch(roles, duration);
      break;
    case "lookAround":
      tracks = B.buildLookAround(roles, duration);
      break;
    case "nod":
      tracks = B.buildNod(roles, duration);
      break;
    case "jump":
      tracks = B.buildJump(roles, duration);
      break;
    case "spin":
      tracks = B.buildSpin(roles, duration);
      break;
    case "dance":
      tracks = B.buildDance(roles, duration);
      break;
    case "celebrate":
      tracks = B.buildCelebrate(roles, duration);
      break;
    case "stumble":
      tracks = B.buildStumble(roles, duration);
      break;
    case "punch":
      tracks = B.buildPunch(roles, duration);
      break;
    case "kick":
      tracks = B.buildKick(roles, duration);
      break;
    case "dodge":
      tracks = B.buildDodge(roles, duration);
      break;
    case "fadeIn":
      if (!modelRoot) return [];
      tracks = B.buildFadeIn(modelRoot, duration);
      break;
    case "fadeOut":
      if (!modelRoot) return [];
      tracks = B.buildFadeOut(modelRoot, duration);
      break;
    case "popIn":
      if (!modelRoot) return [];
      tracks = B.buildPopIn(modelRoot, duration);
      break;
    case "popOut":
      if (!modelRoot) return [];
      tracks = B.buildPopOut(modelRoot, duration);
      break;
    case "riseUp":
      if (!modelRoot) return [];
      tracks = B.buildRiseUp(modelRoot, duration);
      break;
    case "dropDown":
      if (!modelRoot) return [];
      tracks = B.buildDropDown(modelRoot, duration);
      break;
    case "slideInLeft":
      if (!modelRoot) return [];
      tracks = B.buildSlideInLeft(modelRoot, duration);
      break;
    case "slideInRight":
      if (!modelRoot) return [];
      tracks = B.buildSlideInRight(modelRoot, duration);
      break;
    case "slideOutLeft":
      if (!modelRoot) return [];
      tracks = B.buildSlideOutLeft(modelRoot, duration);
      break;
    case "slideOutRight":
      if (!modelRoot) return [];
      tracks = B.buildSlideOutRight(modelRoot, duration);
      break;
    case "flipIn":
      if (!modelRoot) return [];
      tracks = B.buildFlipIn(modelRoot, duration);
      break;
    case "flipOut":
      if (!modelRoot) return [];
      tracks = B.buildFlipOut(modelRoot, duration);
      break;
    case "bounce":
      if (!modelRoot) return [];
      tracks = B.buildBounce(modelRoot, roles, duration);
      break;
    case "shake":
      if (!modelRoot) return [];
      tracks = B.buildShake(modelRoot, duration);
      break;
    case "wiggle":
      tracks = B.buildWiggle(roles, duration);
      break;
    case "pulse":
      if (!modelRoot) return [];
      tracks = B.buildPulse(modelRoot, duration);
      break;
    case "float":
      if (!modelRoot) return [];
      tracks = B.buildFloat(modelRoot, duration);
      break;
    case "hover":
      if (!modelRoot) return [];
      tracks = B.buildHover(modelRoot, duration);
      break;
    case "squashStretch":
      if (!modelRoot) return [];
      tracks = B.buildSquashStretch(modelRoot, duration);
      break;
    case "spinFast":
      tracks = B.buildSpinFast(roles, duration);
      break;
    case "tumble":
      if (!modelRoot) return [];
      tracks = B.buildTumble(modelRoot, duration);
      break;
    case "growShrink":
      if (!modelRoot) return [];
      tracks = B.buildGrowShrink(modelRoot, duration);
      break;
    case "sway":
      if (!modelRoot) return [];
      tracks = B.buildSway(modelRoot, roles, duration);
      break;
    case "twist":
      tracks = B.buildTwist(roles, duration);
      break;
  }

  return tracks;
}

/**
 * Builds a procedural THREE.AnimationClip for the given animation id.
 * Bone animations use humanoid role heuristics; transition/effect clips may
 * animate the model root and mesh material opacity.
 */
export function buildProceduralClip(
  id: ProceduralAnimationId,
  bones: BoneInfo[],
  root?: THREE.Object3D | null
): THREE.AnimationClip | null {
  const def = getProceduralDef(id);
  if (!def) return null;

  const roles = bones.length > 0 ? matchBoneRoles(bones) : {};
  const modelRoot = root ?? null;
  if (modelRoot) ensureRootName(modelRoot);

  let tracks = buildBaseTracks(def.baseId, roles, modelRoot, def.duration);
  if (tracks.length === 0) return null;

  const intensity = def.variant?.intensityMul ?? 1;
  if (intensity !== 1) {
    tracks = applyIntensityToTracks(tracks, intensity);
  }

  return new THREE.AnimationClip(def.name, def.duration, tracks);
}

export function countMatchedRoles(bones: BoneInfo[]): number {
  return Object.keys(matchBoneRoles(bones)).length;
}
