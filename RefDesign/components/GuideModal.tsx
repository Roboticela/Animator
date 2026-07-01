"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Keyboard,
  Palette,
  Maximize,
  MousePointer2,
  SquareMousePointer,
  Hand,
  Scroll,
  Link,
  RotateCcw,
  RefreshCw,
  Gamepad2,
  Type,
  BookMarked,
} from "lucide-react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  {
    icon: Keyboard,
    title: "Keyboard Models",
    description:
      "Switch between realistic 3D laptop keyboard models — Asus UX370UAR, Dell Latitude (5300 & E7270), HP EliteBook 820 G4, and Toshiba Portege X30 E. Each model accurately replicates the physical key layout of that laptop.",
  },
  {
    icon: Palette,
    title: "Themes",
    description:
      "Personalise the interface with 8 built-in colour themes: Dark, Light, Navy, Sunset, Ocean, Forest, Purple Dream, and Midnight. Your chosen theme is saved automatically and restored on every visit.",
  },
  {
    icon: Link,
    title: "Keyboard Sync",
    description:
      "Enable Keyboard Sync to highlight keys on the 3D keyboard as you type on your physical keyboard in real time. Every key press lights up the matching key so you can see exactly what you're typing.",
  },
  {
    icon: Type,
    title: "Document Editor",
    description:
      "The built-in document editor lets you type freely. It reflects every keystroke and pairs with Keyboard Sync to show which key is being pressed at any moment — great for demonstrations and learning sessions.",
  },
  {
    icon: Maximize,
    title: "Fullscreen Mode",
    description:
      "Fullscreen mode hides all UI and fills the screen with just the 3D keyboard. Press Escape or the close button to exit. Ideal for presentations, classroom displays, or focused practice.",
  },
  {
    icon: Hand,
    title: "Hand Mode",
    description:
      "Toggle Hand mode to grab and rotate the 3D keyboard freely with your mouse. Click and drag to spin it to any angle — useful for inspecting key positions from different perspectives.",
  },
  {
    icon: MousePointer2,
    title: "Mouse Cursor",
    description:
      "Enable Mouse to show a virtual pointer inside the document editor. The real cursor is hidden in that panel so only the virtual pointer is visible, clamped to the document boundaries.",
  },
  {
    icon: SquareMousePointer,
    title: "Key Mouse",
    description:
      "Key Mouse turns on the virtual cursor (and Mouse mode) and moves it with the arrow keys instead of your physical mouse. Plain arrows on the physical or virtual keyboard nudge the pointer inside the document editor; modifier combos still behave normally.",
  },
  {
    icon: Scroll,
    title: "Key Scroll",
    description:
      "Key Scroll lets plain arrow keys pass through to the browser so the page can scroll and focused fields use native navigation, while the virtual keyboard still highlights the pressed arrow key.",
  },
  {
    icon: RotateCcw,
    title: "Reset View",
    description:
      "Reset View snaps the 3D keyboard back to its default position and angle instantly, undoing any rotations or pans applied while in Hand mode.",
  },
  {
    icon: RefreshCw,
    title: "Reset All",
    description:
      "Reset restores the document, sidebar controls, keyboard locks, theme, and header toggles to their defaults. It switches back to the PC keyboard and resets the 3D view to its default position.",
  },
  {
    icon: Gamepad2,
    title: "Games",
    description:
      "Access 20 keyboard games from the Menu → Games. Games cover typing speed, accuracy, reaction time, key memory, quizzes, and more — all designed to sharpen your keyboard skills in a fun way.",
  },
];

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (typeof window === "undefined") return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-gradient-to-r from-accent/10 via-accent/5 to-transparent flex-shrink-0"
              >
                <div className="flex items-center gap-3">
                  <BookMarked className="w-5 h-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    App Guide
                  </h2>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                transition={{ delay: 0.15 }}
                className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6"
                style={{ scrollbarGutter: "stable" }}
              >
                <p className="text-foreground/50 text-sm mb-6 leading-relaxed">
                  Everything you need to know about Keyboard Simulator — hover over each
                  feature below to learn how it works.
                </p>

                <div className="space-y-3">
                  {sections.map((section, i) => {
                    const Icon = section.icon;
                    return (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 + i * 0.04 }}
                        className="flex gap-4 p-4 rounded-xl border border-border/60 bg-background/40 hover:border-primary/30 hover:bg-accent/20 transition-all duration-200 group"
                      >
                        <div className="p-2 rounded-lg border border-border bg-card flex-shrink-0 group-hover:border-primary/30 transition-colors h-fit mt-0.5">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm mb-1">
                            {section.title}
                          </h3>
                          <p className="text-foreground/55 text-xs sm:text-sm leading-relaxed">
                            {section.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
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
