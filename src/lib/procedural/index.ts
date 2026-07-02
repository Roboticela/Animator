import * as THREE from "three";
import { matchBoneRoles } from "@/lib/bone-utils";
import type { BoneInfo } from "@/types/model";
import * as B from "@/lib/procedural/builders";
import { getProceduralDef, type ProceduralAnimationId } from "@/lib/procedural/defs";
import { ensureRootName } from "@/lib/procedural/tracks";

export {
  PROCEDURAL_ANIMATIONS,
  PROCEDURAL_CATEGORIES,
  PROCEDURAL_ANIMATION_IDS,
  getProceduralDef,
  type ProceduralAnimationDef,
  type ProceduralAnimationId,
  type ProceduralCategory,
} from "@/lib/procedural/defs";

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

  let tracks: THREE.KeyframeTrack[] = [];

  switch (id) {
    case "idle":
      tracks = B.buildIdle(roles, def.duration);
      break;
    case "walk":
      tracks = B.buildWalk(roles, def.duration);
      break;
    case "run":
      tracks = B.buildRun(roles, def.duration);
      break;
    case "strafe":
      tracks = B.buildStrafe(roles, def.duration);
      break;
    case "sneak":
      tracks = B.buildSneak(roles, def.duration);
      break;
    case "tiptoe":
      tracks = B.buildTiptoe(roles, def.duration);
      break;
    case "zombie":
      tracks = B.buildZombie(roles, def.duration);
      break;
    case "robot":
      tracks = B.buildRobot(roles, def.duration);
      break;
    case "wave":
      tracks = B.buildWave(roles, def.duration);
      break;
    case "point":
      tracks = B.buildPoint(roles, def.duration);
      break;
    case "salute":
      tracks = B.buildSalute(roles, def.duration);
      break;
    case "bow":
      tracks = B.buildBow(roles, def.duration);
      break;
    case "shrug":
      tracks = B.buildShrug(roles, def.duration);
      break;
    case "clap":
      tracks = B.buildClap(roles, def.duration);
      break;
    case "thumbsUp":
      tracks = B.buildThumbsUp(roles, def.duration);
      break;
    case "stretch":
      tracks = B.buildStretch(roles, def.duration);
      break;
    case "lookAround":
      tracks = B.buildLookAround(roles, def.duration);
      break;
    case "nod":
      tracks = B.buildNod(roles, def.duration);
      break;
    case "jump":
      tracks = B.buildJump(roles, def.duration);
      break;
    case "spin":
      tracks = B.buildSpin(roles, def.duration);
      break;
    case "dance":
      tracks = B.buildDance(roles, def.duration);
      break;
    case "celebrate":
      tracks = B.buildCelebrate(roles, def.duration);
      break;
    case "stumble":
      tracks = B.buildStumble(roles, def.duration);
      break;
    case "punch":
      tracks = B.buildPunch(roles, def.duration);
      break;
    case "kick":
      tracks = B.buildKick(roles, def.duration);
      break;
    case "dodge":
      tracks = B.buildDodge(roles, def.duration);
      break;
    case "fadeIn":
      if (!modelRoot) return null;
      tracks = B.buildFadeIn(modelRoot, def.duration);
      break;
    case "fadeOut":
      if (!modelRoot) return null;
      tracks = B.buildFadeOut(modelRoot, def.duration);
      break;
    case "popIn":
      if (!modelRoot) return null;
      tracks = B.buildPopIn(modelRoot, def.duration);
      break;
    case "popOut":
      if (!modelRoot) return null;
      tracks = B.buildPopOut(modelRoot, def.duration);
      break;
    case "riseUp":
      if (!modelRoot) return null;
      tracks = B.buildRiseUp(modelRoot, def.duration);
      break;
    case "dropDown":
      if (!modelRoot) return null;
      tracks = B.buildDropDown(modelRoot, def.duration);
      break;
    case "slideInLeft":
      if (!modelRoot) return null;
      tracks = B.buildSlideInLeft(modelRoot, def.duration);
      break;
    case "slideInRight":
      if (!modelRoot) return null;
      tracks = B.buildSlideInRight(modelRoot, def.duration);
      break;
    case "slideOutLeft":
      if (!modelRoot) return null;
      tracks = B.buildSlideOutLeft(modelRoot, def.duration);
      break;
    case "slideOutRight":
      if (!modelRoot) return null;
      tracks = B.buildSlideOutRight(modelRoot, def.duration);
      break;
    case "flipIn":
      if (!modelRoot) return null;
      tracks = B.buildFlipIn(modelRoot, def.duration);
      break;
    case "flipOut":
      if (!modelRoot) return null;
      tracks = B.buildFlipOut(modelRoot, def.duration);
      break;
    case "bounce":
      if (!modelRoot) return null;
      tracks = B.buildBounce(modelRoot, roles, def.duration);
      break;
    case "shake":
      if (!modelRoot) return null;
      tracks = B.buildShake(modelRoot, def.duration);
      break;
    case "wiggle":
      tracks = B.buildWiggle(roles, def.duration);
      break;
    case "pulse":
      if (!modelRoot) return null;
      tracks = B.buildPulse(modelRoot, def.duration);
      break;
    case "float":
      if (!modelRoot) return null;
      tracks = B.buildFloat(modelRoot, def.duration);
      break;
    case "hover":
      if (!modelRoot) return null;
      tracks = B.buildHover(modelRoot, def.duration);
      break;
    case "squashStretch":
      if (!modelRoot) return null;
      tracks = B.buildSquashStretch(modelRoot, def.duration);
      break;
    case "spinFast":
      tracks = B.buildSpinFast(roles, def.duration);
      break;
    case "tumble":
      if (!modelRoot) return null;
      tracks = B.buildTumble(modelRoot, def.duration);
      break;
    case "growShrink":
      if (!modelRoot) return null;
      tracks = B.buildGrowShrink(modelRoot, def.duration);
      break;
    case "sway":
      if (!modelRoot) return null;
      tracks = B.buildSway(modelRoot, roles, def.duration);
      break;
    case "breathe":
      tracks = B.buildBreathe(roles, def.duration);
      break;
    case "twist":
      tracks = B.buildTwist(roles, def.duration);
      break;
  }

  if (tracks.length === 0) return null;
  return new THREE.AnimationClip(def.name, def.duration, tracks);
}

export function countMatchedRoles(bones: BoneInfo[]): number {
  return Object.keys(matchBoneRoles(bones)).length;
}
