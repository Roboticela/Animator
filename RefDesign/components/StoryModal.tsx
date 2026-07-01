"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StoryModal({ isOpen, onClose }: StoryModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);
  if (typeof window === "undefined") return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="w-full max-w-3xl max-h-[90vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-gradient-to-r from-accent/10 via-accent/5 to-transparent"
              >
                <motion.h2
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl sm:text-2xl font-bold text-foreground"
                >
                  The Story Behind Keyboard Simulator
                </motion.h2>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 rounded-lg border border-border bg-card/80 backdrop-blur-sm hover:bg-accent hover:border-primary/50 transition-all duration-200"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-foreground" />
                </motion.button>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8"
                style={{ scrollbarGutter: 'stable' }}
              >
                <div className="prose prose-invert max-w-none">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-foreground/90 text-sm sm:text-base leading-relaxed mb-4"
                  >
                    It all started on a regular day during a remote teaching session. We were working on understanding keyboards — everything from the different layouts to where the function keys are located, and even the proper way to position your fingers on the keys. But there was a big problem. We weren't all available at the same physical location. We needed to learn remotely, but without an actual keyboard in front of us, it was really difficult to explain and demonstrate everything properly.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-foreground/90 text-sm sm:text-base leading-relaxed mb-4"
                  >
                    That's when the idea hit me. What if there was an app that could simulate a real keyboard? Something that anyone could access from anywhere, showing all the different aspects of a keyboard — the QWERTY layout, the function keys at the top, the number pad on the side, and even guidance on proper finger placement.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-foreground/90 text-sm sm:text-base leading-relaxed mb-4"
                  >
                    The more I thought about it, the more I realized how useful this could be. Even if we were all in the same place, getting access to different keyboard layouts would be really hard. You can't just go out and buy a Dvorak keyboard or a Colemak keyboard whenever you want to learn about them. And what about regional layouts like AZERTY or other international keyboards? It would cost a fortune and take up so much space to have all those physical keyboards available.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-foreground/90 text-sm sm:text-base leading-relaxed mb-4"
                  >
                    With a simulator, all of these layouts could be available in one place, accessible to anyone with a device. Students could explore different keyboard types without needing to buy expensive hardware.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="text-foreground/90 text-sm sm:text-base leading-relaxed mb-4"
                  >
                    I want to thank <strong className="text-foreground">Shehram Riaz</strong> for his contribution in making different keyboard designs for the app, which really helped make it look better and more polished.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-foreground/90 text-sm sm:text-base leading-relaxed"
                  >
                    Looking back, it's funny how the best ideas come from real problems. I never imagined that the challenge of teaching keyboard basics remotely would lead to creating an actual application. But sometimes that's how it works — you face a challenge, and you figure out a solution that ends up helping way more people than you expected.
                  </motion.p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

