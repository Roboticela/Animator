import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, icon, children, className }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div
              className={cn(
                "pointer-events-auto flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-gradient-to-r from-accent/10 via-accent/5 to-transparent p-4 sm:p-6">
                <div className="flex items-center gap-3 text-xl font-bold text-foreground">
                  {icon}
                  {title}
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-lg border border-border bg-card/80 p-2 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-accent"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-foreground" />
                </motion.button>
              </div>
              <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
