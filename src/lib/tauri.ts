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
  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");

    const path = await save({
      defaultPath: defaultName,
      filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
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
