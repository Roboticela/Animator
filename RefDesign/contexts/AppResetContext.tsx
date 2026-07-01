"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useHand } from '@/contexts/HandContext';
import { useFullscreen } from '@/contexts/FullscreenContext';
import { useMouse } from '@/contexts/MouseContext';
import { useArrow } from '@/contexts/ArrowContext';
import { useKeyboardView } from '@/contexts/KeyboardViewContext';
import { useKeyboardSync } from '@/contexts/KeyboardSyncContext';
import { useKeyboardType } from '@/contexts/KeyboardTypeContext';
import { useFnShortcut } from '@/contexts/FnShortcutContext';
import { useKeyboardLock } from '@/contexts/KeyboardLockContext';
import { useSystemState } from '@/contexts/SystemStateContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypingHands } from '@/contexts/TypingHandsContext';
import { useStatusControls } from '@/contexts/StatusControlsContext';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';
import {
  DEFAULT_KEYBOARD_SYNC,
  DEFAULT_KEYBOARD_TYPE,
  DEFAULT_THEME,
} from '@/lib/app-defaults';

interface AppResetContextType {
  resetAll: () => void;
  registerComponentReset: (callback: () => void) => () => void;
}

const AppResetContext = createContext<AppResetContextType | undefined>(undefined);

export function AppResetProvider({ children }: { children: ReactNode }) {
  const { setHandEnabled } = useHand();
  const { setFullscreenEnabled } = useFullscreen();
  const { setMouseEnabled, setKeyboardMouseEnabled } = useMouse();
  const { setArrowEnabled } = useArrow();
  const { resetView } = useKeyboardView();
  const { setKeyboardSyncEnabled } = useKeyboardSync();
  const { setKeyboardType } = useKeyboardType();
  const { setFnShortcutEnabled } = useFnShortcut();
  const { resetLocks } = useKeyboardLock();
  const { resetSystemState } = useSystemState();
  const { resetTheme } = useTheme();
  const { setTypingHandsEnabled } = useTypingHands();
  const { resetStatusControls } = useStatusControls();
  const { resetPreferences, setHydrating } = useAppPreferences();

  const [componentResetCallbacks] = useState(() => new Set<() => void>());
  const componentResetCallbacksRef = useRef(componentResetCallbacks);
  componentResetCallbacksRef.current = componentResetCallbacks;

  const registerComponentReset = useCallback((callback: () => void) => {
    componentResetCallbacksRef.current.add(callback);
    return () => {
      componentResetCallbacksRef.current.delete(callback);
    };
  }, []);

  const resetAll = useCallback(() => {
    setHydrating(true);

    setHandEnabled(false);
    setMouseEnabled(false);
    setKeyboardMouseEnabled(false);
    setArrowEnabled(false);
    setFullscreenEnabled(false);
    setFnShortcutEnabled(false);
    setKeyboardSyncEnabled(DEFAULT_KEYBOARD_SYNC);
    setTypingHandsEnabled(false);

    resetLocks();
    resetSystemState();
    resetTheme(DEFAULT_THEME);
    resetStatusControls();

    componentResetCallbacksRef.current.forEach((callback) => callback());

    setKeyboardType(DEFAULT_KEYBOARD_TYPE);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => resetView());
    });

    void resetPreferences().finally(() => {
      setHydrating(false);
    });
  }, [
    resetLocks,
    resetPreferences,
    resetStatusControls,
    resetSystemState,
    resetTheme,
    resetView,
    setArrowEnabled,
    setFnShortcutEnabled,
    setFullscreenEnabled,
    setHandEnabled,
    setHydrating,
    setKeyboardMouseEnabled,
    setKeyboardSyncEnabled,
    setKeyboardType,
    setMouseEnabled,
    setTypingHandsEnabled,
  ]);

  return (
    <AppResetContext.Provider value={{ resetAll, registerComponentReset }}>
      {children}
    </AppResetContext.Provider>
  );
}

export function useAppReset() {
  const context = useContext(AppResetContext);
  if (context === undefined) {
    throw new Error('useAppReset must be used within an AppResetProvider');
  }
  return context;
}
