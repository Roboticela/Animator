"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface FullscreenContextType {
  fullscreenEnabled: boolean;
  setFullscreenEnabled: (enabled: boolean) => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [fullscreenEnabled, setFullscreenEnabled] = useState(false);

  return (
    <FullscreenContext.Provider value={{ fullscreenEnabled, setFullscreenEnabled }}>
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen() {
  const context = useContext(FullscreenContext);
  if (context === undefined) {
    throw new Error("useFullscreen must be used within a FullscreenProvider");
  }
  return context;
}

