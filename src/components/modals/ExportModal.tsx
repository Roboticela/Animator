import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileDown, Loader2, Package, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { exportSceneAndSave } from "@/lib/export";
import { EXPORT_FORMATS, getExportFormat, type ExportFormatId } from "@/lib/export-formats";
import { isTauri } from "@/lib/tauri";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const model = useModelStore((s) => s.model);
  const engine = useModelStore((s) => s.engine);
  const resetToRestPose = useModelStore((s) => s.resetToRestPose);
  const clips = useAnimationStore((s) => s.clips);
  const activeClipId = useAnimationStore((s) => s.activeClipId);

  const [format, setFormat] = useState<ExportFormatId>("glb");
  const [includeTextures, setIncludeTextures] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(activeClipId ? [activeClipId] : []));
  const [fileName, setFileName] = useState(() => `${(model?.sourceName ?? "model").replace(/\.[^.]+$/, "")}-export`);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const formatInfo = useMemo(() => getExportFormat(format), [format]);
  const showTextureToggle = formatInfo.supportsTextures;
  const showAnimations = formatInfo.supportsAnimations;

  useEffect(() => {
    if (!isOpen || !model) return;
    setFileName(`${model.sourceName.replace(/\.[^.]+$/, "")}-export`);
    setStatus("idle");
    setMessage(null);
  }, [isOpen, model]);

  useEffect(() => {
    if (!showTextureToggle && !includeTextures) setIncludeTextures(true);
  }, [showTextureToggle, includeTextures]);

  if (!model) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const outputExtension =
    format === "obj" || (format === "dae" && includeTextures) ? "zip" : formatInfo.extension;

  const handleExport = async () => {
    setStatus("working");
    setMessage(null);
    const preservedTime = engine?.time ?? 0;
    resetToRestPose();
    try {
      const clipsToExport = showAnimations
        ? clips.filter((c) => selected.has(c.id)).map((c) => c.clip)
        : [];
      const saved = await exportSceneAndSave({
        root: model.object3D,
        format,
        includeTextures: showTextureToggle ? includeTextures : false,
        animations: clipsToExport,
        fileBaseName: fileName || "model",
      });
      setStatus(saved ? "done" : "idle");
      if (saved) {
        setMessage(
          isTauri()
            ? `Saved ${outputExtension === "zip" ? "archive" : `.${formatInfo.extension}`} successfully.`
            : "Download started."
        );
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Export failed.");
    } finally {
      engine?.seek(preservedTime);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export model" icon={<Package className="h-5 w-5 text-primary" />}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">Format</label>
          <div className="custom-scrollbar grid max-h-44 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-border p-1.5 sm:grid-cols-4">
            {EXPORT_FORMATS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFormat(item.id)}
                className={cn(
                  "rounded-md px-2 py-2 text-left text-xs transition-colors",
                  format === item.id
                    ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30"
                    : "text-foreground-muted hover:bg-accent hover:text-foreground"
                )}
              >
                <span className="block font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-[10px] leading-snug opacity-80">.{item.extension}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-foreground-muted">{formatInfo.description}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">File name</label>
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background-subtle">
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
            />
            <span className="pr-3 text-sm text-foreground-muted">.{outputExtension}</span>
          </div>
        </div>

        {showTextureToggle && (
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-background-subtle/50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={includeTextures}
              onChange={(e) => setIncludeTextures(e.target.checked)}
              className="mt-0.5 accent-[var(--primary)]"
            />
            <span className="min-w-0 text-xs">
              <span className="font-medium text-foreground">Include textures</span>
              <span className="mt-0.5 block text-foreground-muted">
                Embed or bundle color, normal, and other texture maps. Turn off for a smaller file with solid
                materials only.
              </span>
            </span>
          </label>
        )}

        {showAnimations && (
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">Animations to include</label>
            <div className="custom-scrollbar max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-1.5">
              {clips.length === 0 && (
                <p className="p-2 text-xs text-foreground-muted">No animations — mesh and skeleton still export.</p>
              )}
              {clips.map((clip) => (
                <label
                  key={clip.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(clip.id)}
                    onChange={() => toggle(clip.id)}
                    className="accent-[var(--primary)]"
                  />
                  <span className="flex-1 truncate">{clip.name}</span>
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] uppercase text-foreground-muted">
                    {clip.source}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
              status === "error" ? "border-danger/40 bg-danger/10 text-danger" : "border-success/40 bg-success/10 text-success"
            }`}
          >
            {status === "error" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {message}
          </div>
        )}

        <Button className="w-full" onClick={() => void handleExport()} disabled={status === "working"}>
          {status === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          {status === "working" ? "Exporting…" : `Export ${formatInfo.label}`}
        </Button>

        <p className="text-center text-[11px] text-foreground-muted">
          GLB and FBX embed textures in a single file. OBJ and Collada with textures download as a .zip archive.
          References in the viewport are never exported.
        </p>
      </div>
    </Modal>
  );
}
