import { useCallback, useRef, type ChangeEvent } from "react";
import { isTauri, openModelFileNative } from "@/lib/tauri";
import { loadModelFromBuffer, loadModelFromFile, ModelLoadError } from "@/lib/model-loader";
import { loadModelIntoApp } from "@/lib/app-actions";
import { buildSampleRig } from "@/lib/sample-rig";
import { yieldToMain } from "@/lib/yield-main";
import { useModelStore } from "@/store/modelStore";

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

  const loadSampleRig = useCallback(async () => {
    setLoadError(null);
    setLoading(true, "Building sample rig…");
    await yieldToMain();
    try {
      const data = buildSampleRig();
      await yieldToMain();
      loadModelIntoApp(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to build sample rig.");
      setLoading(false);
    }
  }, [setLoadError, setLoading]);

  const openFile = useCallback(async () => {
    if (isLoading) return;
    if (isTauri()) {
      const opened = await openModelFileNative();
      if (opened) {
        await loadBuffer(opened.data, opened.name);
        return;
      }
      return;
    }
    inputRef.current?.click();
  }, [isLoading, loadBuffer]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) void loadFile(file);
    },
    [loadFile]
  );

  return { openFile, loadFile, loadBuffer, loadSampleRig, isLoading, error, inputRef, handleInputChange };
}
