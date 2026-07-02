import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Mesh } from "three";
import type { MeshElementSelection } from "@/lib/mesh-edit/types";
import { parseEdgeKey } from "@/lib/mesh-edit/types";
import type { MeshTopology } from "@/lib/mesh-edit/topology";
import { getVertexWorldPosition } from "@/lib/mesh-edit/topology";

const VERTEX_COLOR = "#38bdf8";
const EDGE_COLOR = "#fbbf24";
const FACE_COLOR = "#34d399";

interface MeshEditOverlayProps {
  mesh: Mesh;
  topology: MeshTopology;
  selection: MeshElementSelection | null;
}

export function MeshEditOverlay({ mesh, topology, selection }: MeshEditOverlayProps) {
  const vertexGeometry = useMemo(() => {
    if (!selection?.vertices.length) return null;
    const positions: number[] = [];
    const world = new THREE.Vector3();
    for (const v of selection.vertices) {
      getVertexWorldPosition(mesh, v, world);
      positions.push(world.x, world.y, world.z);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, [mesh, selection?.vertices]);

  const edgeGeometry = useMemo(() => {
    if (!selection?.edges.length) return null;
    const positions: number[] = [];
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    for (const key of selection.edges) {
      const [v0, v1] = parseEdgeKey(key);
      getVertexWorldPosition(mesh, v0, a);
      getVertexWorldPosition(mesh, v1, b);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, [mesh, selection?.edges]);

  const faceGeometry = useMemo(() => {
    if (!selection?.faces.length) return null;
    const positions: number[] = [];
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    for (const faceIndex of selection.faces) {
      const face = topology.faces[faceIndex];
      if (!face) continue;
      getVertexWorldPosition(mesh, face[0], a);
      getVertexWorldPosition(mesh, face[1], b);
      getVertexWorldPosition(mesh, face[2], c);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, [mesh, selection?.faces, topology]);

  useEffect(() => {
    return () => {
      vertexGeometry?.dispose();
      edgeGeometry?.dispose();
      faceGeometry?.dispose();
    };
  }, [vertexGeometry, edgeGeometry, faceGeometry]);

  return (
    <group>
      {vertexGeometry && (
        <points geometry={vertexGeometry} raycast={() => null}>
          <pointsMaterial color={VERTEX_COLOR} size={10} sizeAttenuation depthTest={false} transparent opacity={0.95} />
        </points>
      )}
      {edgeGeometry && (
        <lineSegments geometry={edgeGeometry} raycast={() => null}>
          <lineBasicMaterial color={EDGE_COLOR} depthTest={false} transparent opacity={0.95} />
        </lineSegments>
      )}
      {faceGeometry && (
        <mesh geometry={faceGeometry} raycast={() => null}>
          <meshBasicMaterial color={FACE_COLOR} transparent opacity={0.35} side={THREE.DoubleSide} depthTest={false} />
        </mesh>
      )}
    </group>
  );
}
