import fs from "node:fs";
import type { Plugin } from "vite";

const PATCH_MARKER = "/* animator-3dsmax-fbx-patch */";

const MAX_TEXTURE_CASES = `
        case "3dsMax|Parameters|base_color_map":
          parameters.map = scope.getTexture(textureMap, child.ID);
          if (parameters.map !== void 0) {
            if ("colorSpace" in parameters.map)
              parameters.map.colorSpace = "srgb";
            else
              parameters.map.encoding = 3001;
          }
          break;
        case "3dsMax|Parameters|cutout_map":
        case "3dsMax|Parameters|opacity_map":
          parameters.alphaMap = scope.getTexture(textureMap, child.ID);
          parameters.transparent = true;
          break;
        case "3dsMax|Parameters|refl_color_map":
          parameters.specularMap = scope.getTexture(textureMap, child.ID);
          if (parameters.specularMap !== void 0) {
            if ("colorSpace" in parameters.specularMap)
              parameters.specularMap.colorSpace = "srgb";
            else
              parameters.specularMap.encoding = 3001;
          }
          break;
        case "3dsMax|Parameters|normal_map":
          parameters.normalMap = scope.getTexture(textureMap, child.ID);
          break;
        case "3dsMax|Parameters|bump_map":
          parameters.bumpMap = scope.getTexture(textureMap, child.ID);
          break;
        case "3dsMax|Parameters|emissive_map":
          parameters.emissiveMap = scope.getTexture(textureMap, child.ID);
          if (parameters.emissiveMap !== void 0) {
            if ("colorSpace" in parameters.emissiveMap)
              parameters.emissiveMap.colorSpace = "srgb";
            else
              parameters.emissiveMap.encoding = 3001;
          }
          break;`;

function isFbxLoaderModule(id: string): boolean {
  return id.replace(/\\/g, "/").includes("three-stdlib/loaders/FBXLoader");
}

/** Patch three-stdlib FBXLoader for 3ds Max Physical Material slots. */
export function patchFbxLoaderSource(code: string): string | null {
  if (code.includes(PATCH_MARKER) || code.includes('case "3dsMax|Parameters|base_color_map":')) {
    return null;
  }

  let patched = code;

  if (!patched.includes('case "3dsMax|Parameters|base_color_map":')) {
    const next = patched.replace(
      '        case "AmbientColor":',
      `${MAX_TEXTURE_CASES}
        case "AmbientColor":`
    );
    if (next === patched) return null;
    patched = next;
  }

  patched = patched.replace(
    `      default:
        console.warn('THREE.FBXLoader: unknown material type "%s". Defaulting to MeshPhongMaterial.', type);
        material = new MeshPhongMaterial();
        break;`,
    `      case "unknown":
        material = new MeshPhongMaterial();
        break;
      default:
        console.warn('THREE.FBXLoader: unknown material type "%s". Defaulting to MeshPhongMaterial.', type);
        material = new MeshPhongMaterial();
        break;`
  );

  return `${PATCH_MARKER}\n${patched}`;
}

const esbuildFbxPatchPlugin = {
  name: "animator-fbx-loader-patch-esbuild",
  setup(build: { onLoad: (options: { filter: RegExp }, callback: (args: { path: string }) => { contents: string; loader: "js" } | null) => void }) {
    build.onLoad({ filter: /three-stdlib[/\\]loaders[/\\]FBXLoader\.js$/ }, (args) => {
      const code = fs.readFileSync(args.path, "utf8");
      const patched = patchFbxLoaderSource(code);
      if (!patched) return null;
      return { contents: patched, loader: "js" as const };
    });
  },
};

/** Teach three-stdlib FBXLoader about 3ds Max Physical Material texture slots. */
export function fbxLoaderPatchPlugin(): Plugin {
  return {
    name: "animator-fbx-loader-patch",
    enforce: "pre",
    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [esbuildFbxPatchPlugin],
          },
        },
      };
    },
    transform(code, id) {
      if (!isFbxLoaderModule(id)) return;
      const patched = patchFbxLoaderSource(code);
      if (!patched) return;
      return patched;
    },
  };
}
