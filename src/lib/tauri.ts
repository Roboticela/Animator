/**
 * Runtime helpers that let the same import/export code paths work both in a
 * plain browser tab and inside the Tauri desktop shell. Detection mirrors the
 * approach used in RefDesign/components/AppHeader.tsx's `openLink` helper.
 */

export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return (
    "__TAURI_INTERNALS__" in w ||
    "__TAURI_METADATA__" in w ||
    w.__TAURI__ !== undefined
  );
}

export interface OpenedFile {
  name: string;
  data: ArrayBuffer;
}

const MODEL_EXTENSIONS = ["glb", "gltf", "fbx", "obj"];
const PROJECT_EXTENSIONS = ["rcanim"];
const OPEN_EXTENSIONS = [...MODEL_EXTENSIONS, ...PROJECT_EXTENSIONS];

/**
 * Opens a native "Open File" dialog on desktop and reads the chosen file's
 * bytes via the fs plugin. Returns null if the user cancels or this isn't
 * running under Tauri (callers should fall back to an `<input type="file">`
 * in that case).
 */
/** Opens models (.glb, .gltf, .fbx, .obj) and projects (.rcanim). */
export async function openAnyFileNative(): Promise<OpenedFile | null> {
  if (!isTauri()) return null;

  const { open } = await import("@tauri-apps/plugin-dialog");
  const { readFile } = await import("@tauri-apps/plugin-fs");

  const selected = await open({
    multiple: false,
    filters: [
      { name: "Animator files", extensions: OPEN_EXTENSIONS },
      { name: "3D Models", extensions: MODEL_EXTENSIONS },
      { name: "Projects", extensions: PROJECT_EXTENSIONS },
    ],
  });

  if (!selected || Array.isArray(selected)) return null;

  const bytes = await readFile(selected);
  const name = selected.split(/[\\/]/).pop() ?? "file";
  return { name, data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer };
}

/** @deprecated Use openAnyFileNative */
export async function openModelFileNative(): Promise<OpenedFile | null> {
  return openAnyFileNative();
}

/** @deprecated Use openAnyFileNative */
export async function openRcanimFileNative(): Promise<OpenedFile | null> {
  return openAnyFileNative();
}

/**
 * Saves bytes to disk: native "Save As" dialog + fs write on desktop,
 * blob download in the browser. Returns true if the file was written/downloaded.
 */
export async function saveBytes(
  defaultName: string,
  data: Uint8Array,
  extension: string
): Promise<boolean> {
  const label =
    extension === "zip"
      ? "ZIP archive"
      : extension.toUpperCase();

  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");

    const path = await save({
      defaultPath: defaultName,
      filters: [{ name: label, extensions: [extension] }],
    });

    if (!path) return false;
    await writeFile(path, data);
    return true;
  }

  const blob = new Blob([new Uint8Array(data)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = defaultName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

/** Opens a URL in a new browser tab / system handler. */
export async function openLink(url: string) {
  if (!url || typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

const IMAGE_FILE_EXT = /\.(png|jpe?g|webp|bmp|tga|gif|hdr)$/i;

function imageMimeType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

function isImageFileName(name: string): boolean {
  return IMAGE_FILE_EXT.test(name);
}

function fileWithRelativePath(bytes: Uint8Array, name: string, relativePath: string): File {
  const file = new File([new Uint8Array(bytes)], name, { type: imageMimeType(name) });
  Object.defineProperty(file, "webkitRelativePath", { value: relativePath, configurable: true });
  return file;
}

async function collectImageFilesFromDir(
  dirPath: string,
  rootName: string,
  relativePrefix: string,
  out: File[]
): Promise<void> {
  const { readDir, readFile } = await import("@tauri-apps/plugin-fs");
  const { join } = await import("@tauri-apps/api/path");

  let entries;
  try {
    entries = await readDir(dirPath);
  } catch (err) {
    throw new Error(
      `Cannot read folder "${dirPath}": ${err instanceof Error ? err.message : String(err)}`
    );
  }

  for (const entry of entries) {
    const entryPath = await join(dirPath, entry.name);
    const rel = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
    if (entry.isDirectory) {
      await collectImageFilesFromDir(entryPath, rootName, rel, out);
      continue;
    }
    if (!entry.isFile || !isImageFileName(entry.name)) continue;
    try {
      const bytes = await readFile(entryPath);
      out.push(fileWithRelativePath(bytes, entry.name, `${rootName}/${rel}`));
    } catch {
      // Skip unreadable files instead of failing the whole import.
    }
  }
}

/**
 * Native folder picker (Tauri). Returns image files with webkitRelativePath set for texture matching.
 */
export async function openTextureFolderNative(): Promise<File[] | null> {
  if (!isTauri()) return null;

  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Select textures folder",
  });

  if (!selected || Array.isArray(selected)) return null;

  const dirPath = selected;
  const rootName = dirPath.split(/[\\/]/).pop() ?? "textures";
  const files: File[] = [];
  await collectImageFilesFromDir(dirPath, rootName, "", files);
  return files;
}
