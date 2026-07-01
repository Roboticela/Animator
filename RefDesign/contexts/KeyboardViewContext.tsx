"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { KeyboardViewPreferences } from "@/lib/app-preferences";

interface KeyboardViewHandlers {
  getViewState: () => KeyboardViewPreferences | null;
  applyViewState: (state: KeyboardViewPreferences) => void;
}

interface KeyboardViewContextType {
  resetView: () => void;
  registerResetCallback: (callback: () => void) => () => void;
  registerViewHandlers: (handlers: KeyboardViewHandlers) => () => void;
  getSavedViewState: () => KeyboardViewPreferences | null;
  applySavedViewState: (state: KeyboardViewPreferences) => void;
  viewRevision: number;
  notifyViewChanged: () => void;
}

const KeyboardViewContext = createContext<KeyboardViewContextType | undefined>(undefined);

export function KeyboardViewProvider({ children }: { children: ReactNode }) {
  const resetCallbacksRef = useRef<Set<() => void>>(new Set());
  const viewHandlersRef = useRef<KeyboardViewHandlers | null>(null);
  const [viewRevision, setViewRevision] = useState(0);

  const registerResetCallback = useCallback((callback: () => void) => {
    resetCallbacksRef.current.add(callback);
    return () => {
      resetCallbacksRef.current.delete(callback);
    };
  }, []);

  const registerViewHandlers = useCallback((handlers: KeyboardViewHandlers) => {
    viewHandlersRef.current = handlers;
    return () => {
      if (viewHandlersRef.current === handlers) {
        viewHandlersRef.current = null;
      }
    };
  }, []);

  const resetView = useCallback(() => {
    resetCallbacksRef.current.forEach((callback) => callback());
  }, []);

  const getSavedViewState = useCallback(() => viewHandlersRef.current?.getViewState() ?? null, []);

  const applySavedViewState = useCallback((state: KeyboardViewPreferences) => {
    viewHandlersRef.current?.applyViewState(state);
  }, []);

  const notifyViewChanged = useCallback(() => {
    setViewRevision((revision) => revision + 1);
  }, []);

  const value = useMemo(
    () => ({
      resetView,
      registerResetCallback,
      registerViewHandlers,
      getSavedViewState,
      applySavedViewState,
      viewRevision,
      notifyViewChanged,
    }),
    [
      applySavedViewState,
      getSavedViewState,
      notifyViewChanged,
      registerResetCallback,
      registerViewHandlers,
      resetView,
      viewRevision,
    ],
  );

  return (
    <KeyboardViewContext.Provider value={value}>
      {children}
    </KeyboardViewContext.Provider>
  );
}

export function useKeyboardView() {
  const context = useContext(KeyboardViewContext);
  if (context === undefined) {
    throw new Error("useKeyboardView must be used within a KeyboardViewProvider");
  }
  return context;
}
