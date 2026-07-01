"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  DEFAULT_KEYBOARD_TYPE,
  type KeyboardType,
} from "@/lib/keyboard-types";

export type { KeyboardType };

interface KeyboardTypeContextType {
  keyboardType: KeyboardType;
  setKeyboardType: (type: KeyboardType) => void;
}

const KeyboardTypeContext = createContext<KeyboardTypeContextType | undefined>(undefined);

export function KeyboardTypeProvider({ children }: { children: ReactNode }) {
  const [keyboardType, setKeyboardTypeState] = useState<KeyboardType>(DEFAULT_KEYBOARD_TYPE);

  const setKeyboardType = (type: KeyboardType) => {
    setKeyboardTypeState(type);
  };

  return (
    <KeyboardTypeContext.Provider value={{ keyboardType, setKeyboardType }}>
      {children}
    </KeyboardTypeContext.Provider>
  );
}

export function useKeyboardType() {
  const context = useContext(KeyboardTypeContext);
  if (context === undefined) {
    throw new Error("useKeyboardType must be used within a KeyboardTypeProvider");
  }
  return context;
}
