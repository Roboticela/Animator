import { Keyboard } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUPS = [
  {
    title: "Selection",
    items: [
      ["Click", "Select bone"],
      ["Ctrl+Click", "Add/remove from selection"],
      ["Shift+Click", "Range select"],
      ["Ctrl+A", "Select all bones"],
      ["Ctrl+D / Esc", "Clear selection"],
    ],
  },
  {
    title: "Transform",
    items: [
      ["W / E / R", "Move / rotate / scale"],
      ["X", "Toggle gizmo local/world space"],
      ["K", "Set keyframe(s)"],
      ["Home", "Reset selected bones"],
      ["Ctrl+C / Ctrl+V", "Copy / paste transforms"],
      ["M", "Mirror selection on X"],
      [".", "Frame selection"],
    ],
  },
  {
    title: "Playback",
    items: [
      ["Space", "Play / pause"],
      ["← / →", "Step one frame"],
      ["Ctrl+Z / Ctrl+Y", "Undo / redo"],
    ],
  },
  {
    title: "Viewport",
    items: [
      ["F", "Frame model"],
      ["G", "Toggle grid"],
      ["L", "Toggle lights"],
      ["H", "Toggle shadows"],
      ["O", "Orthographic camera"],
      ["Gauge btn", "FPS counter in status bar"],
    ],
  },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" icon={<Keyboard className="h-5 w-5 text-primary" />} className="max-w-lg">
      <div className="custom-scrollbar max-h-[min(70vh,28rem)] space-y-4 overflow-y-auto pr-1">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">{group.title}</h3>
            <div className="space-y-1">
              {group.items.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-sm">
                  <span className="text-foreground/55">{desc}</span>
                  <kbd className="flex-shrink-0 rounded-md border border-border bg-card px-2 py-0.5 font-mono text-xs text-foreground">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
