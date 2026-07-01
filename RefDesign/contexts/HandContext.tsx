"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface HandContextType {
  handEnabled: boolean;
  setHandEnabled: (enabled: boolean) => void;
}

const HandContext = createContext<HandContextType | undefined>(undefined);

export function HandProvider({ children }: { children: ReactNode }) {
  const [handEnabled, setHandEnabled] = useState(false);

  return (
    <HandContext.Provider value={{ handEnabled, setHandEnabled }}>
      {children}
    </HandContext.Provider>
  );
}

export function useHand() {
  const context = useContext(HandContext);
  if (context === undefined) {
    throw new Error("useHand must be used within a HandProvider");
  }
  return context;
}

