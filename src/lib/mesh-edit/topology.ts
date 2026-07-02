import * as THREE from "three";
import { edgeKey } from "@/lib/mesh-edit/types";

export interface MeshTopology {
  meshUuid: string;
  faceCount: number;
  vertexCount: number;
  /** Triangle face -> [v0, v1, v2] local indices */
  faces: Array<[number, number, number]>;
  /** edge key -> adjacent face indices */
  edgeFaces: Map<string, number[]>;
}

const topologyCache = new WeakMap<THREE.BufferGeometry, MeshTopology>();

export function ensureEditableGeometry(mesh: THREE.Mesh): THREE.BufferGeometry {
  let geometry = mesh.geometry;
  if (!(geometry instanceof THREE.BufferGeometry)) {
    throw new Error("Only BufferGeometry meshes can be edited");
  }
  if (!geometry.getIndex()) {
    const nonIndexed = geometry.toNonIndexed();
    geometry.dispose();
    mesh.geometry = nonIndexed;
    geometry = nonIndexed;
  }
  invalidateMeshTopology(mesh);
  return geometry;
}

/** Read topology without mutating mesh geometry (safe during React render). */
export function readMeshTopology(mesh: THREE.Mesh): MeshTopology | null {
  const geometry = mesh.geometry;
  if (!(geometry instanceof THREE.BufferGeometry)) return null;

  const position = geometry.getAttribute("position");
  if (!position) return null;

  const cached = topologyCache.get(geometry);
  if (cached && cached.meshUuid === mesh.uuid) return cached;

  const index = geometry.getIndex();
  const faces: Array<[number, number, number]> = [];
  const edgeFaces = new Map<string, number[]>();

  if (index) {
    for (let f = 0; f < index.count / 3; f++) {
      const v0 = index.getX(f * 3);
      const v1 = index.getX(f * 3 + 1);
      const v2 = index.getX(f * 3 + 2);
      faces.push([v0, v1, v2]);
      for (const key of [edgeKey(v0, v1), edgeKey(v1, v2), edgeKey(v2, v0)]) {
        const list = edgeFaces.get(key) ?? [];
        list.push(f);
        edgeFaces.set(key, list);
      }
    }
  } else {
    for (let f = 0; f < position.count / 3; f++) {
      const v0 = f * 3;
      const v1 = f * 3 + 1;
      const v2 = f * 3 + 2;
      faces.push([v0, v1, v2]);
      for (const key of [edgeKey(v0, v1), edgeKey(v1, v2), edgeKey(v2, v0)]) {
        const list = edgeFaces.get(key) ?? [];
        list.push(f);
        edgeFaces.set(key, list);
      }
    }
  }

  const topology: MeshTopology = {
    meshUuid: mesh.uuid,
    faceCount: faces.length,
    vertexCount: position.count,
    faces,
    edgeFaces,
  };
  topologyCache.set(geometry, topology);
  return topology;
}

export function buildMeshTopology(mesh: THREE.Mesh): MeshTopology {
  const geometry = ensureEditableGeometry(mesh);
  const cached = topologyCache.get(geometry);
  if (cached && cached.meshUuid === mesh.uuid) return cached;

  const index = geometry.getIndex()!;
  const faces: Array<[number, number, number]> = [];
  const edgeFaces = new Map<string, number[]>();

  for (let f = 0; f < index.count / 3; f++) {
    const v0 = index.getX(f * 3);
    const v1 = index.getX(f * 3 + 1);
    const v2 = index.getX(f * 3 + 2);
    faces.push([v0, v1, v2]);
    for (const key of [edgeKey(v0, v1), edgeKey(v1, v2), edgeKey(v2, v0)]) {
      const list = edgeFaces.get(key) ?? [];
      list.push(f);
      edgeFaces.set(key, list);
    }
  }

  const position = geometry.getAttribute("position");
  const topology: MeshTopology = {
    meshUuid: mesh.uuid,
    faceCount: faces.length,
    vertexCount: position?.count ?? 0,
    faces,
    edgeFaces,
  };
  topologyCache.set(geometry, topology);
  return topology;
}

export function invalidateMeshTopology(mesh: THREE.Mesh) {
  topologyCache.delete(mesh.geometry as THREE.BufferGeometry);
}

export function getVertexWorldPosition(mesh: THREE.Mesh, vertexIndex: number, target = new THREE.Vector3()) {
  const pos = mesh.geometry.getAttribute("position");
  target.fromBufferAttribute(pos, vertexIndex);
  return mesh.localToWorld(target);
}

export function getVertexLocalPosition(mesh: THREE.Mesh, vertexIndex: number, target = new THREE.Vector3()) {
  const pos = mesh.geometry.getAttribute("position");
  return target.fromBufferAttribute(pos, vertexIndex);
}

export function getFaceWorldCentroid(mesh: THREE.Mesh, faceIndex: number, topology: MeshTopology) {
  const [a, b, c] = topology.faces[faceIndex]!;
  const local = new THREE.Vector3();
  const centroid = new THREE.Vector3();
  getVertexLocalPosition(mesh, a, local);
  centroid.copy(local);
  getVertexLocalPosition(mesh, b, local);
  centroid.add(local);
  getVertexLocalPosition(mesh, c, local);
  centroid.add(local);
  centroid.multiplyScalar(1 / 3);
  return mesh.localToWorld(centroid);
}

export function getEdgeWorldMidpoint(mesh: THREE.Mesh, edge: [number, number], target = new THREE.Vector3()) {
  const a = getVertexWorldPosition(mesh, edge[0], new THREE.Vector3());
  const b = getVertexWorldPosition(mesh, edge[1], new THREE.Vector3());
  return target.copy(a).add(b).multiplyScalar(0.5);
}

export function worldToLocalPoint(mesh: THREE.Mesh, world: THREE.Vector3, target = new THREE.Vector3()) {
  return mesh.worldToLocal(target.copy(world));
}
