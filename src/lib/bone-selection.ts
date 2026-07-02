import type { ModelData } from "@/types/model";

export interface BonePickModifiers {
  /** Ctrl/Cmd — toggle bone in selection. */
  additive?: boolean;
  /** Shift — select range from anchor to clicked bone. */
  range?: boolean;
}

/** Depth-first bone order as shown in the armature tree. */
export function getOrderedBoneNames(model: ModelData): string[] {
  return model.skeletonGroups.flatMap((g) => g.bones.map((b) => b.name));
}

export function getBoneRange(ordered: string[], anchor: string, target: string): string[] {
  const a = ordered.indexOf(anchor);
  const b = ordered.indexOf(target);
  if (a === -1) return b === -1 ? [target] : ordered.slice(b, b + 1);
  if (b === -1) return [target];
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return ordered.slice(lo, hi + 1);
}

/** Preserve tree order while merging unique names. */
export function mergeBoneSelection(ordered: string[], names: Iterable<string>): string[] {
  const want = new Set(names);
  return ordered.filter((n) => want.has(n));
}

export function resolvePickSelection(
  ordered: string[],
  current: string[],
  anchor: string | null,
  name: string,
  modifiers: BonePickModifiers
): { selected: string[]; anchor: string } {
  const additive = modifiers.additive ?? false;
  const range = modifiers.range ?? false;
  const anchorName = anchor && ordered.includes(anchor) ? anchor : name;

  if (range) {
    const rangeNames = getBoneRange(ordered, anchorName, name);
    if (additive) {
      const merged = new Set([...current, ...rangeNames]);
      return { selected: mergeBoneSelection(ordered, merged), anchor: name };
    }
    return { selected: rangeNames, anchor: name };
  }

  if (additive) {
    const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
    return { selected: mergeBoneSelection(ordered, next), anchor: name };
  }

  return { selected: [name], anchor: name };
}
