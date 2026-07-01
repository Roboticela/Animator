"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface KeyboardSyncContextType {
  keyboardSyncEnabled: boolean;
  setKeyboardSyncEnabled: (enabled: boolean) => void;
}

const KeyboardSyncContext = createContext<KeyboardSyncContextType | undefined>(undefined);

export function KeyboardSyncProvider({ children }: { children: ReactNode }) {
  const [keyboardSyncEnabled, setKeyboardSyncEnabled] = useState(true); // Enabled by default

  return (
    <KeyboardSyncContext.Provider value={{ keyboardSyncEnabled, setKeyboardSyncEnabled }}>
      {children}
    </KeyboardSyncContext.Provider>
  );
}

export function useKeyboardSync() {
  const context = useContext(KeyboardSyncContext);
  if (context === undefined) {
    throw new Error("useKeyboardSync must be used within a KeyboardSyncProvider");
  }
  return context;
}

