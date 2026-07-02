export type MeshElementMode = "object" | "vertex" | "edge" | "face";
export type MeshEditTool = "select" | "knife" | "loopCut" | "delete";

export interface MeshElementSelection {
  meshUuid: string;
  vertices: number[];
  edges: string[];
  faces: number[];
}

export function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function parseEdgeKey(key: string): [number, number] {
  const [a, b] = key.split("-").map(Number);
  return [a!, b!];
}

export function emptyMeshElementSelection(meshUuid: string): MeshElementSelection {
  return { meshUuid, vertices: [], edges: [], faces: [] };
}
