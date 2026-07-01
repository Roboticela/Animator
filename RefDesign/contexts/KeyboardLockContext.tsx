"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface KeyboardLockContextType {
  capsLock: boolean;
  setCapsLock: (enabled: boolean) => void;
  numLock: boolean;
  setNumLock: (enabled: boolean) => void;
  scrollLock: boolean;
  setScrollLock: (enabled: boolean) => void;
  fnLock: boolean;
  setFnLock: (enabled: boolean) => void;
  fnHold: boolean;
  setFnHold: (enabled: boolean) => void;
  winLock: boolean;
  setWinLock: (enabled: boolean) => void;
  insert: boolean;
  setInsert: (enabled: boolean) => void;
  toggleCapsLock: () => void;
  toggleNumLock: () => void;
  toggleScrollLock: () => void;
  toggleFnLock: () => void;
  toggleFnHold: () => void;
  toggleWinLock: () => void;
  toggleInsert: () => void;
  resetLocks: () => void;
}

const KeyboardLockContext = createContext<KeyboardLockContextType | undefined>(undefined);

export function KeyboardLockProvider({ children }: { children: ReactNode }) {
  const [capsLock, setCapsLock] = useState(false);
  const [numLock, setNumLock] = useState(false);
  const [scrollLock, setScrollLock] = useState(false);
  const [fnLock, setFnLock] = useState(false);
  const [fnHold, setFnHold] = useState(false);
  const [winLock, setWinLock] = useState(false);
  const [insert, setInsert] = useState(false);

  const toggleCapsLock = () => setCapsLock(prev => !prev);
  const toggleNumLock = () => setNumLock(prev => !prev);
  const toggleScrollLock = () => setScrollLock(prev => !prev);
  const toggleFnLock = () => setFnLock(prev => !prev);
  const toggleFnHold = () => setFnHold(prev => !prev);
  const toggleWinLock = () => setWinLock(prev => !prev);
  const toggleInsert = () => setInsert(prev => !prev);

  const resetLocks = () => {
    setCapsLock(false);
    setNumLock(false);
    setScrollLock(false);
    setFnLock(false);
    setFnHold(false);
    setWinLock(false);
    setInsert(false);
  };

  return (
    <KeyboardLockContext.Provider
      value={{
        capsLock,
        setCapsLock,
        numLock,
        setNumLock,
        scrollLock,
        setScrollLock,
        fnLock,
        setFnLock,
        fnHold,
        setFnHold,
        winLock,
        setWinLock,
        insert,
        setInsert,
        toggleCapsLock,
        toggleNumLock,
        toggleScrollLock,
        toggleFnLock,
        toggleFnHold,
        toggleWinLock,
        toggleInsert,
        resetLocks,
      }}
    >
      {children}
    </KeyboardLockContext.Provider>
  );
}

export function useKeyboardLock() {
  const context = useContext(KeyboardLockContext);
  if (context === undefined) {
    throw new Error("useKeyboardLock must be used within a KeyboardLockProvider");
  }
  return context;
}

