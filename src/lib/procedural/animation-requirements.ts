import type { BaseAnimationId } from "@/lib/procedural/base-defs";

/** Clips that animate named bones (humanoid role matching). */
export const BONE_DRIVEN_BASE_IDS = new Set<BaseAnimationId>([
  "idle",
  "walk",
  "run",
  "strafe",
  "sneak",
  "tiptoe",
  "zombie",
  "robot",
  "wave",
  "point",
  "salute",
  "bow",
  "shrug",
  "clap",
  "thumbsUp",
  "stretch",
  "lookAround",
  "nod",
  "jump",
  "spin",
  "dance",
  "celebrate",
  "stumble",
  "punch",
  "kick",
  "dodge",
  "wiggle",
  "spinFast",
  "twist",
  "bounce",
  "sway",
]);

/** Clips that animate the model root transform and/or mesh opacity. */
export const ROOT_DRIVEN_BASE_IDS = new Set<BaseAnimationId>([
  "fadeIn",
  "fadeOut",
  "popIn",
  "popOut",
  "riseUp",
  "dropDown",
  "slideInLeft",
  "slideInRight",
  "slideOutLeft",
  "slideOutRight",
  "flipIn",
  "flipOut",
  "bounce",
  "shake",
  "pulse",
  "float",
  "hover",
  "squashStretch",
  "tumble",
  "growShrink",
  "sway",
]);

export function isBoneDrivenBase(id: BaseAnimationId): boolean {
  return BONE_DRIVEN_BASE_IDS.has(id);
}

export function isRootDrivenBase(id: BaseAnimationId): boolean {
  return ROOT_DRIVEN_BASE_IDS.has(id);
}
