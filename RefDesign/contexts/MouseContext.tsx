"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type VirtualMouseMover = (key: string) => void;

interface MouseContextType {
  mouseEnabled: boolean;
  setMouseEnabled: (enabled: boolean) => void;
  keyboardMouseEnabled: boolean;
  setKeyboardMouseEnabled: (enabled: boolean) => void;
  moveVirtualMouse: (key: string) => void;
  registerVirtualMouseMover: (fn: VirtualMouseMover | null) => void;
}

const MouseContext = createContext<MouseContextType | undefined>(undefined);

export function MouseProvider({ children }: { children: ReactNode }) {
  const [mouseEnabled, setMouseEnabled] = useState(false);
  const [keyboardMouseEnabled, setKeyboardMouseEnabledState] = useState(false);
  const virtualMouseMoverRef = useRef<VirtualMouseMover | null>(null);

  const registerVirtualMouseMover = useCallback((fn: VirtualMouseMover | null) => {
    virtualMouseMoverRef.current = fn;
  }, []);

  const moveVirtualMouse = useCallback((key: string) => {
    virtualMouseMoverRef.current?.(key);
  }, []);

  const setKeyboardMouseEnabled = useCallback((enabled: boolean) => {
    setKeyboardMouseEnabledState(enabled);
    if (enabled) setMouseEnabled(true);
  }, []);

  return (
    <MouseContext.Provider
      value={{
        mouseEnabled,
        setMouseEnabled,
        keyboardMouseEnabled,
        setKeyboardMouseEnabled,
        moveVirtualMouse,
        registerVirtualMouseMover,
      }}
    >
      {children}
    </MouseContext.Provider>
  );
}

export function useMouse() {
  const context = useContext(MouseContext);
  if (context === undefined) {
    throw new Error("useMouse must be used within a MouseProvider");
  }
  return context;
}
