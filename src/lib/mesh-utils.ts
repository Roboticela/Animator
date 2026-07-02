import * as THREE from "three";
import type { MeshPartInfo } from "@/types/model";

type GeometryGroup = { start: number; count: number; materialIndex?: number };

function meshStats(mesh: THREE.Mesh, group?: GeometryGroup) {
  const geom = mesh.geometry;
  let vertexCount = 0;
  let triangleCount = 0;
  if (geom) {
    const posAttr = geom.getAttribute("position");
    if (group) {
      triangleCount = group.count / 3;
      vertexCount = Math.round(triangleCount * 3);
    } else if (posAttr) {
      vertexCount = posAttr.count;
      triangleCount = geom.index ? geom.index.count / 3 : vertexCount / 3;
    }
  }
  return { vertexCount, triangleCount: Math.round(triangleCount) };
}

function materialLabel(mesh: THREE.Mesh, materialIndex: number): string | null {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const material = materials[materialIndex];
  if (!material?.name) return null;
  return material.name;
}

function addMeshNodes(mesh: THREE.Mesh, depth: number, parentId: string | null, nodes: MeshPartInfo[]) {
  const geom = mesh.geometry;
  const groups = geom?.groups?.filter((g) => g.count > 0) ?? [];
  const isSkinned = (mesh as THREE.SkinnedMesh).isSkinnedMesh;
  const baseName = mesh.name || `Mesh_${nodes.length + 1}`;

  if (groups.length > 1) {
    const folderId = `${mesh.uuid}__parts`;
    const totalTris = groups.reduce((sum, g) => sum + g.count / 3, 0);
    nodes.push({
      id: folderId,
      uuid: mesh.uuid,
      name: baseName,
      depth,
      parentId,
      parentUuid: parentId,
      kind: "group",
      mesh,
      isSkinned,
      vertexCount: 0,
      triangleCount: Math.round(totalTris),
    });

    groups.forEach((group, index) => {
      const stats = meshStats(mesh, group);
      nodes.push({
        id: `${mesh.uuid}:g${index}`,
        uuid: mesh.uuid,
        name: materialLabel(mesh, group.materialIndex ?? 0) ?? `${baseName} · ${index + 1}`,
        depth: depth + 1,
        parentId: folderId,
        parentUuid: folderId,
        kind: "primitive",
        mesh,
        geometryGroupIndex: index,
        isSkinned,
        vertexCount: stats.vertexCount,
        triangleCount: stats.triangleCount,
      });
    });
    return;
  }

  const stats = meshStats(mesh, groups[0]);
  nodes.push({
    id: mesh.uuid,
    uuid: mesh.uuid,
    name: baseName,
    depth,
    parentId,
    parentUuid: parentId,
    kind: "mesh",
    mesh,
    geometryGroupIndex: groups[0] ? 0 : undefined,
    isSkinned,
    vertexCount: stats.vertexCount,
    triangleCount: stats.triangleCount,
  });
}

/** Full scene hierarchy for the parts explorer — groups, meshes, and geometry primitives. */
export function collectMeshParts(root: THREE.Object3D): MeshPartInfo[] {
  const nodes: MeshPartInfo[] = [];

  const hasMeshDescendant = (obj: THREE.Object3D): boolean => {
    let found = false;
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) found = true;
    });
    return found;
  };

  const visit = (obj: THREE.Object3D, depth: number, parentId: string | null) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      addMeshNodes(mesh, depth, parentId, nodes);
      mesh.children.forEach((child) => visit(child, depth + 1, mesh.uuid));
      return;
    }

    if (!hasMeshDescendant(obj)) {
      obj.children.forEach((child) => visit(child, depth, parentId));
      return;
    }

    // Skip redundant wrappers that contain a single mesh — show the mesh directly.
    if (obj.children.length === 1) {
      const only = obj.children[0]!;
      if ((only as THREE.Mesh).isMesh) {
        visit(only, depth, parentId);
        return;
      }
    }

    const isBone = (obj as THREE.Bone).isBone;
    let folderId = parentId;
    let childDepth = depth;

    if (obj.children.length > 0) {
      folderId = obj.uuid;
      nodes.push({
        id: obj.uuid,
        uuid: obj.uuid,
        name: obj.name || (isBone ? "Bone" : `Group_${nodes.length + 1}`),
        depth,
        parentId,
        parentUuid: parentId,
        kind: "group",
        isSkinned: false,
        vertexCount: 0,
        triangleCount: 0,
      });
      childDepth = depth + 1;
    }

    obj.children.forEach((child) => visit(child, childDepth, folderId));
  };

  root.children.forEach((child) => visit(child, 0, null));
  return pruneEmptyGroups(nodes);
}

/** Remove folder nodes that ended up with no children (e.g. bone chains without geometry). */
function pruneEmptyGroups(nodes: MeshPartInfo[]): MeshPartInfo[] {
  const childCount = new Map<string, number>();
  for (const node of nodes) {
    if (node.parentId) childCount.set(node.parentId, (childCount.get(node.parentId) ?? 0) + 1);
  }

  const removed = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (node.kind !== "group" || removed.has(node.id)) continue;
      if ((childCount.get(node.id) ?? 0) > 0) continue;
      removed.add(node.id);
      changed = true;
      if (node.parentId) {
        const next = (childCount.get(node.parentId) ?? 1) - 1;
        if (next <= 0) childCount.delete(node.parentId);
        else childCount.set(node.parentId, next);
      }
    }
  }

  if (removed.size === 0) return nodes;

  const reparent = new Map<string, string | null>();
  for (const node of nodes) {
    if (!removed.has(node.id)) continue;
    reparent.set(node.id, node.parentId);
  }

  const resolveParent = (parentId: string | null): string | null => {
    let cur = parentId;
    while (cur && removed.has(cur)) cur = reparent.get(cur) ?? null;
    return cur;
  };

  return nodes
    .filter((node) => !removed.has(node.id))
    .map((node) => {
      const nextParent = resolveParent(node.parentId);
      if (nextParent === node.parentId) return node;
      return { ...node, parentId: nextParent, parentUuid: nextParent };
    });
}

export function isSelectableMeshPart(part: MeshPartInfo): boolean {
  return part.kind === "mesh" || part.kind === "primitive";
}

export function getOrderedMeshUuids(parts: MeshPartInfo[]): string[] {
  return parts.filter(isSelectableMeshPart).map((p) => p.id);
}

export function geometryGroupAtFace(geometry: THREE.BufferGeometry, faceIndex: number): number {
  const groups = geometry.groups?.filter((g) => g.count > 0) ?? [];
  if (groups.length <= 1) return 0;

  const indexAttr = geometry.index;
  const indexOffset = faceIndex * 3;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (indexAttr) {
      if (indexOffset >= group.start && indexOffset < group.start + group.count) return i;
      continue;
    }
    if (indexOffset >= group.start && indexOffset < group.start + group.count) return i;
  }

  return 0;
}

/** Walk up from a raycast hit to a registered mesh part (mesh or geometry primitive). */
export function findMeshPartFromHit(
  object: THREE.Object3D,
  faceIndex: number | undefined,
  selectableById: Map<string, MeshPartInfo>
): MeshPartInfo | null {
  let cur: THREE.Object3D | null = object;
  while (cur) {
    const mesh = cur as THREE.Mesh;
    if (!mesh.isMesh) {
      cur = cur.parent;
      continue;
    }

    if (mesh.userData._partHidden === true || !mesh.visible) return null;

    if (faceIndex != null && mesh.geometry) {
      const groupIndex = geometryGroupAtFace(mesh.geometry, faceIndex);
      const primitiveId = `${mesh.uuid}:g${groupIndex}`;
      const primitive = selectableById.get(primitiveId);
      if (primitive) return primitive;
    }

    const whole = selectableById.get(mesh.uuid);
    if (whole) return whole;

    cur = cur.parent;
  }
  return null;
}
