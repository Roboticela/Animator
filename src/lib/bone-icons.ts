import type { LucideIcon } from "lucide-react";
import {
  Bone,
  CircleDot,
  Footprints,
  GitBranch,
  Hand,
  MoveVertical,
  Network,
  PersonStanding,
  Target,
} from "lucide-react";

function normalizeBoneName(name: string): string {
  return name
    .replace(/^mixamorig[:_]?/i, "")
    .replace(/^def[-_]/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function getArmatureIcon(): LucideIcon {
  return Network;
}

export function getBoneIcon(name: string, depth: number): LucideIcon {
  if (depth === 0) return GitBranch;
  const n = normalizeBoneName(name);
  if (/head|skull|jaw|face|eye|ear/.test(n)) return PersonStanding;
  if (/neck/.test(n)) return Target;
  if (/spine|chest|hips|pelvis|torso|abdomen/.test(n)) return MoveVertical;
  if (/hand|finger|thumb|wrist|palm/.test(n)) return Hand;
  if (/foot|toe|ankle|heel/.test(n)) return Footprints;
  if (/arm|shoulder|elbow|forearm|clavicle|leg|thigh|knee|shin|calf/.test(n)) return Bone;
  return CircleDot;
}
