import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowDownUp,
  ArrowLeftFromLine,
  ArrowLeftToLine,
  ArrowLeftRight,
  ArrowRightFromLine,
  ArrowRightToLine,
  ArrowUp,
  ArrowUpCircle,
  ArrowUpFromLine,
  BetweenHorizontalStart,
  Bird,
  Bot,
  ChevronsDown,
  Cloud,
  Feather,
  FlipHorizontal,
  FlipHorizontal2,
  Footprints,
  Gauge,
  Hand,
  HandFist,
  HandMetal,
  HeartPulse,
  HelpCircle,
  EyeOff,
  Maximize2,
  Medal,
  MoveHorizontal,
  Music2,
  Orbit,
  PersonStanding,
  Pointer,
  Rabbit,
  Repeat,
  Rotate3d,
  RotateCcw,
  RotateCw,
  ScanEye,
  Shield,
  Shrink,
  Skull,
  Spline,
  Sunrise,
  Sunset,
  Target,
  ThumbsUp,
  Trophy,
  Vibrate,
  Waypoints,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { getBaseAnimationId, type BaseAnimationId, type ProceduralAnimationId, type ProceduralCategory } from "@/lib/procedural/defs";

const CATEGORY_ICONS: Record<ProceduralCategory, LucideIcon> = {
  locomotion: Footprints,
  gesture: Hand,
  transition: ArrowLeftRight,
  effect: Orbit,
  action: Target,
};

const BASE_ANIMATION_ICONS: Record<BaseAnimationId, LucideIcon> = {
  // Locomotion
  idle: PersonStanding,
  walk: Footprints,
  run: Rabbit,
  strafe: MoveHorizontal,
  sneak: EyeOff,
  tiptoe: Feather,
  zombie: Skull,
  robot: Bot,

  // Gestures
  wave: Hand,
  point: Pointer,
  salute: Medal,
  bow: ChevronsDown,
  shrug: HelpCircle,
  clap: HandMetal,
  thumbsUp: ThumbsUp,
  stretch: Maximize2,
  lookAround: ScanEye,
  nod: ArrowDownUp,

  // Actions
  jump: ArrowUpCircle,
  spin: RotateCw,
  dance: Music2,
  celebrate: Trophy,
  stumble: AlertTriangle,
  punch: HandFist,
  kick: ArrowUpFromLine,
  dodge: Shield,

  // Transitions
  fadeIn: Sunrise,
  fadeOut: Sunset,
  popIn: ZoomIn,
  popOut: ZoomOut,
  riseUp: ArrowUp,
  dropDown: ArrowDown,
  slideInLeft: ArrowRightFromLine,
  slideInRight: ArrowLeftFromLine,
  slideOutLeft: ArrowLeftToLine,
  slideOutRight: ArrowRightToLine,
  flipIn: FlipHorizontal,
  flipOut: FlipHorizontal2,

  // Effects
  bounce: Repeat,
  shake: Vibrate,
  wiggle: Spline,
  pulse: HeartPulse,
  float: Cloud,
  hover: Bird,
  squashStretch: BetweenHorizontalStart,
  spinFast: Gauge,
  tumble: Rotate3d,
  growShrink: Shrink,
  sway: Waypoints,
  twist: RotateCcw,
};

export function getAnimationIcon(id: ProceduralAnimationId, category: ProceduralCategory): LucideIcon {
  const baseId = getBaseAnimationId(id);
  if (baseId && BASE_ANIMATION_ICONS[baseId]) return BASE_ANIMATION_ICONS[baseId];
  return CATEGORY_ICONS[category] ?? Activity;
}

export function getCategoryIcon(category: ProceduralCategory): LucideIcon {
  return CATEGORY_ICONS[category];
}
