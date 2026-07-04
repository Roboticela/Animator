export type ExportFormatId = "glb" | "gltf" | "fbx" | "obj" | "stl" | "ply" | "usdz" | "dae";

export interface ExportFormatInfo {
  id: ExportFormatId;
  label: string;
  extension: string;
  description: string;
  supportsTextures: boolean;
  supportsAnimations: boolean;
}

export const EXPORT_FORMATS: ExportFormatInfo[] = [
  {
    id: "glb",
    label: "GLB",
    extension: "glb",
    description: "Binary glTF — recommended for games, web, and Blender",
    supportsTextures: true,
    supportsAnimations: true,
  },
  {
    id: "gltf",
    label: "glTF",
    extension: "gltf",
    description: "JSON glTF with embedded buffer and texture data",
    supportsTextures: true,
    supportsAnimations: true,
  },
  {
    id: "fbx",
    label: "FBX",
    extension: "fbx",
    description: "Autodesk FBX for Maya, 3ds Max, Unity, and Unreal",
    supportsTextures: true,
    supportsAnimations: true,
  },
  {
    id: "obj",
    label: "OBJ",
    extension: "obj",
    description: "Wavefront OBJ + MTL (textures packaged in a .zip)",
    supportsTextures: true,
    supportsAnimations: false,
  },
  {
    id: "dae",
    label: "Collada (DAE)",
    extension: "dae",
    description: "XML Collada — textures packaged in a .zip when included",
    supportsTextures: true,
    supportsAnimations: true,
  },
  {
    id: "usdz",
    label: "USDZ",
    extension: "usdz",
    description: "Apple AR Quick Look (MeshStandard materials only)",
    supportsTextures: true,
    supportsAnimations: false,
  },
  {
    id: "stl",
    label: "STL",
    extension: "stl",
    description: "Triangle mesh for 3D printing — no materials or textures",
    supportsTextures: false,
    supportsAnimations: false,
  },
  {
    id: "ply",
    label: "PLY",
    extension: "ply",
    description: "Stanford PLY mesh — vertex colors only, no texture maps",
    supportsTextures: false,
    supportsAnimations: false,
  },
];

export function getExportFormat(id: ExportFormatId): ExportFormatInfo {
  return EXPORT_FORMATS.find((f) => f.id === id) ?? EXPORT_FORMATS[0]!;
}
