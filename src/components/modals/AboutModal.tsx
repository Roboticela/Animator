import { Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About Animator" icon={<Info className="h-5 w-5 text-primary" />}>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/55">
        <p>
          <span className="font-semibold text-foreground">Animator</span> is a browser/desktop tool for importing
          rigged 3D models, inspecting their armatures, previewing and blending animations, hand-posing bones with a
          gizmo and keyframe timeline, and exporting the result as a single <code className="font-mono text-foreground">.glb</code>.
        </p>
        <p>Supported imports: GLB, GLTF, FBX, OBJ. Exports are always packaged as GLB.</p>
        <p>Everything runs locally in this app — no files are uploaded anywhere.</p>
        <p className="pt-2 text-xs text-foreground/40">Built on the Roboticela DevKit (React + Vite + Tauri + three.js).</p>
      </div>
    </Modal>
  );
}
