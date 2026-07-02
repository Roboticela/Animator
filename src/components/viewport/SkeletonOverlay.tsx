import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { pickBoneFromClick, useModelStore } from "@/store/modelStore";
import type { BoneInfo } from "@/types/model";

const dummy = new THREE.Object3D();
const JOINT_COLOR = new THREE.Color("#38bdf8");

export function SkeletonOverlay() {
  const model = useModelStore((s) => s.model);
  const showSkeleton = useModelStore((s) => s.showSkeleton);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);
  const pickBone = useModelStore((s) => s.pickBone);
  const sceneRadius = useModelStore((s) => s.sceneRadius);
  const jointRadius = Math.max(sceneRadius * 0.016, 0.008);

  const selectedSet = useMemo(() => new Set(selectedBoneNames), [selectedBoneNames]);

  const bones: BoneInfo[] = useMemo(() => (model ? model.skeletonGroups.flatMap((g) => g.bones) : []), [model]);
  const byUuid = useMemo(() => new Map(bones.map((b) => [b.uuid, b])), [bones]);
  const boneLinks = useMemo(() => bones.filter((b) => b.parentUuid && byUuid.has(b.parentUuid)), [bones, byUuid]);

  const jointsRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const highlightsRef = useRef<THREE.InstancedMesh>(null);

  const lineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(boneLinks.length * 2 * 3);
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [boneLinks.length]);

  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const parentPos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!showSkeleton || bones.length === 0) return;

    if (jointsRef.current) {
      bones.forEach((info, i) => {
        info.bone.getWorldPosition(worldPos);
        dummy.position.copy(worldPos);
        dummy.scale.setScalar(selectedSet.has(info.name) ? 1.7 : 1);
        dummy.updateMatrix();
        jointsRef.current!.setMatrixAt(i, dummy.matrix);
      });
      jointsRef.current.instanceMatrix.needsUpdate = true;
    }

    if (linesRef.current) {
      const posAttr = linesRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      boneLinks.forEach((info, i) => {
        const parent = byUuid.get(info.parentUuid as string)!;
        info.bone.getWorldPosition(worldPos);
        parent.bone.getWorldPosition(parentPos);
        posAttr.setXYZ(i * 2, worldPos.x, worldPos.y, worldPos.z);
        posAttr.setXYZ(i * 2 + 1, parentPos.x, parentPos.y, parentPos.z);
      });
      posAttr.needsUpdate = true;
    }

    if (highlightsRef.current) {
      const selectedBones = bones.filter((b) => selectedSet.has(b.name));
      highlightsRef.current.count = selectedBones.length;
      highlightsRef.current.visible = selectedBones.length > 0;
      selectedBones.forEach((info, i) => {
        info.bone.getWorldPosition(worldPos);
        dummy.position.copy(worldPos);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        highlightsRef.current!.setMatrixAt(i, dummy.matrix);
      });
      highlightsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (!model || !showSkeleton || bones.length === 0) return null;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const info = bones[e.instanceId];
    if (!info) return;

    pickBoneFromClick(pickBone, info.name, selectedBoneNames, e.nativeEvent);
  };

  return (
    <group renderOrder={999}>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#facc15" depthTest={false} transparent opacity={0.85} />
      </lineSegments>
      <instancedMesh ref={jointsRef} args={[undefined, undefined, bones.length]} onClick={handleClick}>
        <sphereGeometry args={[jointRadius, 10, 10]} />
        <meshBasicMaterial color={JOINT_COLOR} depthTest={false} transparent opacity={0.95} />
      </instancedMesh>
      <instancedMesh ref={highlightsRef} args={[undefined, undefined, Math.max(bones.length, 1)]} frustumCulled={false}>
        <sphereGeometry args={[jointRadius * 1.5, 12, 12]} />
        <meshBasicMaterial color="#f97316" depthTest={false} />
      </instancedMesh>
    </group>
  );
}
