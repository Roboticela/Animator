import * as THREE from "three";
import type { MeshElementMode } from "@/lib/mesh-edit/types";
import { edgeKey, parseEdgeKey } from "@/lib/mesh-edit/types";
import {
  getEdgeWorldMidpoint,
  getFaceWorldCentroid,
  getVertexWorldPosition,
  type MeshTopology,
} from "@/lib/mesh-edit/topology";

const _v0 = new THREE.Vector3();
const _v1 = new THREE.Vector3();
const _closest = new THREE.Vector3();

function distancePointToSegment(point: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) {
  _closest.copy(b).sub(a);
  const lenSq = _closest.lengthSq();
  if (lenSq === 0) return point.distanceTo(a);
  const dir = _closest.clone();
  let t = point.clone().sub(a).dot(dir) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return point.distanceTo(a.clone().addScaledVector(dir, t));
}

export interface MeshPickHit {
  vertex?: number;
  edge?: string;
  face?: number;
  point: THREE.Vector3;
}

export function pickMeshElementAtPoint(
  mesh: THREE.Mesh,
  point: THREE.Vector3,
  mode: MeshElementMode,
  topology: MeshTopology,
  threshold: number,
  faceIndex?: number
): MeshPickHit | null {
  if (mode === "face") {
    if (faceIndex == null || faceIndex < 0) return null;
    return { face: faceIndex, point: point.clone() };
  }

  if (mode === "vertex") {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < topology.vertexCount; i++) {
      const world = getVertexWorldPosition(mesh, i, _v0);
      const dist = world.distanceTo(point);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    if (best < 0 || bestDist > threshold) return null;
    return { vertex: best, point: point.clone() };
  }

  if (mode === "edge") {
    let bestKey: string | null = null;
    let bestDist = Infinity;
    topology.edgeFaces.forEach((_faces, key) => {
      const [a, b] = parseEdgeKey(key);
      getVertexWorldPosition(mesh, a, _v0);
      getVertexWorldPosition(mesh, b, _v1);
      const dist = distancePointToSegment(point, _v0, _v1);
      if (dist < bestDist) {
        bestDist = dist;
        bestKey = key;
      }
    });
    if (!bestKey || bestDist > threshold) return null;
    return { edge: bestKey, point: point.clone() };
  }

  return { point: point.clone() };
}

export function pickMeshElement(
  mesh: THREE.Mesh,
  raycaster: THREE.Raycaster,
  mode: MeshElementMode,
  topology: MeshTopology,
  threshold: number
): MeshPickHit | null {
  const hits = raycaster.intersectObject(mesh, false);
  if (hits.length === 0) return null;
  const hit = hits[0]!;
  return pickMeshElementAtPoint(mesh, hit.point, mode, topology, threshold, hit.faceIndex ?? undefined);
}

export function pickMeshSurfacePoint(mesh: THREE.Mesh, raycaster: THREE.Raycaster): THREE.Vector3 | null {
  const hits = raycaster.intersectObject(mesh, false);
  return hits[0]?.point.clone() ?? null;
}

export function findEdgeLoop(topology: MeshTopology, seedEdge: string): string[] {
  const [v0, v1] = parseEdgeKey(seedEdge);
  const seedFaces = topology.edgeFaces.get(seedEdge) ?? [];
  if (seedFaces.length === 0) return [seedEdge];

  const loop = new Set<string>([seedEdge]);
  const visitedFaces = new Set<number>();

  const walk = (faceIndex: number, fromVertex: number, toVertex: number) => {
    if (visitedFaces.has(faceIndex)) return;
    visitedFaces.add(faceIndex);
    const face = topology.faces[faceIndex];
    if (!face) return;

    const idx = face.indexOf(fromVertex);
    if (idx < 0) return;
    const opposite = face[(idx + 2) % 3]!;
    const nextEdge = edgeKey(toVertex, opposite);
    if (!topology.edgeFaces.has(nextEdge)) return;
    if (loop.has(nextEdge)) return;
    loop.add(nextEdge);

    const adjFaces = topology.edgeFaces.get(nextEdge) ?? [];
    for (const adj of adjFaces) {
      if (adj === faceIndex) continue;
      const [na, nb] = parseEdgeKey(nextEdge);
      walk(adj, na, nb);
      walk(adj, nb, na);
    }
  };

  for (const faceIndex of seedFaces) {
    walk(faceIndex, v0, v1);
    walk(faceIndex, v1, v0);
  }

  return [...loop];
}

export function getSelectionWorldPoints(
  mesh: THREE.Mesh,
  topology: MeshTopology,
  vertices: number[],
  edges: string[],
  faces: number[]
) {
  const points: THREE.Vector3[] = [];
  vertices.forEach((v) => points.push(getVertexWorldPosition(mesh, v, new THREE.Vector3())));
  edges.forEach((key) => points.push(getEdgeWorldMidpoint(mesh, parseEdgeKey(key), new THREE.Vector3())));
  faces.forEach((f) => points.push(getFaceWorldCentroid(mesh, f, topology)));
  return points;
}
