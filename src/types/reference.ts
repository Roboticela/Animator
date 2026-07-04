import type * as THREE from "three";

export type ReferenceKind = "model" | "html";

export interface SceneReference {
  id: string;
  name: string;
  kind: ReferenceKind;
  root: THREE.Object3D;
  visible: boolean;
  sourceName?: string;
}

export const REFERENCE_ID_KEY = "_animatorReferenceId";
