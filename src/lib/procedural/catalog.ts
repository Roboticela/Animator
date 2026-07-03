import { BASE_ANIMATIONS, type BaseAnimationId, type ProceduralCategory } from "@/lib/procedural/base-defs";
import { VARIANT_PRESETS, clampVariantDuration, type AnimationVariant } from "@/lib/procedural/variants";

/** 50 bases × (1 original + 19 variants) = 1,000 */
export const LIBRARY_ANIMATION_COUNT = BASE_ANIMATIONS.length * (1 + VARIANT_PRESETS.length);

export type ProceduralAnimationId = string;

export interface ProceduralAnimationDef {
  id: ProceduralAnimationId;
  baseId: BaseAnimationId;
  name: string;
  description: string;
  duration: number;
  category: ProceduralCategory;
  loop?: boolean;
  usesOpacity?: boolean;
  variant?: AnimationVariant;
}

function buildCatalog(): ProceduralAnimationDef[] {
  const catalog: ProceduralAnimationDef[] = [];

  for (const base of BASE_ANIMATIONS) {
    catalog.push({
      id: base.id,
      baseId: base.id,
      name: base.name,
      description: base.description,
      duration: base.duration,
      category: base.category,
      loop: base.loop,
      usesOpacity: base.usesOpacity,
    });

    VARIANT_PRESETS.forEach((preset, index) => {
      catalog.push({
        id: `${base.id}::${String(index + 1).padStart(2, "0")}`,
        baseId: base.id,
        name: `${base.name} · ${preset.label}`,
        description: `${base.description} (${preset.label.toLowerCase()} tempo & intensity)`,
        duration: clampVariantDuration(base.duration / preset.speedMul),
        category: base.category,
        loop: base.loop,
        usesOpacity: base.usesOpacity,
        variant: preset,
      });
    });
  }

  if (catalog.length !== LIBRARY_ANIMATION_COUNT) {
    throw new Error(
      `Library catalog size mismatch: expected ${LIBRARY_ANIMATION_COUNT} (${BASE_ANIMATIONS.length} bases × ${1 + VARIANT_PRESETS.length}), got ${catalog.length}`
    );
  }

  return catalog;
}

export const PROCEDURAL_ANIMATIONS = buildCatalog();

const catalogById = new Map<string, ProceduralAnimationDef>(
  PROCEDURAL_ANIMATIONS.map((def) => [def.id, def])
);

export const PROCEDURAL_ANIMATION_IDS = PROCEDURAL_ANIMATIONS.map((def) => def.id);

export function getProceduralDef(id: ProceduralAnimationId): ProceduralAnimationDef | undefined {
  return catalogById.get(id);
}

export function getBaseAnimationId(id: ProceduralAnimationId): BaseAnimationId | undefined {
  return getProceduralDef(id)?.baseId;
}
