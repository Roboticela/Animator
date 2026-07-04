import { useEffect, useMemo, useRef } from "react";
import { TransformControls } from "@react-three/drei";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { useModelStore, getPrimaryBoneName, getPrimaryMeshPartId, getPrimaryReferenceId } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import {
  applyPrimaryDelta,
  captureBoneSnapshot,
  updateBoneHierarchy,
  type BoneTransformSnapshot,
} from "@/lib/bone-transform";
import {
  applyPrimaryObjectDelta,
  captureObjectSnapshot,
  updateObjectHierarchy,
  type ObjectTransformSnapshot,
} from "@/lib/object-transform";
import { isSelectableMeshPart } from "@/lib/mesh-utils";

export function GizmoController() {
  const boneMap = useModelStore((s) => s.boneMap);
  const meshParts = useModelStore((s) => s.meshParts);
  const references = useModelStore((s) => s.references);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);
  const selectedMeshUuids = useModelStore((s) => s.selectedMeshUuids);
  const selectedReferenceIds = useModelStore((s) => s.selectedReferenceIds);
  const sceneRadius = useModelStore((s) => s.sceneRadius);
  const viewportSelectionTarget = useModelStore((s) => s.viewportSelectionTarget);
  const meshElementMode = useModelStore((s) => s.meshElementMode);
  const mode = useAnimationStore((s) => s.transformMode);
  const gizmoSpace = useAnimationStore((s) => s.gizmoSpace);
  const pause = useAnimationStore((s) => s.pause);

  const pickingBones = viewportSelectionTarget === "bones";
  const pickingParts = viewportSelectionTarget === "parts" && meshElementMode === "object";
  const pickingReferences = viewportSelectionTarget === "references";

  const primaryName = getPrimaryBoneName(selectedBoneNames);
  const primaryBone = primaryName ? boneMap.get(primaryName)?.bone : undefined;

  const selectedMeshes = useMemo(() => {
    const meshes = new Map<string, Mesh>();
    for (const id of selectedMeshUuids) {
      const part = meshParts.find((p) => p.id === id && isSelectableMeshPart(p));
      if (part?.mesh) meshes.set(part.mesh.uuid, part.mesh);
    }
    return [...meshes.values()];
  }, [meshParts, selectedMeshUuids]);

  const primaryPartId = getPrimaryMeshPartId(selectedMeshUuids);
  const primaryMesh = useMemo(() => {
    if (!primaryPartId) return undefined;
    return meshParts.find((p) => p.id === primaryPartId && p.mesh)?.mesh;
  }, [meshParts, primaryPartId]);

  const primaryRefId = getPrimaryReferenceId(selectedReferenceIds);
  const primaryReference = useMemo(() => {
    if (!primaryRefId) return undefined;
    return references.find((ref) => ref.id === primaryRefId)?.root;
  }, [references, primaryRefId]);

  const selectedReferenceRoots = useMemo(() => {
    const roots = new Map<string, import("three").Object3D>();
    for (const id of selectedReferenceIds) {
      const ref = references.find((r) => r.id === id);
      if (ref) roots.set(ref.id, ref.root);
    }
    return [...roots.values()];
  }, [references, selectedReferenceIds]);

  const gizmoObject = pickingBones
    ? primaryBone
    : pickingParts
      ? primaryMesh
      : pickingReferences
        ? primaryReference
        : undefined;

  const controlsRef = useRef<TransformControlsImpl>(null);
  const boneSnapshots = useRef<Map<string, BoneTransformSnapshot>>(new Map());
  const meshSnapshots = useRef<Map<string, ObjectTransformSnapshot>>(new Map());
  const isDragging = useRef(false);

  const selectedBonesRef = useRef(selectedBoneNames);
  const boneMapRef = useRef(boneMap);
  const primaryBoneRef = useRef(primaryName);
  const selectedMeshesRef = useRef(selectedMeshes);
  const primaryMeshRef = useRef(primaryMesh);
  const selectedReferenceRootsRef = useRef(selectedReferenceRoots);
  const primaryReferenceRef = useRef(primaryReference);

  useEffect(() => {
    selectedBonesRef.current = selectedBoneNames;
  }, [selectedBoneNames]);
  useEffect(() => {
    boneMapRef.current = boneMap;
  }, [boneMap]);
  useEffect(() => {
    primaryBoneRef.current = primaryName;
  }, [primaryName]);
  useEffect(() => {
    selectedMeshesRef.current = selectedMeshes;
  }, [selectedMeshes]);
  useEffect(() => {
    primaryMeshRef.current = primaryMesh;
  }, [primaryMesh]);
  useEffect(() => {
    selectedReferenceRootsRef.current = selectedReferenceRoots;
  }, [selectedReferenceRoots]);
  useEffect(() => {
    primaryReferenceRef.current = primaryReference;
  }, [primaryReference]);

  const captureSnapshots = () => {
    if (pickingBones) {
      const snapshots = new Map<string, BoneTransformSnapshot>();
      for (const name of selectedBonesRef.current) {
        const bone = boneMapRef.current.get(name)?.bone;
        if (!bone) continue;
        snapshots.set(name, captureBoneSnapshot(bone));
      }
      boneSnapshots.current = snapshots;
      return;
    }

    if (pickingReferences) {
      const snapshots = new Map<string, ObjectTransformSnapshot>();
      for (const root of selectedReferenceRootsRef.current) {
        snapshots.set(root.uuid, captureObjectSnapshot(root));
      }
      meshSnapshots.current = snapshots;
      return;
    }

    const snapshots = new Map<string, ObjectTransformSnapshot>();
    for (const mesh of selectedMeshesRef.current) {
      snapshots.set(mesh.uuid, captureObjectSnapshot(mesh));
    }
    meshSnapshots.current = snapshots;
  };

  const syncSecondary = () => {
    if (pickingBones) {
      const names = selectedBonesRef.current;
      const primary = primaryBoneRef.current;
      if (!primary || names.length <= 1) return;

      const primaryBoneObj = boneMapRef.current.get(primary)?.bone;
      const primaryStart = boneSnapshots.current.get(primary);
      if (!primaryBoneObj || !primaryStart) return;

      const touched: import("three").Bone[] = [];
      for (const name of names) {
        if (name === primary) continue;
        const bone = boneMapRef.current.get(name)?.bone;
        const start = boneSnapshots.current.get(name);
        if (!bone || !start) continue;
        applyPrimaryDelta(primaryBoneObj, primaryStart, bone, start);
        touched.push(bone);
      }

      if (touched.length > 0) {
        touched.push(primaryBoneObj);
        updateBoneHierarchy(touched);
      }
      return;
    }

    if (pickingReferences) {
      const primary = primaryReferenceRef.current;
      if (!primary || selectedReferenceRootsRef.current.length <= 1) return;
      const primaryStart = meshSnapshots.current.get(primary.uuid);
      if (!primaryStart) return;

      const touched: import("three").Object3D[] = [];
      for (const root of selectedReferenceRootsRef.current) {
        if (root.uuid === primary.uuid) continue;
        const start = meshSnapshots.current.get(root.uuid);
        if (!start) continue;
        applyPrimaryObjectDelta(primary, primaryStart, root, start);
        touched.push(root);
      }
      if (touched.length > 0) {
        touched.push(primary);
        updateObjectHierarchy(touched);
      }
      return;
    }

    const primary = primaryMeshRef.current;
    if (!primary || selectedMeshesRef.current.length <= 1) return;
    const primaryStart = meshSnapshots.current.get(primary.uuid);
    if (!primaryStart) return;

    const touched: Mesh[] = [];
    for (const mesh of selectedMeshesRef.current) {
      if (mesh.uuid === primary.uuid) continue;
      const start = meshSnapshots.current.get(mesh.uuid);
      if (!start) continue;
      applyPrimaryObjectDelta(primary, primaryStart, mesh, start);
      touched.push(mesh);
    }
    if (touched.length > 0) {
      touched.push(primary);
      updateObjectHierarchy(touched);
    }
  };

  useFrame(() => {
    if (isDragging.current) syncSecondary();
  });

  const handleMouseDown = () => {
    isDragging.current = true;
    if (pickingBones) pause();
    captureSnapshots();
  };

  const handleMouseUp = () => {
    if (isDragging.current) syncSecondary();
    isDragging.current = false;
    boneSnapshots.current.clear();
    meshSnapshots.current.clear();
  };

  const handleObjectChange = () => {
    if (!isDragging.current) return;
    syncSecondary();
  };

  if (!gizmoObject) return null;

  return (
    <TransformControls
      key={
        pickingBones
          ? `bone-${primaryName}`
          : pickingReferences
            ? `ref-${primaryRefId ?? "none"}`
            : `mesh-${primaryMesh?.uuid ?? "none"}`
      }
      ref={controlsRef}
      object={gizmoObject}
      mode={mode}
      size={Math.min(Math.max(sceneRadius * 0.5, 0.4), 1.2)}
      space={gizmoSpace}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onObjectChange={handleObjectChange}
    />
  );
}
