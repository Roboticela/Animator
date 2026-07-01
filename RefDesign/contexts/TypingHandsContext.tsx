"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface TypingHandsContextType {
  typingHandsEnabled: boolean;
  setTypingHandsEnabled: (enabled: boolean) => void;
}

const TypingHandsContext = createContext<TypingHandsContextType | undefined>(undefined);

export function TypingHandsProvider({ children }: { children: ReactNode }) {
  const [typingHandsEnabled, setTypingHandsEnabled] = useState(false);

  return (
    <TypingHandsContext.Provider value={{ typingHandsEnabled, setTypingHandsEnabled }}>
      {children}
    </TypingHandsContext.Provider>
  );
}

export function useTypingHands() {
  const context = useContext(TypingHandsContext);
  if (context === undefined) {
    throw new Error("useTypingHands must be used within a TypingHandsProvider");
  }
  return context;
}
