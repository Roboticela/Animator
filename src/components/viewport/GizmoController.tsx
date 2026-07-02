import { useEffect, useRef } from "react";
import { TransformControls } from "@react-three/drei";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";
import { useFrame } from "@react-three/fiber";
import { useModelStore, getPrimaryBoneName } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import {
  applyPrimaryDelta,
  captureBoneSnapshot,
  updateBoneHierarchy,
  type BoneTransformSnapshot,
} from "@/lib/bone-transform";

export function GizmoController() {
  const boneMap = useModelStore((s) => s.boneMap);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);
  const sceneRadius = useModelStore((s) => s.sceneRadius);
  const mode = useAnimationStore((s) => s.transformMode);
  const pause = useAnimationStore((s) => s.pause);

  const primaryName = getPrimaryBoneName(selectedBoneNames);
  const primaryBone = primaryName ? boneMap.get(primaryName)?.bone : undefined;

  const controlsRef = useRef<TransformControlsImpl>(null);
  const dragSnapshots = useRef<Map<string, BoneTransformSnapshot>>(new Map());
  const isDragging = useRef(false);

  const selectedRef = useRef(selectedBoneNames);
  const boneMapRef = useRef(boneMap);
  const primaryRef = useRef(primaryName);

  useEffect(() => {
    selectedRef.current = selectedBoneNames;
  }, [selectedBoneNames]);

  useEffect(() => {
    boneMapRef.current = boneMap;
  }, [boneMap]);

  useEffect(() => {
    primaryRef.current = primaryName;
  }, [primaryName]);

  const captureSnapshots = () => {
    const snapshots = new Map<string, BoneTransformSnapshot>();
    for (const name of selectedRef.current) {
      const bone = boneMapRef.current.get(name)?.bone;
      if (!bone) continue;
      snapshots.set(name, captureBoneSnapshot(bone));
    }
    dragSnapshots.current = snapshots;
  };

  const syncSecondaryBones = () => {
    const names = selectedRef.current;
    const primary = primaryRef.current;
    if (!primary || names.length <= 1) return;

    const primaryBoneObj = boneMapRef.current.get(primary)?.bone;
    const primaryStart = dragSnapshots.current.get(primary);
    if (!primaryBoneObj || !primaryStart) return;

    const touched: import("three").Bone[] = [];
    for (const name of names) {
      if (name === primary) continue;
      const bone = boneMapRef.current.get(name)?.bone;
      const start = dragSnapshots.current.get(name);
      if (!bone || !start) continue;
      applyPrimaryDelta(primaryBoneObj, primaryStart, bone, start);
      touched.push(bone);
    }

    if (touched.length > 0) {
      touched.push(primaryBoneObj);
      updateBoneHierarchy(touched);
    }
  };

  useFrame(() => {
    if (isDragging.current) syncSecondaryBones();
  });

  const handleMouseDown = () => {
    isDragging.current = true;
    pause();
    captureSnapshots();
  };

  const handleMouseUp = () => {
    if (isDragging.current) syncSecondaryBones();
    isDragging.current = false;
    dragSnapshots.current.clear();
  };

  if (!primaryBone) return null;

  return (
    <TransformControls
      ref={controlsRef}
      object={primaryBone}
      mode={mode}
      size={Math.min(Math.max(sceneRadius * 0.5, 0.4), 1.2)}
      space="local"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onObjectChange={syncSecondaryBones}
    />
  );
}
