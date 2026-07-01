"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ArrowContextType {
  arrowEnabled: boolean;
  setArrowEnabled: (enabled: boolean) => void;
}

const ArrowContext = createContext<ArrowContextType | undefined>(undefined);

export function ArrowProvider({ children }: { children: ReactNode }) {
  const [arrowEnabled, setArrowEnabled] = useState(false);

  return (
    <ArrowContext.Provider value={{ arrowEnabled, setArrowEnabled }}>
      {children}
    </ArrowContext.Provider>
  );
}

export function useArrow() {
  const context = useContext(ArrowContext);
  if (context === undefined) {
    throw new Error("useArrow must be used within an ArrowProvider");
  }
  return context;
}

