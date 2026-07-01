import * as THREE from "three";
import { collectSkeletonGroups, computeSceneStats } from "@/lib/bone-utils";
import type { ModelData } from "@/types/model";

function addSegmentMesh(
  bone: THREE.Bone,
  length: number,
  axis: "x" | "y",
  sign: 1 | -1,
  radius: number,
  color: number
) {
  const height = Math.max(length - radius * 2, 0.02);
  const geometry = new THREE.CapsuleGeometry(radius, height, 4, 8);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (axis === "x") {
    mesh.rotation.z = Math.PI / 2;
    mesh.position.x = (length / 2) * sign;
  } else {
    mesh.position.y = (length / 2) * sign;
  }
  bone.add(mesh);
  return mesh;
}

/**
 * Builds a small procedural humanoid rig (Mixamo-style bone names, primitive
 * capsule/box meshes parented directly to each bone) entirely from code —
 * no binary asset needed — so the app is usable via "Load Sample Rig"
 * before the user ever imports their own file.
 */
export function buildSampleRig(): ModelData {
  const root = new THREE.Group();
  root.name = "Sample Rig";

  const armature = new THREE.Group();
  armature.name = "Armature";
  root.add(armature);

  const makeBone = (name: string, parent: THREE.Object3D, position: [number, number, number]) => {
    const bone = new THREE.Bone();
    bone.name = name;
    bone.position.set(...position);
    parent.add(bone);
    return bone;
  };

  const skin = 0xd8b48c;
  const cloth = 0x3d6a80;
  const limb = 0x2f4157;
  const shoe = 0x1c1c1c;

  const hips = makeBone("Hips", armature, [0, 1.0, 0]);
  const pelvisMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.14, 0.15),
    new THREE.MeshStandardMaterial({ color: cloth, roughness: 0.6 })
  );
  pelvisMesh.castShadow = true;
  pelvisMesh.receiveShadow = true;
  hips.add(pelvisMesh);

  const spine = makeBone("Spine", hips, [0, 0.12, 0]);
  const spine1 = makeBone("Spine1", spine, [0, 0.14, 0]);
  const spine2 = makeBone("Spine2", spine1, [0, 0.14, 0]);
  addSegmentMesh(spine, 0.28, "y", 1, 0.13, cloth);
  const neck = makeBone("Neck", spine2, [0, 0.12, 0]);
  const head = makeBone("Head", neck, [0, 0.1, 0]);
  addSegmentMesh(neck, 0.1, "y", 1, 0.045, skin);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 16), new THREE.MeshStandardMaterial({ color: skin, roughness: 0.5 }));
  headMesh.position.y = 0.08;
  headMesh.castShadow = true;
  head.add(headMesh);

  const buildArm = (side: "Left" | "Right", sign: 1 | -1) => {
    const shoulder = makeBone(`${side}Shoulder`, spine2, [0.09 * sign, 0.08, 0]);
    const arm = makeBone(`${side}Arm`, shoulder, [0.09 * sign, 0, 0]);
    const foreArm = makeBone(`${side}ForeArm`, arm, [0.26 * sign, 0, 0]);
    const hand = makeBone(`${side}Hand`, foreArm, [0.24 * sign, 0, 0]);
    addSegmentMesh(arm, 0.26, "x", sign, 0.045, skin);
    addSegmentMesh(foreArm, 0.24, "x", sign, 0.04, skin);
    addSegmentMesh(hand, 0.09, "x", sign, 0.03, skin);
    return { shoulder, arm, foreArm, hand };
  };
  buildArm("Left", 1);
  buildArm("Right", -1);

  const buildLeg = (side: "Left" | "Right", sign: 1 | -1) => {
    const upLeg = makeBone(`${side}UpLeg`, hips, [0.1 * sign, -0.03, 0]);
    const leg = makeBone(`${side}Leg`, upLeg, [0, -0.44, 0]);
    const foot = makeBone(`${side}Foot`, leg, [0, -0.42, 0]);
    addSegmentMesh(upLeg, 0.44, "y", -1, 0.075, limb);
    addSegmentMesh(leg, 0.42, "y", -1, 0.055, limb);
    const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.2), new THREE.MeshStandardMaterial({ color: shoe, roughness: 0.4 }));
    footMesh.position.set(0, -0.02, 0.06);
    footMesh.castShadow = true;
    foot.add(footMesh);
    return { upLeg, leg, foot };
  };
  buildLeg("Left", 1);
  buildLeg("Right", -1);

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) mesh.receiveShadow = true;
  });

  return {
    object3D: root,
    skeletonGroups: collectSkeletonGroups(root),
    embeddedClips: [],
    stats: computeSceneStats(root),
    sourceName: "Sample Rig",
    sourceExt: "glb",
  };
}
