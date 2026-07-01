"use client";

import { useTheme, type ThemeName } from "@/contexts/ThemeContext";
import { useHand } from "@/contexts/HandContext";
import { useFullscreen } from "@/contexts/FullscreenContext";
import { useMouse } from "@/contexts/MouseContext";
import { useArrow } from "@/contexts/ArrowContext";
import { useKeyboardView } from "@/contexts/KeyboardViewContext";
import { useKeyboardSync } from "@/contexts/KeyboardSyncContext";
import { useKeyboardType } from "@/contexts/KeyboardTypeContext";
import { useFnShortcut } from "@/contexts/FnShortcutContext";
import { useTypingHands } from "@/contexts/TypingHandsContext";
import { useAppReset } from "@/contexts/AppResetContext";
import StoryModal from "@/components/StoryModal";
import AboutModal from "@/components/AboutModal";
import LicenseModal from "@/components/LicenseModal";
import GuideModal from "@/components/GuideModal";
import { 
  Keyboard, 
  Palette, 
  MousePointer2,
  SquareMousePointer, 
  Hand, 
  Maximize, 
  Scroll, 
  Menu,
  ChevronDown,
  BookOpen,
  Info,
  Code2,
  FileText,
  Shield,
  Scale,
  Type,
  RotateCcw,
  RefreshCw,
  Link,
  Link2Off,
  ExternalLink,
  LifeBuoy,
  BookMarked,
  Gamepad2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

const themes: { name: ThemeName; label: string; colors: string }[] = [
  { name: "navy", label: "Navy", colors: "bg-blue-900" },
  { name: "dark", label: "Dark", colors: "bg-gray-900" },
  { name: "light", label: "Light", colors: "bg-gray-100" },
  { name: "sunset", label: "Sunset", colors: "bg-orange-500" },
  { name: "ocean", label: "Ocean", colors: "bg-cyan-500" },
  { name: "forest", label: "Forest", colors: "bg-green-700" },
  { name: "purple", label: "Purple Dream", colors: "bg-purple-600" },
  { name: "midnight", label: "Midnight", colors: "bg-indigo-900" },
];

const ROBOTICELA_SITE_URL = "https://roboticela.com";

const keyboards = [
  { value: "pc", label: "PC (Full-size)", keyboardType: "pc" as const },
  { value: "asus-ux370uar", label: "Asus UX370UAR", keyboardType: "asus-ux370uar" as const },
  { value: "dell-latitude-5300-2-in-1", label: "Dell Latitude 5300", keyboardType: "dell-latitude-5300-2-in-1" as const },
  { value: "dell-latitude-e7270", label: "Dell Latitude E7270", keyboardType: "dell-latitude-e7270" as const },
  { value: "hp-elitebook-820-g4", label: "HP EliteBook 820 G4", keyboardType: "hp-elitebook-820-g4" as const },
  { value: "toshiba-portege-x30-e", label: "Toshiba Portege X30 E", keyboardType: "toshiba-portege-x30-e" as const },
];

// Helper function to open links in both web and Tauri environments
async function openLink(url: string) {
  if (!url) {
    console.warn('openLink called with empty URL');
    return;
  }

  // If URL is relative (starts with /), construct full URL using site URL from env
  let fullUrl = url;
  if (url.startsWith('/')) {
    const siteUrl = import.meta.env.VITE_SITE_URL || '';
    if (siteUrl) {
      // Remove trailing slash from siteUrl if present, then add the path
      const baseUrl = siteUrl.replace(/\/$/, '');
      fullUrl = `${baseUrl}${url}`;
    } else {
      console.warn('VITE_SITE_URL not set, cannot construct full URL for:', url);
      return;
    }
  }

  try {
    // Check if we're running in Tauri v2
    // In Tauri v2, we check for __TAURI_INTERNALS__ or __TAURI_METADATA__
    const hasTauriInternals = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    const hasTauriMetadata = typeof window !== 'undefined' && '__TAURI_METADATA__' in window;
    const hasTauriLegacy = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
    const isTauri = hasTauriInternals || hasTauriMetadata || hasTauriLegacy;
    
    if (isTauri) {
      // Dynamically import Tauri opener plugin
      const opener = await import('@tauri-apps/plugin-opener');
      await opener.openUrl(fullUrl);
      return;
    }
  } catch (error) {
    // If Tauri detection or import fails, fallback to window.open
    console.error('Failed to open link with Tauri:', error);
  }
  
  // Fallback to window.open for web or if Tauri fails
  if (typeof window !== 'undefined') {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }
}


interface HeaderButton {
  id: string;
  type: "dropdown" | "toggle" | "button";
  label: string;
  icon?: React.ReactNode;
  component: React.ReactNode;
}

export default function AppHeader() {
  const { theme, setTheme } = useTheme();
  const { handEnabled, setHandEnabled } = useHand();
  const { fullscreenEnabled, setFullscreenEnabled } = useFullscreen();
  const { mouseEnabled, setMouseEnabled, keyboardMouseEnabled, setKeyboardMouseEnabled } = useMouse();
  const { arrowEnabled, setArrowEnabled } = useArrow();
  const { resetView } = useKeyboardView();
  const { resetAll: resetApp } = useAppReset();
  const { keyboardSyncEnabled, setKeyboardSyncEnabled } = useKeyboardSync();
  const { keyboardType, setKeyboardType } = useKeyboardType();
  const { fnShortcutEnabled, setFnShortcutEnabled } = useFnShortcut();
  const { typingHandsEnabled, setTypingHandsEnabled } = useTypingHands();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnGamesPage = location.pathname.startsWith('/games');
  
  const currentKeyboardLabel = keyboards.find(k => k.keyboardType === keyboardType)?.label || "PC (Full-size)";
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [, setVisibleButtons] = useState<string[]>([]);
  const [menuButtons, setMenuButtons] = useState<string[]>([]);
  
  const headerRef = useRef<HTMLElement>(null);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLDivElement>(null);
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const currentTheme = themes.find(t => t.name === theme);

  const resetAll = () => {
    resetApp();
  };

  const allButtons: HeaderButton[] = [
    {
      id: "keyboard",
      type: "dropdown",
      label: currentKeyboardLabel,
      component: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap">
                <Keyboard className="w-4 h-4" />
                <span className="hidden lg:inline">
                  {currentKeyboardLabel}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <AnimatePresence>
              {keyboards.map((kb, index) => (
                <motion.div
                  key={kb.value}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <DropdownMenuItem
                    onClick={() => setKeyboardType(kb.keyboardType)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <span>{kb.label}</span>
                    {keyboardType === kb.keyboardType && <span className="ml-auto text-primary">✓</span>}
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      id: "theme",
      type: "button",
      label: currentTheme?.label || "Theme",
      icon: <Palette className="w-4 h-4" />,
      component: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap">
                <Palette className="w-4 h-4" />
                <span className="hidden lg:inline">{currentTheme?.label}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <AnimatePresence>
              {themes.map((t, index) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <DropdownMenuItem
                    onClick={() => setTheme(t.name)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className={cn("w-6 h-6 rounded", t.colors)}></div>
                    <span>{t.label}</span>
                    {theme === t.name && <span className="ml-auto text-primary">✓</span>}
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      id: "fn-shortcut",
      type: "toggle",
      label: "Fn Shortcut",
      icon: (
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="16" width="16" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
          <path d="M420 192h-68v-80a96 96 0 1 0-192 0v80H92a12 12 0 0 0-12 12v280a12 12 0 0 0 12 12h328a12 12 0 0 0 12-12V204a12 12 0 0 0-12-12zm-106 0H198v-80.75a58 58 0 1 1 116 0z"></path>
        </svg>
      ),
      component: (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Button
            variant={fnShortcutEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setFnShortcutEnabled(!fnShortcutEnabled)}
            className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
          >
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="16" width="16" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
              <path d="M420 192h-68v-80a96 96 0 1 0-192 0v80H92a12 12 0 0 0-12 12v280a12 12 0 0 0 12 12h328a12 12 0 0 0 12-12V204a12 12 0 0 0-12-12zm-106 0H198v-80.75a58 58 0 1 1 116 0z"></path>
            </svg>
            <span className="hidden lg:inline">Fn Shortcut</span>
          </Button>
        </motion.div>
      ),
    },
    {
      id: "typing-hands",
      type: "toggle",
      label: "Typing Hands",
      icon: <Type className="w-4 h-4" />,
      component: (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Button
            variant={typingHandsEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setTypingHandsEnabled(!typingHandsEnabled)}
            className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
          >
            <Type className="w-4 h-4" />
            <span className="hidden lg:inline">Typing Hands</span>
          </Button>
        </motion.div>
      ),
    },
    {
      id: "mouse",
      type: "toggle",
      label: "Mouse",
      icon: <MousePointer2 className="w-4 h-4" />,
      component: (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Button
            variant={mouseEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setMouseEnabled(!mouseEnabled)}
            className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
          >
            <MousePointer2 className="w-4 h-4" />
            <span className="hidden lg:inline">Mouse</span>
          </Button>
        </motion.div>
      ),
    },
    {
      id: "keyboard-mouse",
      type: "toggle",
      label: "Key Mouse",
      icon: <SquareMousePointer className="w-4 h-4" />,
      component: (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Button
            variant={keyboardMouseEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setKeyboardMouseEnabled(!keyboardMouseEnabled)}
            className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
          >
            <SquareMousePointer className="w-4 h-4" />
            <span className="hidden lg:inline">Key Mouse</span>
          </Button>
        </motion.div>
      ),
    },
    {
      id: "hand",
      type: "toggle",
      label: "Hand",
      icon: <Hand className="w-4 h-4" />,
      component: (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Button
            variant={handEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setHandEnabled(!handEnabled)}
            className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
          >
            <Hand className="w-4 h-4" />
            <span className="hidden lg:inline">Hand</span>
          </Button>
        </motion.div>
      ),
    },
    {
      id: "fullscreen",
      type: "toggle",
      label: "Fullscreen",
      icon: <Maximize className="w-4 h-4" />,
      component: (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Button
            variant={fullscreenEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setFullscreenEnabled(!fullscreenEnabled)}
            className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
          >
            <Maximize className="w-4 h-4" />
            <span className="hidden lg:inline">Fullscreen</span>
          </Button>
        </motion.div>
      ),
    },
    {
      id: "key-scroll",
      type: "toggle",
      label: "Key Scroll",
      icon: <Scroll className="w-4 h-4" />,
      component: (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Button
            variant={arrowEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setArrowEnabled(!arrowEnabled)}
            className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
          >
            <Scroll className="w-4 h-4" />
            <span className="hidden lg:inline">Key Scroll</span>
          </Button>
        </motion.div>
      ),
    },
    {
      id: "keyboard-sync",
      type: "toggle",
      label: "Keyboard Sync",
      icon: keyboardSyncEnabled ? <Link className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />,
      component: (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Button
            variant={keyboardSyncEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setKeyboardSyncEnabled(!keyboardSyncEnabled)}
            className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
          >
            {keyboardSyncEnabled ? <Link className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
            <span className="hidden lg:inline">Keyboard Sync</span>
          </Button>
        </motion.div>
      ),
    },
    {
      id: "reset-view",
      type: "button",
      label: "Reset View",
      icon: <RotateCcw className="w-4 h-4" />,
      component: (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetView()}
            className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden lg:inline">Reset View</span>
          </Button>
        </motion.div>
      ),
    },
    {
      id: "reset",
      type: "button",
      label: "Reset",
      icon: <RefreshCw className="w-4 h-4" />,
      component: (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetAll()}
            className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden lg:inline">Reset</span>
          </Button>
        </motion.div>
      ),
    },
  ];

  const allButtonIds = useMemo(() => 
    ["keyboard", "theme", "fn-shortcut", "typing-hands", "mouse", "keyboard-mouse", "hand", "fullscreen", "key-scroll", "keyboard-sync", "reset-view", "reset"],
    []
  );

  const adjustVisibleButtons = useCallback(() => {
    if (!headerRef.current || !buttonsContainerRef.current) return;

    const headerWidth = headerRef.current.offsetWidth;
    const leftSectionWidth = leftSectionRef.current?.offsetWidth || 200; // Measure actual width
    const padding = 32; // Padding on both sides (16px each)
    const sectionGap = 16; // Gap between left section and buttons (gap-4 = 16px)
    const gap = 8; // Gap between buttons
    
    // Always reserve space for menu button (it's always visible now)
    const menuButtonWidth = menuButtonRef.current?.offsetWidth || 80;
    const menuButtonGap = 8; // Gap before menu button
    let availableWidth = headerWidth - leftSectionWidth - menuButtonWidth - padding - sectionGap - menuButtonGap;

    const buttonElements = Array.from(buttonsContainerRef.current.children) as HTMLElement[];

    // Reset all buttons to visible first to measure them
    buttonElements.forEach((el, index) => {
      if (el && index < allButtonIds.length) {
        el.style.display = '';
      }
    });

    // Force a reflow to ensure measurements are accurate
    void buttonsContainerRef.current.offsetHeight;

    // Measure total width of all buttons
    let totalButtonsWidth = 0;
    const buttonWidths: number[] = [];
    
    buttonElements.forEach((el, index) => {
      if (index < allButtonIds.length && el) {
        const width = el.offsetWidth;
        buttonWidths.push(width);
        totalButtonsWidth += width + (index > 0 ? gap : 0);
      }
    });

    // If all buttons fit, show them all
    if (totalButtonsWidth <= availableWidth) {
      setVisibleButtons(allButtonIds);
      setMenuButtons([]);
      return;
    }

    // Calculate which buttons fit
    let currentWidth = 0;
    const newVisibleButtons: string[] = [];
    const newMenuButtons: string[] = [];

    buttonElements.forEach((el, index) => {
      if (index >= allButtonIds.length) return;
      
      const buttonId = allButtonIds[index];
      const buttonWidth = buttonWidths[index] + (index > 0 ? gap : 0);

      if (currentWidth + buttonWidth <= availableWidth) {
        currentWidth += buttonWidth;
        newVisibleButtons.push(buttonId);
      } else {
        el.style.display = 'none';
        newMenuButtons.push(buttonId);
      }
    });

    setVisibleButtons(newVisibleButtons);
    setMenuButtons(newMenuButtons);
  }, [allButtonIds]);

  useEffect(() => {
    // Initial adjustment
    const timer = setTimeout(() => adjustVisibleButtons(), 100);

    const handleResize = () => {
      setTimeout(() => adjustVisibleButtons(), 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [adjustVisibleButtons]);

  useEffect(() => {
    // Re-adjust when button states change
    const timer = setTimeout(() => adjustVisibleButtons(), 100);
    return () => clearTimeout(timer);
  }, [mouseEnabled, keyboardMouseEnabled, handEnabled, typingHandsEnabled, fullscreenEnabled, arrowEnabled, keyboardSyncEnabled, keyboardType, fnShortcutEnabled, theme, adjustVisibleButtons]);

  const menuButtonItems = allButtons.filter(btn => menuButtons.includes(btn.id));

  return (
    <motion.header 
      ref={headerRef}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-40 w-full h-14 border-b border-border/40 bg-card/40 backdrop-blur-md flex items-center px-4 gap-4 overflow-hidden"
    >
      <motion.div 
        ref={leftSectionRef} 
        className="flex items-center gap-3 flex-shrink-0"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <motion.img
            src="/favicon.svg"
            alt="Keyboard Simulator"
            onClick={() => navigate('/')}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-8 h-8 cursor-pointer"
          />
          <motion.h1 
            className="text-lg font-bold text-foreground lg:hidden cursor-pointer"
            onClick={() => navigate('/')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            KbS
          </motion.h1>
          <motion.h1 
            className="text-lg font-bold text-foreground hidden lg:block cursor-pointer"
            onClick={() => navigate('/')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            Keyboard Simulator
          </motion.h1>
        </div>

      </motion.div>

      <motion.div 
        className="flex items-center gap-2 flex-1 justify-end min-w-0 ml-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div ref={buttonsContainerRef} className="flex items-center gap-2">
          {allButtons.map((button, index) => (
            <motion.div
              key={button.id}
              ref={(el) => {
                if (el) {
                  buttonRefs.current.set(button.id, el);
                }
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
            >
              {button.component}
            </motion.div>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div ref={menuButtonRef}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl h-10 px-4 whitespace-nowrap"
                >
                  <Menu className="w-4 h-4" />
                  <span className="hidden lg:inline">Menu</span>
                </Button>
              </motion.div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            {menuButtonItems.length > 0 && (
              <>
                <AnimatePresence>
                  {menuButtonItems.map((button, btnIndex) => {
                    if (button.type === "dropdown" && button.id === "keyboard") {
                      return (
                        <motion.div
                          key={button.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2, delay: btnIndex * 0.05 }}
                        >
                          <DropdownMenuItem className="flex items-center gap-3 cursor-pointer" hasSubmenu={true}>
                            <Keyboard className="w-4 h-4" />
                            <span>Keyboard</span>
                            <DropdownMenuSub>
                              <DropdownMenuSubContent className="w-48 rounded-xl">
                                <AnimatePresence>
                                  {keyboards.map((kb, kbIndex) => (
                                    <motion.div
                                      key={kb.value}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -10 }}
                                      transition={{ duration: 0.2, delay: kbIndex * 0.05 }}
                                    >
                                      <DropdownMenuItem
                                        onClick={() => setKeyboardType(kb.keyboardType)}
                                        className="flex items-center gap-3 cursor-pointer"
                                      >
                                        <span>{kb.label}</span>
                                        {keyboardType === kb.keyboardType && <span className="ml-auto text-primary">✓</span>}
                                      </DropdownMenuItem>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </DropdownMenuItem>
                        </motion.div>
                      );
                    }
                    if ((button.type === "dropdown" || button.type === "button") && button.id === "theme") {
                      return (
                        <motion.div
                          key={button.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2, delay: btnIndex * 0.05 }}
                        >
                          <DropdownMenuItem className="flex items-center gap-3 cursor-pointer" hasSubmenu={true}>
                            <Palette className="w-4 h-4" />
                            <span>Theme</span>
                            <DropdownMenuSub>
                              <DropdownMenuSubContent className="w-48 rounded-xl">
                                <AnimatePresence>
                                  {themes.map((t, themeIndex) => (
                                    <motion.div
                                      key={t.name}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -10 }}
                                      transition={{ duration: 0.2, delay: themeIndex * 0.05 }}
                                    >
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setTheme(t.name);
                                        }}
                                        className="flex items-center gap-3 cursor-pointer"
                                      >
                                        <div className={cn("w-6 h-6 rounded", t.colors)}></div>
                                        <span>{t.label}</span>
                                        {theme === t.name && <span className="ml-auto text-primary">✓</span>}
                                      </DropdownMenuItem>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </DropdownMenuItem>
                        </motion.div>
                      );
                    }
                    return (
                      <motion.div
                        key={button.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: btnIndex * 0.05 }}
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            if (button.id === "mouse") setMouseEnabled(!mouseEnabled);
                            else if (button.id === "keyboard-mouse") setKeyboardMouseEnabled(!keyboardMouseEnabled);
                            else if (button.id === "hand") setHandEnabled(!handEnabled);
                            else if (button.id === "typing-hands") setTypingHandsEnabled(!typingHandsEnabled);
                            else if (button.id === "fn-shortcut") setFnShortcutEnabled(!fnShortcutEnabled);
                            else if (button.id === "fullscreen") setFullscreenEnabled(!fullscreenEnabled);
                            else if (button.id === "key-scroll") setArrowEnabled(!arrowEnabled);
                            else if (button.id === "keyboard-sync") setKeyboardSyncEnabled(!keyboardSyncEnabled);
                            else if (button.id === "reset-view") resetView();
                            else if (button.id === "reset") resetAll();
                          }}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          {button.icon}
                          <span>{button.label}</span>
                          {(button.id === "mouse" && mouseEnabled) ||
                           (button.id === "keyboard-mouse" && keyboardMouseEnabled) ||
                           (button.id === "hand" && handEnabled) ||
                           (button.id === "typing-hands" && typingHandsEnabled) ||
                           (button.id === "fn-shortcut" && fnShortcutEnabled) ||
                           (button.id === "fullscreen" && fullscreenEnabled) ||
                           (button.id === "key-scroll" && arrowEnabled) ||
                           (button.id === "keyboard-sync" && keyboardSyncEnabled) ? (
                            <span className="ml-auto text-primary">✓</span>
                          ) : null}
                        </DropdownMenuItem>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div className="h-px bg-border my-1" />
              </>
            )}
            <AnimatePresence>
              <motion.div
                key="games"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DropdownMenuItem
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate('/games')}
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Games</span>
                  {isOnGamesPage && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              </motion.div>
              <motion.div
                key="story"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <DropdownMenuItem 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setStoryModalOpen(true)}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Story</span>
                </DropdownMenuItem>
              </motion.div>
              <motion.div
                key="about"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <DropdownMenuItem 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setAboutModalOpen(true)}
                >
                  <Info className="w-4 h-4" />
                  <span>About</span>
                </DropdownMenuItem>
              </motion.div>
              <motion.div
                key="github"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <DropdownMenuItem 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={async () => {
                    const isDesktopApp = import.meta.env.VITE_NEXT_DESKTOP_APP === 'true' || 
                                        import.meta.env.VITE_NEXT_PUBLIC_NEXT_DESKTOP_APP === 'true';
                    const appType = isDesktopApp ? 'DesktopApplication' : 'WebApplication';
                    const githubUrl = `https://github.com/Roboticela/KeyboardSimulator-${appType}`;
                    await openLink(githubUrl);
                  }}
                >
                  <Code2 className="w-4 h-4" />
                  <span>Github</span>
                </DropdownMenuItem>
              </motion.div>
              <motion.div
                key="license"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.15 }}
              >
                <DropdownMenuItem 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setLicenseModalOpen(true)}
                >
                  <FileText className="w-4 h-4" />
                  <span>License</span>
                </DropdownMenuItem>
              </motion.div>
              <motion.div
                key="guide"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <DropdownMenuItem
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setGuideModalOpen(true)}
                >
                  <BookMarked className="w-4 h-4" />
                  <span>Guide</span>
                </DropdownMenuItem>
              </motion.div>
            </AnimatePresence>
            <div className="h-px bg-border my-1" />
            <AnimatePresence>
              <motion.div
                key="support"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.25 }}
              >
                <DropdownMenuItem
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => openLink(`${ROBOTICELA_SITE_URL}/support/keyboard-simulator`)}
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Support</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                </DropdownMenuItem>
              </motion.div>
              <motion.div
                key="privacy-policy"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.3 }}
              >
                <DropdownMenuItem
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => openLink(`${ROBOTICELA_SITE_URL}/privacy`)}
                >
                  <Shield className="w-4 h-4" />
                  <span>Privacy Policy</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                </DropdownMenuItem>
              </motion.div>
              <motion.div
                key="terms-of-service"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.35 }}
              >
                <DropdownMenuItem
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => openLink(`${ROBOTICELA_SITE_URL}/terms`)}
                >
                  <Scale className="w-4 h-4" />
                  <span>Terms of Service</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                </DropdownMenuItem>
              </motion.div>
            </AnimatePresence>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Story Modal */}
      <StoryModal isOpen={storyModalOpen} onClose={() => setStoryModalOpen(false)} />
      
      {/* About Modal */}
      <AboutModal isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />
      
      {/* License Modal */}
      <LicenseModal isOpen={licenseModalOpen} onClose={() => setLicenseModalOpen(false)} />

      {/* Guide Modal */}
      <GuideModal isOpen={guideModalOpen} onClose={() => setGuideModalOpen(false)} />
    </motion.header>
  );
}

