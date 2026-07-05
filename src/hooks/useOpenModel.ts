import { useCallback, useRef, type ChangeEvent } from "react";
import { isTauri, openAnyFileNative } from "@/lib/tauri";
import { loadModelFromBuffer, loadModelFromFile, ModelLoadError } from "@/lib/model-loader";
import { loadModelIntoApp } from "@/lib/app-actions";
import { buildSampleRig } from "@/lib/sample-rig";
import { openRcanimFromFile, openRcanimFromNative, RcanimError, saveRcanimProject } from "@/lib/rcanim";
import { yieldToMain } from "@/lib/yield-main";
import { useModelStore } from "@/store/modelStore";

function isRcanimFile(name: string): boolean {
  return name.toLowerCase().endsWith(".rcanim");
}

export function useOpenModel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = useModelStore((s) => s.isLoading);
  const error = useModelStore((s) => s.loadError);
  const setLoading = useModelStore((s) => s.setLoading);
  const setLoadError = useModelStore((s) => s.setLoadError);

  const loadFile = useCallback(
    async (file: File) => {
      setLoadError(null);
      setLoading(true, `Loading ${file.name}…`);
      await yieldToMain();
      try {
        const data = await loadModelFromFile(file);
        loadModelIntoApp(data);
      } catch (err) {
        setLoadError(err instanceof ModelLoadError ? err.message : "Failed to load the model.");
        setLoading(false);
      }
    },
    [setLoadError, setLoading]
  );

  const loadBuffer = useCallback(
    async (buffer: ArrayBuffer, name: string) => {
      setLoadError(null);
      setLoading(true, `Loading ${name}…`);
      await yieldToMain();
      try {
        const data = await loadModelFromBuffer(buffer, name);
        loadModelIntoApp(data);
      } catch (err) {
        setLoadError(err instanceof ModelLoadError ? err.message : "Failed to load the model.");
        setLoading(false);
      }
    },
    [setLoadError, setLoading]
  );

  const loadProjectFile = useCallback(
    async (file: File) => {
      setLoadError(null);
      setLoading(true, `Opening ${file.name}…`);
      await yieldToMain();
      try {
        await openRcanimFromFile(file);
      } catch (err) {
        setLoadError(err instanceof RcanimError ? err.message : "Failed to open project.");
        setLoading(false);
      }
    },
    [setLoadError, setLoading]
  );

  const loadSampleRig = useCallback(async () => {
    setLoadError(null);
    setLoading(true, "Building demo model…");
    await yieldToMain();
    try {
      const data = buildSampleRig();
      await yieldToMain();
      loadModelIntoApp(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to build demo model.");
      setLoading(false);
    }
  }, [setLoadError, setLoading]);

  const openFromNative = useCallback(
    async (opened: { name: string; data: ArrayBuffer }) => {
      setLoadError(null);
      setLoading(true, `Opening ${opened.name}…`);
      await yieldToMain();
      try {
        if (isRcanimFile(opened.name)) {
          await openRcanimFromNative(opened);
        } else {
          await loadBuffer(opened.data, opened.name);
        }
      } catch (err) {
        if (err instanceof RcanimError) {
          setLoadError(err.message);
        } else if (err instanceof ModelLoadError) {
          setLoadError(err.message);
        } else {
          setLoadError("Failed to open file.");
        }
        setLoading(false);
      }
    },
    [loadBuffer, setLoadError, setLoading]
  );

  const openLocalFile = useCallback(
    (file: File) => {
      if (isRcanimFile(file.name)) void loadProjectFile(file);
      else void loadFile(file);
    },
    [loadFile, loadProjectFile]
  );

  const openFile = useCallback(async () => {
    if (isLoading) return;
    if (isTauri()) {
      const opened = await openAnyFileNative();
      if (opened) await openFromNative(opened);
      return;
    }
    inputRef.current?.click();
  }, [isLoading, openFromNative]);

  const saveProject = useCallback(async () => {
    if (isLoading) return;
    setLoadError(null);
    setLoading(true, "Saving project…");
    await yieldToMain();
    try {
      await saveRcanimProject();
    } catch (err) {
      setLoadError(err instanceof RcanimError ? err.message : "Failed to save project.");
    } finally {
      setLoading(false);
    }
  }, [isLoading, setLoadError, setLoading]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      openLocalFile(file);
    },
    [openLocalFile]
  );

  return {
    openFile,
    openLocalFile,
    saveProject,
    loadFile,
    loadBuffer,
    loadSampleRig,
    isLoading,
    error,
    inputRef,
    handleInputChange,
  };
}
