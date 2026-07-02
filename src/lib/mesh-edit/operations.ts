import * as THREE from "three";
import { parseEdgeKey } from "@/lib/mesh-edit/types";
import {
  buildMeshTopology,
  ensureEditableGeometry,
  invalidateMeshTopology,
  worldToLocalPoint,
} from "@/lib/mesh-edit/topology";
import { findEdgeLoop } from "@/lib/mesh-edit/picking";

function compactVertices(geometry: THREE.BufferGeometry) {
  const index = geometry.getIndex();
  const position = geometry.getAttribute("position");
  if (!index || !position) return;

  const used = new Set<number>();
  for (let i = 0; i < index.count; i++) used.add(index.getX(i));

  const remap = new Map<number, number>();
  const newPositions: number[] = [];
  let next = 0;
  for (const old of [...used].sort((a, b) => a - b)) {
    remap.set(old, next++);
    newPositions.push(position.getX(old), position.getY(old), position.getZ(old));
  }

  const newIndices: number[] = [];
  for (let i = 0; i < index.count; i++) {
    newIndices.push(remap.get(index.getX(i))!);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
  geometry.setIndex(newIndices);
}

function rebuildNormals(geometry: THREE.BufferGeometry) {
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

function insertVertex(geometry: THREE.BufferGeometry, position: THREE.Vector3): number {
  const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const next = attr.count;
  const array = new Float32Array(attr.count * 3 + 3);
  array.set(attr.array as Float32Array);
  array[next * 3] = position.x;
  array[next * 3 + 1] = position.y;
  array[next * 3 + 2] = position.z;
  geometry.setAttribute("position", new THREE.BufferAttribute(array, 3));
  return next;
}

export function deleteMeshFaces(mesh: THREE.Mesh, faceIndices: number[]) {
  const geometry = ensureEditableGeometry(mesh);
  const index = geometry.getIndex()!;
  const remove = new Set(faceIndices);
  const newIndices: number[] = [];

  for (let f = 0; f < index.count / 3; f++) {
    if (remove.has(f)) continue;
    newIndices.push(index.getX(f * 3), index.getX(f * 3 + 1), index.getX(f * 3 + 2));
  }

  geometry.setIndex(newIndices);
  compactVertices(geometry);
  rebuildNormals(geometry);
  invalidateMeshTopology(mesh);
}

export function deleteMeshVertices(mesh: THREE.Mesh, vertexIndices: number[]) {
  const topology = buildMeshTopology(mesh);
  const removeVerts = new Set(vertexIndices);
  const facesToRemove: number[] = [];
  topology.faces.forEach((face, faceIndex) => {
    if (face.some((v) => removeVerts.has(v))) facesToRemove.push(faceIndex);
  });
  deleteMeshFaces(mesh, facesToRemove);
}

export function deleteMeshEdges(mesh: THREE.Mesh, edgeKeys: string[]) {
  const topology = buildMeshTopology(mesh);
  const facesToRemove = new Set<number>();
  for (const key of edgeKeys) {
    const faces = topology.edgeFaces.get(key) ?? [];
    faces.forEach((f) => facesToRemove.add(f));
  }
  deleteMeshFaces(mesh, [...facesToRemove]);
}

function splitFaceWithEdge(
  face: [number, number, number],
  v0: number,
  v1: number,
  mid: number
): [number, number, number][] {
  const [a, b, c] = face;
  if ((a === v0 && b === v1) || (a === v1 && b === v0)) return [
    [a, mid, c],
    [mid, b, c],
  ];
  if ((b === v0 && c === v1) || (b === v1 && c === v0)) return [
    [a, b, mid],
    [a, mid, c],
  ];
  if ((c === v0 && a === v1) || (c === v1 && a === v0)) return [
    [a, b, mid],
    [b, c, mid],
  ];
  return [face];
}

export function subdivideSingleEdge(mesh: THREE.Mesh, edgeKey: string) {
  const geometry = ensureEditableGeometry(mesh);
  const index = geometry.getIndex()!;
  const [v0, v1] = parseEdgeKey(edgeKey);
  const pos = geometry.getAttribute("position");
  const mid = new THREE.Vector3(pos.getX(v0), pos.getY(v0), pos.getZ(v0))
    .add(new THREE.Vector3(pos.getX(v1), pos.getY(v1), pos.getZ(v1)))
    .multiplyScalar(0.5);
  const midIndex = insertVertex(geometry, mid);

  const newIndices: number[] = [];
  for (let f = 0; f < index.count / 3; f++) {
    const face: [number, number, number] = [index.getX(f * 3), index.getX(f * 3 + 1), index.getX(f * 3 + 2)];
    const hasEdge =
      (face[0] === v0 && face[1] === v1) ||
      (face[1] === v0 && face[2] === v1) ||
      (face[2] === v0 && face[0] === v1) ||
      (face[0] === v1 && face[1] === v0) ||
      (face[1] === v1 && face[2] === v0) ||
      (face[2] === v1 && face[0] === v0);

    if (!hasEdge) {
      newIndices.push(...face);
      continue;
    }

    splitFaceWithEdge(face, v0, v1, midIndex).forEach((tri) => newIndices.push(...tri));
  }

  geometry.setIndex(newIndices);
  rebuildNormals(geometry);
  invalidateMeshTopology(mesh);
}

export function loopCutMesh(mesh: THREE.Mesh, seedEdge: string) {
  const topology = buildMeshTopology(mesh);
  const loop = findEdgeLoop(topology, seedEdge);
  for (const edge of loop) subdivideSingleEdge(mesh, edge);
}

function classifyVertex(point: THREE.Vector3, plane: THREE.Plane) {
  const dist = plane.distanceToPoint(point);
  if (dist > 1e-5) return 1;
  if (dist < -1e-5) return -1;
  return 0;
}

function interpolateVertex(a: THREE.Vector3, b: THREE.Vector3, plane: THREE.Plane) {
  const da = plane.distanceToPoint(a);
  const db = plane.distanceToPoint(b);
  const t = da / (da - db);
  return a.clone().lerp(b, t);
}

export function knifeCutMesh(mesh: THREE.Mesh, worldA: THREE.Vector3, worldB: THREE.Vector3, viewNormal: THREE.Vector3) {
  const geometry = ensureEditableGeometry(mesh);
  const topology = buildMeshTopology(mesh);
  const localA = worldToLocalPoint(mesh, worldA, new THREE.Vector3());
  const localB = worldToLocalPoint(mesh, worldB, new THREE.Vector3());
  const edgeDir = localB.clone().sub(localA).normalize();

  const invMatrix = mesh.matrixWorld.clone().invert();
  const localView = viewNormal.clone().transformDirection(invMatrix);
  const planeNormal = new THREE.Vector3().crossVectors(edgeDir, localView);
  if (planeNormal.lengthSq() < 1e-6) planeNormal.set(0, 1, 0);
  planeNormal.normalize();

  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, localA);
  const positions = geometry.getAttribute("position");
  const newPositions: number[] = Array.from(positions.array as Float32Array);
  const newIndices: number[] = [];
  const cutVertexCache = new Map<string, number>();

  const getCutVertex = (va: number, vb: number) => {
    const key = va < vb ? `${va}-${vb}` : `${vb}-${va}`;
    const cached = cutVertexCache.get(key);
    if (cached != null) return cached;
    const a = new THREE.Vector3(positions.getX(va), positions.getY(va), positions.getZ(va));
    const b = new THREE.Vector3(positions.getX(vb), positions.getY(vb), positions.getZ(vb));
    const cut = interpolateVertex(a, b, plane);
    const idx = newPositions.length / 3;
    newPositions.push(cut.x, cut.y, cut.z);
    cutVertexCache.set(key, idx);
    return idx;
  };

  for (let f = 0; f < topology.faceCount; f++) {
    const [ia, ib, ic] = topology.faces[f]!;
    const a = new THREE.Vector3(positions.getX(ia), positions.getY(ia), positions.getZ(ia));
    const b = new THREE.Vector3(positions.getX(ib), positions.getY(ib), positions.getZ(ib));
    const c = new THREE.Vector3(positions.getX(ic), positions.getY(ic), positions.getZ(ic));
    const cls = [classifyVertex(a, plane), classifyVertex(b, plane), classifyVertex(c, plane)];

    if (cls.every((v) => v >= 0)) {
      newIndices.push(ia, ib, ic);
      continue;
    }
    if (cls.every((v) => v <= 0)) continue;

    const verts = [ia, ib, ic];
    const above = verts.filter((_, i) => cls[i]! > 0);
    const below = verts.filter((_, i) => cls[i]! < 0);

    if (above.length === 2 && below.length === 1) {
      const [p0, p1] = above;
      const n0 = below[0]!;
      const c0 = getCutVertex(p0, n0);
      const c1 = getCutVertex(p1, n0);
      newIndices.push(p0, p1, c1, p0, c1, c0);
      continue;
    }
    if (above.length === 1 && below.length === 2) {
      const p0 = above[0]!;
      const [n0, n1] = below;
      const c0 = getCutVertex(p0, n0);
      const c1 = getCutVertex(p0, n1);
      newIndices.push(p0, c0, c1, c0, n0, n1, c0, n1, c1);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
  geometry.setIndex(newIndices);
  compactVertices(geometry);
  rebuildNormals(geometry);
  invalidateMeshTopology(mesh);
}

export function getEditMeshFromParts(meshParts: { id: string; mesh?: THREE.Mesh }[], selectedIds: string[]): THREE.Mesh | null {
  if (selectedIds.length === 0) return null;
  const lastId = selectedIds[selectedIds.length - 1]!;
  const part = meshParts.find((p) => p.id === lastId);
  return part?.mesh ?? null;
}
