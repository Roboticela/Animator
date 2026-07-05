import { useEffect, useRef, useState } from "react";
import { FolderTree, ImageIcon, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { isTauri, openTextureFolderNative } from "@/lib/tauri";
import { useModelStore } from "@/store/modelStore";

function countImageFiles(files: File[]): number {
  return files.filter((f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif|tga|hdr)$/i.test(f.name)).length;
}

export function TextureFolderPromptModal() {
  const open = useModelStore((s) => s.textureFolderPromptOpen);
  const model = useModelStore((s) => s.model);
  const closeTextureFolderPrompt = useModelStore((s) => s.closeTextureFolderPrompt);
  const embedTexturesFromFolder = useModelStore((s) => s.embedTexturesFromFolder);
  const textureFolderLoading = useModelStore((s) => s.textureFolderLoading);
  const textureFolderLoadingMessage = useModelStore((s) => s.textureFolderLoadingMessage);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [pickingFolder, setPickingFolder] = useState(false);

  const busy = textureFolderLoading || pickingFolder;

  useEffect(() => {
    if (!open) return;
    setResultText(null);
    setErrorText(null);
    setPickingFolder(false);
  }, [open, model?.sourceName]);

  const handleFiles = async (files: File[]) => {
    const imageCount = countImageFiles(files);
    setErrorText(null);
    setResultText(null);

    if (imageCount === 0) {
      setErrorText("No image files found in that folder.");
      return;
    }

    try {
      const result = await embedTexturesFromFolder(files);
      if (result.matched > 0) {
        setResultText(
          `Linked ${result.matched} texture${result.matched === 1 ? "" : "s"}. They will be embedded when you save as .rcanim.`
        );
      } else {
        setErrorText(
          result.fileCount === 0
            ? "No image files found in that folder."
            : result.unmatched.length > 0
              ? `No matching textures (${result.fileCount} images scanned). Try the parent folder that contains both the model and textures.`
              : "No textures were matched to this model. Try a folder with filenames matching the material or texture paths."
        );
      }
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Failed to load textures from the selected folder.");
    }
  };

  const pickFolderWeb = () => {
    if (busy) return;
    folderInputRef.current?.click();
  };

  const pickFolderNative = async () => {
    if (busy) return;
    setErrorText(null);
    setResultText(null);
    setPickingFolder(true);

    try {
      const files = await openTextureFolderNative();
      if (!files?.length) return;
      await handleFiles(files);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Could not read the selected folder.");
    } finally {
      setPickingFolder(false);
    }
  };

  const onClose = () => {
    if (busy) return;
    setResultText(null);
    setErrorText(null);
    closeTextureFolderPrompt();
  };

  const extLabel = model?.sourceExt?.toUpperCase() ?? "model";
  const statusMessage =
    textureFolderLoadingMessage ??
    (pickingFolder ? "Reading texture folder…" : "Linking textures…");

  if (!open || !model) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Link texture folder"
      icon={<ImageIcon className="h-6 w-6 text-primary" />}
    >
      <div className="relative min-h-[220px] space-y-4">
        {busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-card/90 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2 px-4 py-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">{statusMessage}</p>
            </div>
          </div>
        )}

        <p className="text-sm leading-relaxed text-foreground-muted">
          <span className="font-medium text-foreground">{model.sourceName}</span> ({extLabel}) uses texture
          images stored outside the file. Select the folder that contains those images — they will be linked now
          and <span className="text-foreground">embedded inside your .rcanim project</span> when you save (no
          separate files needed).
        </p>

        <div className="rounded-lg border border-border/60 bg-background-subtle/40 px-3 py-2 text-xs text-foreground-muted">
          <p className="font-medium text-foreground/80">Tip</p>
          <p className="mt-1">
            Choose the folder next to your model (often named <span className="font-mono">textures</span>) or its
            parent directory. Files are matched by path and filename from the model.
          </p>
        </div>

        <input
          ref={folderInputRef}
          type="file"
          className="hidden"
          multiple
          // @ts-expect-error webkitdirectory is supported in Chromium/Firefox
          webkitdirectory=""
          directory=""
          onChange={(e) => {
            const list = e.target.files;
            e.target.value = "";
            if (list?.length) void handleFiles([...list]);
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy}
            onClick={() => (isTauri() ? void pickFolderNative() : pickFolderWeb())}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderTree className="h-4 w-4" />}
            {busy ? "Linking textures…" : "Select texture folder…"}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            {resultText ? "Continue" : "Skip for now"}
          </Button>
        </div>

        {resultText && <p className={cn("text-xs text-emerald-400")}>{resultText}</p>}
        {errorText && <p className="text-xs text-danger">{errorText}</p>}
      </div>
    </Modal>
  );
}
