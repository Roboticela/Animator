import * as THREE from "three";
import {
  cloneModelForPreview,
  disposePreviewRoot,
  getDefaultPreviewSource,
  preparePreviewRoot,
} from "@/lib/animation-preview";
import { yieldToMain } from "@/lib/yield-main";

let cachedSource: THREE.Object3D | null = null;
let cacheKey: string | null = null;
let warmPromise: Promise<THREE.Object3D> | null = null;

function cacheKeyFor(source: THREE.Object3D): string {
  return source.uuid;
}

/** Warms the library preview cache using the lightweight sample rig (not the loaded model). */
export async function warmLibraryPreviewCache(): Promise<THREE.Object3D> {
  const source = getDefaultPreviewSource();
  const key = cacheKeyFor(source);

  if (cachedSource && cacheKey === key) return cachedSource;
  if (warmPromise && cacheKey === key) return warmPromise;

  clearLibraryPreviewCache();
  cacheKey = key;

  warmPromise = (async () => {
    await yieldToMain();
    const clone = cloneModelForPreview(source);
    preparePreviewRoot(clone);
    await yieldToMain();
    cachedSource = clone;
    return clone;
  })();

  try {
    return await warmPromise;
  } finally {
    warmPromise = null;
  }
}

export function isLibraryPreviewCacheReady(): boolean {
  const source = getDefaultPreviewSource();
  return Boolean(cachedSource && cacheKey === cacheKeyFor(source));
}

/** Waits for an in-flight warm or starts one if needed. */
export async function waitForLibraryPreviewCache(): Promise<THREE.Object3D | null> {
  if (isLibraryPreviewCacheReady()) return cachedSource;
  try {
    return await warmLibraryPreviewCache();
  } catch {
    return null;
  }
}

/** Independent clone for a single card preview (animation state is per-clone). */
export function cloneFromLibraryPreviewCache(): THREE.Object3D | null {
  if (!cachedSource) return null;
  const clone = cloneModelForPreview(cachedSource);
  preparePreviewRoot(clone);
  return clone;
}

export function clearLibraryPreviewCache(): void {
  if (cachedSource) {
    disposePreviewRoot(cachedSource);
    cachedSource = null;
  }
  cacheKey = null;
  warmPromise = null;
}
