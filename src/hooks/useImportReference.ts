import { useCallback, useRef, type ChangeEvent } from "react";
import { isTauri, openAnyFileNative } from "@/lib/tauri";
import { ModelLoadError } from "@/lib/model-loader";
import { importReferenceFromFile } from "@/lib/app-actions";
import { yieldToMain } from "@/lib/yield-main";
import { useModelStore } from "@/store/modelStore";

const MODEL_EXTENSIONS = /\.(glb|gltf|fbx|obj)$/i;

export function useImportReference() {
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = useModelStore((s) => s.isLoading);
  const setLoadError = useModelStore((s) => s.setLoadError);

  const importFile = useCallback(
    async (file: File) => {
      setLoadError(null);
      await yieldToMain();
      try {
        await importReferenceFromFile(file);
      } catch (err) {
        setLoadError(err instanceof ModelLoadError ? err.message : "Failed to import reference.");
        useModelStore.getState().setLoading(false);
      }
    },
    [setLoadError]
  );

  const openReferenceFile = useCallback(async () => {
    if (isLoading) return;
    if (isTauri()) {
      const opened = await openAnyFileNative();
      if (!opened || !MODEL_EXTENSIONS.test(opened.name)) {
        if (opened) setLoadError("References support .glb, .gltf, .fbx, and .obj files.");
        return;
      }
      setLoadError(null);
      useModelStore.getState().setLoading(true, `Importing reference ${opened.name}…`);
      await yieldToMain();
      try {
        const file = new File([opened.data], opened.name);
        await importReferenceFromFile(file);
      } catch (err) {
        setLoadError(err instanceof ModelLoadError ? err.message : "Failed to import reference.");
        useModelStore.getState().setLoading(false);
      }
      return;
    }
    inputRef.current?.click();
  }, [isLoading, setLoadError]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      void importFile(file);
    },
    [importFile]
  );

  return {
    inputRef,
    openReferenceFile,
    handleInputChange,
  };
}
