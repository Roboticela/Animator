import { BookOpen, Clapperboard, Diamond, FileDown, FileUp, Spline } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: FileUp,
    title: "1. Import or try the sample rig",
    body: "Drop in a .glb, .gltf, .fbx or .obj file, or click \"Load Sample Rig\" to explore the tool immediately without a file.",
  },
  {
    icon: Spline,
    title: "2. Inspect the armature",
    body: "The Armatures & Bones panel lists every bone. Click to select; Ctrl+click to add/remove; Shift+click for a range. Select multiple bones to transform or keyframe them together.",
  },
  {
    icon: Clapperboard,
    title: "3. Try a premade animation",
    body: "Open the Premade tab in the Animation Library and click any move (Idle, Walk, Run, Wave, Jump, Spin, Dance) to preview it instantly on your rig.",
  },
  {
    icon: Diamond,
    title: "4. Hand-author your own clip",
    body: "Create a Custom clip, pose selected bones with the Move/Rotate/Scale gizmo (W/E/R), then press K or click \"Set Keyframe\" to record poses at the playhead.",
  },
  {
    icon: FileDown,
    title: "5. Export",
    body: "Once you're happy with a clip, use Export to bake it into the model and save a new .glb.",
  },
];

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Guide" icon={<BookOpen className="h-5 w-5 text-primary" />} className="max-w-xl">
      <p className="mb-4 text-sm leading-relaxed text-foreground/50">
        Everything you need to get started with Animator — import a rig, preview animations, author your own, and export.
      </p>
      <div className="space-y-3">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex gap-4 rounded-xl border border-border/60 bg-background/40 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-accent/20"
          >
            <div className="mt-0.5 flex h-fit flex-shrink-0 rounded-lg border border-border bg-card p-2">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-foreground">{title}</div>
              <p className="text-xs leading-relaxed text-foreground/55 sm:text-sm">{body}</p>
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-xs leading-relaxed text-foreground/55">
          <span className="font-semibold text-foreground">Shortcuts:</span> W/E/R move/rotate/scale • Space play/pause • K keyframe • F frame model • G grid • L lights • H shadows • Home reset bone • Ctrl+A select all • Ctrl+D deselect • Escape clear • Ctrl+Z/Y undo/redo
        </div>
        <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-xs leading-relaxed text-foreground/55">
          <span className="font-semibold text-foreground">Note:</span> Premade animations use bone-name heuristics — unusual rig names may only animate partially. Exports are always saved as .glb.
        </div>
      </div>
    </Modal>
  );
}
