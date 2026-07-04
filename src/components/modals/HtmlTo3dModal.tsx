import { Code2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { HtmlTo3dPanel } from "@/components/panels/HtmlTo3dPanel";

interface HtmlTo3dModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "project" | "reference";
}

export function HtmlTo3dModal({ isOpen, onClose, mode = "project" }: HtmlTo3dModalProps) {
  const isReference = mode === "reference";
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReference ? "HTML reference" : "HTML to 3D"}
      icon={<Code2 className="h-6 w-6 text-primary" />}
      className="max-w-5xl"
      bodyClassName="p-0"
      scrollBody={false}
    >
      <HtmlTo3dPanel mode={mode} onApplied={onClose} />
    </Modal>
  );
}
