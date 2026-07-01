import * as THREE from "three";
import type { BoneInfo, BoneRole, SkeletonGroup } from "@/types/model";

let uidCounter = 0;
function uid(prefix: string) {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
}

/**
 * Walks the whole scene graph and groups every THREE.Bone into one
 * SkeletonGroup per distinct root bone, named after the nearest non-bone
 * ancestor (matches Blender/GLTF's "Armature" convention) so multi-armature
 * files (e.g. a character + a separate prop rig) show up as separate trees.
 */
export function collectSkeletonGroups(root: THREE.Object3D): SkeletonGroup[] {
  const rootBones: THREE.Bone[] = [];

  root.traverse((obj) => {
    if ((obj as THREE.Bone).isBone) {
      const parentIsBone = Boolean((obj.parent as THREE.Bone | null)?.isBone);
      if (!parentIsBone) rootBones.push(obj as THREE.Bone);
    }
  });

  return rootBones.map((rootBone, index) => {
    const bones: BoneInfo[] = [];

    const visit = (bone: THREE.Bone, depth: number, parentUuid: string | null) => {
      bones.push({ uuid: bone.uuid, name: bone.name || `Bone_${bones.length}`, depth, parentUuid, bone });
      bone.children.forEach((child) => {
        if ((child as THREE.Bone).isBone) visit(child as THREE.Bone, depth + 1, bone.uuid);
      });
    };
    visit(rootBone, 0, null);

    const armatureName = rootBone.parent?.name && rootBone.parent.name !== "" ? rootBone.parent.name : `Armature${index > 0 ? `.${index}` : ""}`;

    return { id: uid("armature"), rootName: armatureName, bones };
  });
}

export function computeSceneStats(root: THREE.Object3D) {
  let meshCount = 0;
  let skinnedMeshCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;
  const materials = new Set<THREE.Material>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshCount += 1;
    if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) skinnedMeshCount += 1;
    const geom = mesh.geometry;
    if (geom) {
      const posAttr = geom.getAttribute("position");
      if (posAttr) vertexCount += posAttr.count;
      triangleCount += geom.index ? geom.index.count / 3 : (posAttr?.count ?? 0) / 3;
    }
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => m && materials.add(m));
  });

  return {
    meshCount,
    skinnedMeshCount,
    vertexCount,
    triangleCount: Math.round(triangleCount),
    materialCount: materials.size,
  };
}

/** Strips common rig-name prefixes (Mixamo's "mixamorig:" etc.) before pattern matching. */
function stripPrefix(name: string): string {
  return name.replace(/^mixamorig[:_]?/i, "").replace(/^def[-_]/i, "");
}

function sideOf(rawName: string): "L" | "R" | null {
  const n = rawName.toLowerCase();
  if (/\bleft\b/.test(n) || /(^|[_.\s-])l$/.test(n) || /^l[_.\s-]/.test(n)) return "L";
  if (/\bright\b/.test(n) || /(^|[_.\s-])r$/.test(n) || /^r[_.\s-]/.test(n)) return "R";
  return null;
}

/** Removes side tokens so "LeftUpperArm" / "UpperArm.L" / "upperarm_l" all reduce to "upperarm". */
function coreName(rawName: string): string {
  return rawName
    .replace(/\bleft\b/gi, "")
    .replace(/\bright\b/gi, "")
    .replace(/[_.\s-]?[lr]$/i, "")
    .replace(/^[lr][_.\s-]/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

const SIDELESS_PATTERNS: Array<{ role: BoneRole; test: RegExp }> = [
  { role: "hips", test: /^(hips?|pelvis)$/ },
  { role: "neck", test: /^neck\d*$/ },
  { role: "head", test: /^head\d*$/ },
];

const SIDED_PATTERNS: Array<{ role: string; test: RegExp }> = [
  { role: "shoulder", test: /^(shoulder|clavicle)\d*$/ },
  { role: "upperArm", test: /^(upperarm|arm)\d*$/ },
  { role: "lowerArm", test: /^(lowerarm|forearm|elbow)\d*$/ },
  { role: "hand", test: /^hand\d*$/ },
  { role: "upperLeg", test: /^(upperleg|thigh|upleg)\d*$/ },
  { role: "lowerLeg", test: /^(lowerleg|shin|calf|knee|leg)\d*$/ },
  { role: "foot", test: /^foot\d*$/ },
];

export function matchBoneRoles(bones: BoneInfo[]): Partial<Record<BoneRole, THREE.Bone>> {
  const result: Partial<Record<BoneRole, THREE.Bone>> = {};
  const used = new Set<string>();

  // Spine / chest: gather every "spine"-like bone (in hierarchy order) first;
  // the earliest becomes the lower spine, an explicit chest/last spine becomes the chest.
  const spineLike = bones.filter((b) => /^(spine\d*|chest\d*|upperchest)$/.test(coreName(b.name)));
  const chestExplicit = spineLike.find((b) => /chest/.test(coreName(b.name)));
  const spineOnly = spineLike.filter((b) => /^spine\d*$/.test(coreName(b.name)));
  if (spineOnly[0]) {
    result.spine = spineOnly[0].bone;
    used.add(spineOnly[0].uuid);
  }
  const chestBone = chestExplicit ?? spineOnly[spineOnly.length - 1];
  if (chestBone && chestBone.uuid !== spineOnly[0]?.uuid) {
    result.chest = chestBone.bone;
    used.add(chestBone.uuid);
  }

  for (const { role, test } of SIDELESS_PATTERNS) {
    const match = bones.find((b) => !used.has(b.uuid) && test.test(coreName(b.name)));
    if (match) {
      result[role] = match.bone;
      used.add(match.uuid);
    }
  }

  for (const { role, test } of SIDED_PATTERNS) {
    for (const side of ["L", "R"] as const) {
      const match = bones.find(
        (b) => !used.has(b.uuid) && sideOf(stripPrefix(b.name)) === side && test.test(coreName(b.name))
      );
      if (match) {
        result[`${role}${side}` as BoneRole] = match.bone;
        used.add(match.uuid);
      }
    }
  }

  return result;
}
