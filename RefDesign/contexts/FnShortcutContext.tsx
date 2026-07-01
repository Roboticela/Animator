"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface FnShortcutContextType {
  fnShortcutEnabled: boolean;
  setFnShortcutEnabled: (enabled: boolean) => void;
}

const FnShortcutContext = createContext<FnShortcutContextType | undefined>(undefined);

export function FnShortcutProvider({ children }: { children: ReactNode }) {
  const [fnShortcutEnabled, setFnShortcutEnabled] = useState(false);

  return (
    <FnShortcutContext.Provider value={{ fnShortcutEnabled, setFnShortcutEnabled }}>
      {children}
    </FnShortcutContext.Provider>
  );
}

export function useFnShortcut() {
  const context = useContext(FnShortcutContext);
  if (context === undefined) {
    throw new Error("useFnShortcut must be used within a FnShortcutProvider");
  }
  return context;
}

