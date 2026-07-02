export type ProceduralCategory = "locomotion" | "gesture" | "transition" | "effect" | "action";

export const PROCEDURAL_ANIMATION_IDS = [
  // Locomotion
  "idle",
  "walk",
  "run",
  "strafe",
  "sneak",
  "tiptoe",
  "zombie",
  "robot",
  // Gestures
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
  // Actions
  "jump",
  "spin",
  "dance",
  "celebrate",
  "stumble",
  "punch",
  "kick",
  "dodge",
  // Transitions
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
  // Effects
  "bounce",
  "shake",
  "wiggle",
  "pulse",
  "float",
  "hover",
  "squashStretch",
  "spinFast",
  "tumble",
  "growShrink",
  "sway",
  "breathe",
  "twist",
] as const;

export type ProceduralAnimationId = (typeof PROCEDURAL_ANIMATION_IDS)[number];

export interface ProceduralAnimationDef {
  id: ProceduralAnimationId;
  name: string;
  description: string;
  duration: number;
  category: ProceduralCategory;
  /** When false, clip plays once (good for fade out, pop out, etc.). */
  loop?: boolean;
  /** Needs mesh opacity tracks — requires named meshes on the model. */
  usesOpacity?: boolean;
}

export const PROCEDURAL_CATEGORIES: { id: ProceduralCategory; label: string }[] = [
  { id: "transition", label: "Transitions" },
  { id: "effect", label: "Effects" },
  { id: "locomotion", label: "Locomotion" },
  { id: "gesture", label: "Gestures" },
  { id: "action", label: "Actions" },
];

export const PROCEDURAL_ANIMATIONS: ProceduralAnimationDef[] = [
  // Transitions
  { id: "fadeIn", name: "Fade In", description: "Opacity 0 → 100%", duration: 1.2, category: "transition", loop: false, usesOpacity: true },
  { id: "fadeOut", name: "Fade Out", description: "Opacity 100% → 0", duration: 1.2, category: "transition", loop: false, usesOpacity: true },
  { id: "popIn", name: "Pop In", description: "Scale up with overshoot", duration: 0.7, category: "transition", loop: false },
  { id: "popOut", name: "Pop Out", description: "Scale down and vanish", duration: 0.6, category: "transition", loop: false },
  { id: "riseUp", name: "Rise Up", description: "Enter from below", duration: 1, category: "transition", loop: false },
  { id: "dropDown", name: "Drop Down", description: "Enter from above", duration: 1, category: "transition", loop: false },
  { id: "slideInLeft", name: "Slide In Left", description: "Enter from the left", duration: 1, category: "transition", loop: false },
  { id: "slideInRight", name: "Slide In Right", description: "Enter from the right", duration: 1, category: "transition", loop: false },
  { id: "slideOutLeft", name: "Slide Out Left", description: "Exit to the left", duration: 0.9, category: "transition", loop: false },
  { id: "slideOutRight", name: "Slide Out Right", description: "Exit to the right", duration: 0.9, category: "transition", loop: false },
  { id: "flipIn", name: "Flip In", description: "Y-axis flip reveal", duration: 0.8, category: "transition", loop: false },
  { id: "flipOut", name: "Flip Out", description: "Y-axis flip exit", duration: 0.8, category: "transition", loop: false },

  // Effects
  { id: "bounce", name: "Bounce", description: "Vertical bounce loop", duration: 1.2, category: "effect" },
  { id: "shake", name: "Shake", description: "Quick jitter", duration: 0.5, category: "effect" },
  { id: "wiggle", name: "Wiggle", description: "Hip and head wiggle", duration: 1, category: "effect" },
  { id: "pulse", name: "Pulse", description: "Rhythmic scale pulse", duration: 1.5, category: "effect" },
  { id: "float", name: "Float", description: "Gentle levitation", duration: 2.5, category: "effect" },
  { id: "hover", name: "Hover", description: "Float with slow spin", duration: 3, category: "effect" },
  { id: "squashStretch", name: "Squash & Stretch", description: "Cartoon squash cycle", duration: 1, category: "effect" },
  { id: "spinFast", name: "Spin Fast", description: "Double-speed turn", duration: 0.8, category: "effect" },
  { id: "tumble", name: "Tumble", description: "Rolling tumble", duration: 1.6, category: "effect" },
  { id: "growShrink", name: "Grow / Shrink", description: "Breathing scale", duration: 2, category: "effect" },
  { id: "sway", name: "Sway", description: "Gentle side sway", duration: 2.5, category: "effect" },
  { id: "breathe", name: "Breathe", description: "Deep breathing idle", duration: 3, category: "effect" },
  { id: "twist", name: "Twist", description: "Torso twist loop", duration: 1.5, category: "effect" },

  // Locomotion
  { id: "idle", name: "Idle", description: "Subtle breathing sway", duration: 3, category: "locomotion" },
  { id: "walk", name: "Walk", description: "Basic walk cycle", duration: 1.1, category: "locomotion" },
  { id: "run", name: "Run", description: "Fast run cycle", duration: 0.6, category: "locomotion" },
  { id: "strafe", name: "Strafe", description: "Side-step walk", duration: 1.2, category: "locomotion" },
  { id: "sneak", name: "Sneak", description: "Low crouch walk", duration: 1.4, category: "locomotion" },
  { id: "tiptoe", name: "Tiptoe", description: "Careful quiet steps", duration: 1.3, category: "locomotion" },
  { id: "zombie", name: "Zombie", description: "Shambling undead walk", duration: 1.8, category: "locomotion" },
  { id: "robot", name: "Robot", description: "Stiff mechanical steps", duration: 1, category: "locomotion" },

  // Gestures
  { id: "wave", name: "Wave", description: "Friendly hand wave", duration: 1.6, category: "gesture" },
  { id: "point", name: "Point", description: "Point forward", duration: 1.2, category: "gesture" },
  { id: "salute", name: "Salute", description: "Military salute", duration: 1.4, category: "gesture" },
  { id: "bow", name: "Bow", description: "Polite bow", duration: 1.8, category: "gesture", loop: false },
  { id: "shrug", name: "Shrug", description: "Shoulder shrug", duration: 1.2, category: "gesture" },
  { id: "clap", name: "Clap", description: "Rhythmic clapping", duration: 1.5, category: "gesture" },
  { id: "thumbsUp", name: "Thumbs Up", description: "Approval gesture", duration: 1.2, category: "gesture" },
  { id: "stretch", name: "Stretch", description: "Arms-up stretch", duration: 2, category: "gesture" },
  { id: "lookAround", name: "Look Around", description: "Head look cycle", duration: 2.5, category: "gesture" },
  { id: "nod", name: "Nod", description: "Yes nod", duration: 1, category: "gesture" },

  // Actions
  { id: "jump", name: "Jump", description: "Hopping jump loop", duration: 0.9, category: "action" },
  { id: "spin", name: "Spin", description: "Full turn on the spot", duration: 1.4, category: "action" },
  { id: "dance", name: "Dance", description: "Playful dance combo", duration: 4, category: "action" },
  { id: "celebrate", name: "Celebrate", description: "Victory jump with arms up", duration: 1.2, category: "action" },
  { id: "stumble", name: "Stumble", description: "Off-balance wobble", duration: 1, category: "action" },
  { id: "punch", name: "Punch", description: "Right-hand punch", duration: 0.7, category: "action", loop: false },
  { id: "kick", name: "Kick", description: "Front kick", duration: 0.8, category: "action", loop: false },
  { id: "dodge", name: "Dodge", description: "Quick side lean", duration: 0.6, category: "action", loop: false },
];

export function getProceduralDef(id: ProceduralAnimationId) {
  return PROCEDURAL_ANIMATIONS.find((a) => a.id === id);
}
