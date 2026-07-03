import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  Cuboid,
  ExternalLink,
  FileDown,
  FileUp,
  FileX2,
  Info,
  Keyboard,
  Layers3,
  Library,
  LifeBuoy,
  Loader2,
  Menu,
  Palette,
  Redo2,
  Scale,
  Shield,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, THEMES } from "@/contexts/ThemeContext";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { useOpenModel } from "@/hooks/useOpenModel";
import { openLink } from "@/lib/tauri";
import { GuideModal } from "@/components/modals/GuideModal";
import { AboutModal } from "@/components/modals/AboutModal";
import { AnimationLibraryModal } from "@/components/modals/AnimationLibraryModal";
import { ExportModal } from "@/components/modals/ExportModal";
import { SceneInfoModal } from "@/components/modals/SceneInfoModal";
import { ShortcutsModal } from "@/components/modals/ShortcutsModal";
import { cn } from "@/lib/utils";

const ROBOTICELA_SITE_URL = "https://roboticela.com";

export function AppHeader() {
  const model = useModelStore((s) => s.model);
  const clearModel = useModelStore((s) => s.clearModel);
  const resetAnimations = useAnimationStore((s) => s.resetForNewModel);
  const undoStack = useAnimationStore((s) => s.undoStack);
  const redoStack = useAnimationStore((s) => s.redoStack);
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);
  const { theme, setTheme } = useTheme();
  const { openFile, loadSampleRig, isLoading, error, inputRef, handleInputChange } = useOpenModel();

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sceneInfoOpen, setSceneInfoOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const currentTheme = THEMES.find((t) => t.name === theme);

  const closeModel = () => {
    clearModel();
    resetAnimations([]);
  };

  const themeSubmenu = (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="cursor-pointer">
        <Palette className="h-4 w-4" />
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-48">
        {THEMES.map((t) => (
          <DropdownMenuItem key={t.name} onClick={() => setTheme(t.name)} className="cursor-pointer">
            <div className={cn("h-6 w-6 rounded", t.colors)} />
            <span>{t.label}</span>
            {theme === t.name && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );

  return (
    <>
      <motion.header
        initial={false}
        className="relative z-50 flex h-14 w-full flex-shrink-0 items-center gap-2 border-b border-border/40 bg-card/80 px-3 backdrop-blur-md sm:gap-4 sm:px-4"
      >
        <motion.div
          className="flex min-w-0 flex-shrink-0 items-center gap-2 sm:gap-3"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <motion.img
              src="/favicon.svg"
              alt="Animator"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              className="h-8 w-8 cursor-pointer"
            />
            <motion.h1
              className="cursor-pointer text-lg font-bold text-foreground lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              Anim
            </motion.h1>
            <motion.h1
              className="hidden cursor-pointer text-lg font-bold text-foreground lg:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              Animator
            </motion.h1>
          </div>
          {model && (
            <span className="hidden max-w-[10rem] truncate text-xs text-foreground/50 xl:inline">
              {model.sourceName}
            </span>
          )}
        </motion.div>

        <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          {error && <span className="mr-1 hidden max-w-[8rem] truncate text-xs text-danger md:inline">{error}</span>}

          <Button
            variant="outline"
            size="sm"
            className="gap-2 whitespace-nowrap"
            title="Undo (Ctrl+Z)"
            disabled={undoStack.length === 0}
            onClick={() => undo()}
          >
            <Undo2 className="h-4 w-4" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 whitespace-nowrap"
            title="Redo (Ctrl+Y)"
            disabled={redoStack.length === 0}
            onClick={() => redo()}
          >
            <Redo2 className="h-4 w-4" />
            <span className="hidden sm:inline">Redo</span>
          </Button>

          <input ref={inputRef} type="file" accept=".glb,.gltf,.fbx,.obj" className="hidden" onChange={handleInputChange} />

          <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap" onClick={openFile} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            <span className="hidden sm:inline">Open</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            className="gap-2 whitespace-nowrap"
            onClick={() => setExportOpen(true)}
            disabled={!model || isLoading}
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 whitespace-nowrap"
            onClick={() => setLibraryOpen(true)}
            disabled={isLoading}
            title="Browse animation library"
          >
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Library</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 whitespace-nowrap"
            onClick={() => setSceneInfoOpen(true)}
            disabled={!model || isLoading}
            title="Scene statistics and model details"
          >
            <Layers3 className="h-4 w-4" />
            <span className="hidden sm:inline">Scene</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
                <Palette className="h-4 w-4" />
                <span className="hidden md:inline">{currentTheme?.label}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {THEMES.map((t) => (
                <DropdownMenuItem key={t.name} onClick={() => setTheme(t.name)} className="cursor-pointer">
                  <div className={cn("h-6 w-6 rounded", t.colors)} />
                  <span>{t.label}</span>
                  {theme === t.name && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="lg:hidden">{themeSubmenu}</div>

              <AnimatePresence>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => void loadSampleRig()} disabled={isLoading}>
                    <Cuboid className="h-4 w-4" />
                    <span>Load Sample Rig</span>
                  </DropdownMenuItem>
                </motion.div>
                {model && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <DropdownMenuItem className="cursor-pointer" onClick={closeModel}>
                      <FileX2 className="h-4 w-4" />
                      <span>Close Model</span>
                    </DropdownMenuItem>
                  </motion.div>
                )}
              </AnimatePresence>

              <DropdownMenuSeparator />

              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setAboutOpen(true)}>
                    <Info className="h-4 w-4" />
                    <span>About</span>
                  </DropdownMenuItem>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setGuideOpen(true)}>
                    <BookOpen className="h-4 w-4" />
                    <span>Guide</span>
                  </DropdownMenuItem>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setShortcutsOpen(true)}>
                    <Keyboard className="h-4 w-4" />
                    <span>Keyboard Shortcuts</span>
                  </DropdownMenuItem>
                </motion.div>
              </AnimatePresence>

              <DropdownMenuSeparator />

              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => openLink(`${ROBOTICELA_SITE_URL}/support`)}
                  >
                    <LifeBuoy className="h-4 w-4" />
                    <span>Support</span>
                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-foreground/40" />
                  </DropdownMenuItem>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => openLink(`${ROBOTICELA_SITE_URL}/privacy`)}>
                    <Shield className="h-4 w-4" />
                    <span>Privacy Policy</span>
                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-foreground/40" />
                  </DropdownMenuItem>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => openLink(`${ROBOTICELA_SITE_URL}/terms`)}>
                    <Scale className="h-4 w-4" />
                    <span>Terms of Service</span>
                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-foreground/40" />
                  </DropdownMenuItem>
                </motion.div>
              </AnimatePresence>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      <AnimationLibraryModal isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <GuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      <SceneInfoModal isOpen={sceneInfoOpen} onClose={() => setSceneInfoOpen(false)} />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}
