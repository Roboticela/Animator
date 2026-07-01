import { useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import Seo from "@/components/Seo";
import AppHeader from "@/components/AppHeader";
import DocumentEditor from "@/components/DocumentEditor";
import StatusControls from "@/components/StatusControls";
import Keyboard from "@/components/Keyboard";
import VirtualMouseCursor from "@/components/VirtualMouseCursor";
import { useFullscreen } from "@/contexts/FullscreenContext";
import { useKeyboardView } from "@/contexts/KeyboardViewContext";
import { useMouse } from "@/contexts/MouseContext";
import { X, RotateCcw } from "lucide-react";
import GamesPage from "@/pages/GamesPage";
import GamePage from "@/pages/GamePage";

function MainPage() {
  const { fullscreenEnabled, setFullscreenEnabled } = useFullscreen();
  const { resetView } = useKeyboardView();
  const { mouseEnabled } = useMouse();
  const documentEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fullscreenEnabled) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreenEnabled(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [fullscreenEnabled, setFullscreenEnabled]);

  if (fullscreenEnabled) {
    return (
      <>
        <Seo />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-background z-50 overflow-hidden"
        >
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <motion.button
              onClick={() => resetView()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-2 rounded-lg border border-border bg-card/80 backdrop-blur-sm hover:bg-accent hover:border-primary/50 transition-all duration-200"
              aria-label="Reset view"
              title="Reset view"
            >
              <RotateCcw className="w-5 h-5 text-foreground" />
            </motion.button>
            <motion.button
              onClick={() => setFullscreenEnabled(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-2 rounded-lg border border-border bg-card/80 backdrop-blur-sm hover:bg-accent hover:border-primary/50 transition-all duration-200"
              aria-label="Exit fullscreen"
            >
              <X className="w-5 h-5 text-foreground" />
            </motion.button>
          </div>
          <div className="w-full h-full flex items-center justify-center p-4">
            <Keyboard />
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto custom-scrollbar">
      <Seo />
      <AppHeader />
      <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 p-2 sm:p-4 min-h-[calc(100vh-3.5rem)] overflow-x-hidden overflow-y-auto">
        <div className="flex-[0.8] flex flex-col gap-2 sm:gap-4 min-w-0">
          <div className={`flex-[0.42] min-h-[220px] sm:min-h-[260px] lg:min-h-0 ${mouseEnabled ? "cursor-none" : ""}`}>
            <DocumentEditor ref={documentEditorRef} />
          </div>
          <div className="flex-[0.58] min-h-0">
            <Keyboard />
          </div>
        </div>
        <div className="flex-[0.2] min-w-0 lg:min-w-[200px]">
          <StatusControls />
        </div>
      </div>
      <VirtualMouseCursor documentRef={documentEditorRef} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/games" element={<GamesPage />} />
      <Route path="/games/:slug" element={<GamePage />} />
      <Route path="*" element={<MainPage />} />
    </Routes>
  );
}
