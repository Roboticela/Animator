"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SystemStateContextType {
  flightMode: boolean;
  setFlightMode: (enabled: boolean) => void;
  toggleFlightMode: () => void;
  resetSystemState: () => void;
}

const SystemStateContext = createContext<SystemStateContextType | undefined>(undefined);

export function SystemStateProvider({ children }: { children: ReactNode }) {
  const [flightMode, setFlightMode] = useState(false);

  const toggleFlightMode = () => setFlightMode(prev => !prev);
  const resetSystemState = () => setFlightMode(false);

  return (
    <SystemStateContext.Provider
      value={{
        flightMode,
        setFlightMode,
        toggleFlightMode,
        resetSystemState,
      }}
    >
      {children}
    </SystemStateContext.Provider>
  );
}

export function useSystemState() {
  const context = useContext(SystemStateContext);
  if (context === undefined) {
    throw new Error("useSystemState must be used within a SystemStateProvider");
  }
  return context;
}

