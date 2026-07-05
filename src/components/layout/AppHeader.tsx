import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  Code2,
  Cuboid,
  ExternalLink,
  FileDown,
  FileUp,
  FileX2,
  Image,
  Info,
  Keyboard,
  Layers3,
  Library,
  LifeBuoy,
  Loader2,
  Menu,
  Paintbrush,
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
import { useImportReference } from "@/hooks/useImportReference";
import { openLink } from "@/lib/tauri";
import { GuideModal } from "@/components/modals/GuideModal";
import { AboutModal } from "@/components/modals/AboutModal";
import { AnimationLibraryModal } from "@/components/modals/AnimationLibraryModal";
import { ExportModal } from "@/components/modals/ExportModal";
import { SceneInfoModal } from "@/components/modals/SceneInfoModal";
import { ShortcutsModal } from "@/components/modals/ShortcutsModal";
import { HtmlTo3dModal } from "@/components/modals/HtmlTo3dModal";
import { cn } from "@/lib/utils";

const ROBOTICELA_SITE_URL = "https://roboticela.com";

const HEADER_BUTTON_IDS = [
  "undo",
  "redo",
  "materials",
  "open",
  "save",
  "export",
  "library",
  "html-to-3d",
  "import-reference",
  "scene",
  "theme",
] as const;

export function AppHeader() {
  const model = useModelStore((s) => s.model);
  const clearModel = useModelStore((s) => s.clearModel);
  const resetAnimations = useAnimationStore((s) => s.resetForNewModel);
  const undoStack = useAnimationStore((s) => s.undoStack);
  const redoStack = useAnimationStore((s) => s.redoStack);
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);
  const { theme, setTheme } = useTheme();
  const showMaterials = useModelStore((s) => s.showMaterials);
  const toggleShowMaterials = useModelStore((s) => s.toggleShowMaterials);
  const { openFile, saveProject, loadSampleRig, isLoading, error, inputRef, handleInputChange } = useOpenModel();
  const {
    inputRef: referenceInputRef,
    openReferenceFile,
    handleInputChange: handleReferenceInputChange,
  } = useImportReference();

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sceneInfoOpen, setSceneInfoOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [htmlTo3dOpen, setHtmlTo3dOpen] = useState(false);
  const [htmlReferenceOpen, setHtmlReferenceOpen] = useState(false);
  const [menuButtons, setMenuButtons] = useState<string[]>([]);

  const headerRef = useRef<HTMLElement>(null);
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLSpanElement>(null);

  const currentTheme = THEMES.find((t) => t.name === theme);

  const closeModel = () => {
    clearModel();
    resetAnimations([]);
  };

  const adjustVisibleButtons = useCallback(() => {
    if (!headerRef.current || !buttonsContainerRef.current) return;

    const headerWidth = headerRef.current.offsetWidth;
    const leftWidth = leftSectionRef.current?.offsetWidth ?? 200;
    const padding = 32;
    const sectionGap = 16;
    const gap = 8;
    const menuWidth = menuButtonRef.current?.offsetWidth ?? 80;
    const menuGap = 8;
    const errorWidth = errorRef.current?.offsetWidth ?? 0;
    const errorGap = errorWidth > 0 ? gap : 0;
    const available = headerWidth - leftWidth - menuWidth - padding - sectionGap - menuGap - errorWidth - errorGap;

    const container = buttonsContainerRef.current;
    const buttonEls = Array.from(container.children) as HTMLElement[];

    buttonEls.forEach((el, i) => {
      if (i < HEADER_BUTTON_IDS.length) el.style.display = "";
    });
    void container.offsetHeight;

    let total = 0;
    const widths: number[] = [];
    buttonEls.forEach((el, i) => {
      if (i >= HEADER_BUTTON_IDS.length) return;
      widths.push(el.offsetWidth);
      total += el.offsetWidth + (i > 0 ? gap : 0);
    });

    if (total <= available) {
      setMenuButtons([]);
      return;
    }

    let current = 0;
    const overflow: string[] = [];
    buttonEls.forEach((el, i) => {
      if (i >= HEADER_BUTTON_IDS.length) return;
      const id = HEADER_BUTTON_IDS[i];
      const w = widths[i] + (i > 0 ? gap : 0);
      if (current + w <= available) {
        current += w;
      } else {
        el.style.display = "none";
        overflow.push(id);
      }
    });
    setMenuButtons(overflow);
  }, []);

  useEffect(() => {
    const t = setTimeout(adjustVisibleButtons, 100);
    const onResize = () => setTimeout(adjustVisibleButtons, 100);
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [adjustVisibleButtons]);

  useEffect(() => {
    const t = setTimeout(adjustVisibleButtons, 100);
    return () => clearTimeout(t);
  }, [theme, showMaterials, model?.sourceName, isLoading, error, adjustVisibleButtons]);

  const themePickerItems = THEMES.map((t) => (
    <DropdownMenuItem key={t.name} onClick={() => setTheme(t.name)} className="cursor-pointer">
      <div className={cn("h-6 w-6 rounded", t.colors)} />
      <span>{t.label}</span>
      {theme === t.name && <span className="ml-auto text-primary">✓</span>}
    </DropdownMenuItem>
  ));

  return (
    <>
      <motion.header
        ref={headerRef}
        initial={false}
        className="relative z-50 flex h-14 w-full flex-shrink-0 items-center gap-2 overflow-hidden border-b border-border/40 bg-card/80 px-3 backdrop-blur-md sm:gap-4 sm:px-4"
      >
        <motion.div
          ref={leftSectionRef}
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

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
          {error && (
            <span ref={errorRef} className="mr-1 hidden max-w-[8rem] truncate text-xs text-danger md:inline">
              {error}
            </span>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".glb,.gltf,.fbx,.obj,.rcanim"
            className="hidden"
            onChange={handleInputChange}
          />
          <input
            ref={referenceInputRef}
            type="file"
            accept=".glb,.gltf,.fbx,.obj"
            className="hidden"
            onChange={handleReferenceInputChange}
          />

          <div ref={buttonsContainerRef} className="flex items-center gap-1.5 sm:gap-2">
            <div data-button-id="undo">
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
            </div>

            <div data-button-id="redo">
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
            </div>

            <div data-button-id="materials">
              <Button
                variant={showMaterials ? "default" : "outline"}
                size="sm"
                className="gap-2 whitespace-nowrap"
                onClick={() => toggleShowMaterials()}
                disabled={isLoading}
                title={
                  showMaterials
                    ? "Load & show materials, colors, and textures"
                    : "Load meshes only with flat shading"
                }
              >
                <Paintbrush className="h-4 w-4" />
                <span className="hidden lg:inline">{showMaterials ? "Materials" : "Meshes"}</span>
              </Button>
            </div>

            <div data-button-id="open">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 whitespace-nowrap"
                onClick={() => void openFile()}
                disabled={isLoading}
                title="Open model or .rcanim project"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                <span className="hidden sm:inline">Open</span>
              </Button>
            </div>

            <div data-button-id="save">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 whitespace-nowrap"
                onClick={() => void saveProject()}
                disabled={!model || isLoading}
                title="Save .rcanim project"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden lg:inline">Save Project</span>
              </Button>
            </div>

            <div data-button-id="export">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 whitespace-nowrap"
                onClick={() => setExportOpen(true)}
                disabled={!model || isLoading}
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>

            <div data-button-id="library">
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
            </div>

            <div data-button-id="html-to-3d">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 whitespace-nowrap"
                onClick={() => setHtmlTo3dOpen(true)}
                disabled={isLoading}
                title="HTML / CSS / JS to 3D"
              >
                <Code2 className="h-4 w-4" />
                <span className="hidden lg:inline">HTML → 3D</span>
              </Button>
            </div>

            <div data-button-id="import-reference">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="group gap-2 whitespace-nowrap"
                    disabled={isLoading}
                    title="Import viewport reference (not saved in project)"
                  >
                    <Image className="h-4 w-4" />
                    <span className="hidden lg:inline">Import Reference</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => void openReferenceFile()}>
                    <Cuboid className="h-4 w-4" />
                    <span>3D model reference</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setHtmlReferenceOpen(true)}>
                    <Code2 className="h-4 w-4" />
                    <span>HTML reference</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div data-button-id="scene">
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
            </div>

            <div data-button-id="theme">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="group gap-2 whitespace-nowrap">
                    <Palette className="h-4 w-4" />
                    <span className="hidden md:inline">{currentTheme?.label}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {themePickerItems}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div ref={menuButtonRef} className="flex items-center gap-1.5 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="group gap-2 whitespace-nowrap">
                  <Menu className="h-4 w-4" />
                  <span className="hidden sm:inline">Menu</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {menuButtons.length > 0 && (
                  <>
                    {menuButtons.includes("undo") && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={undoStack.length === 0}
                        onClick={() => undo()}
                      >
                        <Undo2 className="h-4 w-4" />
                        <span>Undo</span>
                      </DropdownMenuItem>
                    )}
                    {menuButtons.includes("redo") && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={redoStack.length === 0}
                        onClick={() => redo()}
                      >
                        <Redo2 className="h-4 w-4" />
                        <span>Redo</span>
                      </DropdownMenuItem>
                    )}
                    {menuButtons.includes("materials") && (
                      <DropdownMenuItem className="cursor-pointer" disabled={isLoading} onClick={() => toggleShowMaterials()}>
                        <Paintbrush className="h-4 w-4" />
                        <span>{showMaterials ? "Materials" : "Meshes"}</span>
                        {showMaterials && <span className="ml-auto text-primary">✓</span>}
                      </DropdownMenuItem>
                    )}
                    {menuButtons.includes("open") && (
                      <DropdownMenuItem className="cursor-pointer" disabled={isLoading} onClick={() => void openFile()}>
                        <FileUp className="h-4 w-4" />
                        <span>Open</span>
                      </DropdownMenuItem>
                    )}
                    {menuButtons.includes("save") && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={!model || isLoading}
                        onClick={() => void saveProject()}
                      >
                        <FileDown className="h-4 w-4" />
                        <span>Save Project</span>
                      </DropdownMenuItem>
                    )}
                    {menuButtons.includes("export") && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={!model || isLoading}
                        onClick={() => setExportOpen(true)}
                      >
                        <FileDown className="h-4 w-4" />
                        <span>Export</span>
                      </DropdownMenuItem>
                    )}
                    {menuButtons.includes("library") && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={isLoading}
                        onClick={() => setLibraryOpen(true)}
                      >
                        <Library className="h-4 w-4" />
                        <span>Library</span>
                      </DropdownMenuItem>
                    )}
                    {menuButtons.includes("html-to-3d") && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={isLoading}
                        onClick={() => setHtmlTo3dOpen(true)}
                      >
                        <Code2 className="h-4 w-4" />
                        <span>HTML → 3D</span>
                      </DropdownMenuItem>
                    )}
                    {menuButtons.includes("import-reference") && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer">
                          <Image className="h-4 w-4" />
                          <span>Import Reference</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-52">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => void openReferenceFile()}>
                            <Cuboid className="h-4 w-4" />
                            <span>3D model reference</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => setHtmlReferenceOpen(true)}>
                            <Code2 className="h-4 w-4" />
                            <span>HTML reference</span>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                    {menuButtons.includes("scene") && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={!model || isLoading}
                        onClick={() => setSceneInfoOpen(true)}
                      >
                        <Layers3 className="h-4 w-4" />
                        <span>Scene</span>
                      </DropdownMenuItem>
                    )}
                    {menuButtons.includes("theme") && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer">
                          <Palette className="h-4 w-4" />
                          <span>Theme</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">{themePickerItems}</DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}

                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => void loadSampleRig()} disabled={isLoading}>
                      <Cuboid className="h-4 w-4" />
                      <span>Load Demo Model</span>
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
                      <span>Shortcuts</span>
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
        </div>
      </motion.header>

      <AnimationLibraryModal isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <GuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      <SceneInfoModal isOpen={sceneInfoOpen} onClose={() => setSceneInfoOpen(false)} />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <HtmlTo3dModal isOpen={htmlTo3dOpen} onClose={() => setHtmlTo3dOpen(false)} />
      <HtmlTo3dModal
        isOpen={htmlReferenceOpen}
        onClose={() => setHtmlReferenceOpen(false)}
        mode="reference"
      />
    </>
  );
}
