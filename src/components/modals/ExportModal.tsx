import { useState } from "react";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { exportAndSave } from "@/lib/export";
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

  const [selected, setSelected] = useState<Set<string>>(() => new Set(activeClipId ? [activeClipId] : []));
  const [fileName, setFileName] = useState(() => `${(model?.sourceName ?? "model").replace(/\.[^.]+$/, "")}-animated`);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!model) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = async () => {
    setStatus("working");
    setMessage(null);
    const preservedTime = engine?.time ?? 0;
    resetToRestPose();
    try {
      const clipsToExport = clips.filter((c) => selected.has(c.id)).map((c) => c.clip);
      const saved = await exportAndSave(model.object3D, clipsToExport, fileName || "model");
      setStatus(saved ? "done" : "idle");
      if (saved) setMessage(isTauri() ? "Saved successfully." : "Download started.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Export failed.");
    } finally {
      engine?.seek(preservedTime);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export as GLB" icon={<Download className="h-5 w-5 text-primary" />}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">File name</label>
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background-subtle">
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
            />
            <span className="pr-3 text-sm text-foreground-muted">.glb</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">Animations to include</label>
          <div className="custom-scrollbar max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-1.5">
            {clips.length === 0 && <p className="p-2 text-xs text-foreground-muted">No animations yet — the mesh/skeleton will still export.</p>}
            {clips.map((clip) => (
              <label
                key={clip.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
              >
                <input type="checkbox" checked={selected.has(clip.id)} onChange={() => toggle(clip.id)} className="accent-[var(--primary)]" />
                <span className="flex-1 truncate">{clip.name}</span>
                <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] uppercase text-foreground-muted">{clip.source}</span>
              </label>
            ))}
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${status === "error" ? "border-danger/40 bg-danger/10 text-danger" : "border-success/40 bg-success/10 text-success"}`}>
            {status === "error" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {message}
          </div>
        )}

        <Button className="w-full" onClick={handleExport} disabled={status === "working"}>
          {status === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {status === "working" ? "Exporting..." : "Export GLB"}
        </Button>
        <p className="text-center text-[11px] text-foreground-muted">
          Export always produces a .glb file — three.js has no reliable FBX writer.
        </p>
      </div>
    </Modal>
  );
}
