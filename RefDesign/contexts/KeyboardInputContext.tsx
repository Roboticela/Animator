'use client';

import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';

interface ModifierKeys {
  shift?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  meta?: boolean;
  capsLock?: boolean;
  fn?: boolean;
}

interface KeyboardInputContextType {
  handleKeyPress: (key: string, modifiers?: ModifierKeys) => void;
  subscribe: (callback: (key: string, modifiers?: ModifierKeys) => void) => () => void;
}

const KeyboardInputContext = createContext<KeyboardInputContextType | undefined>(undefined);

export function KeyboardInputProvider({ children }: { children: ReactNode }) {
  // Use a ref instead of state so that adding/removing subscribers never
  // triggers re-renders of context consumers and handleKeyPress stays stable.
  const subscribersRef = useRef<Set<(key: string, modifiers?: ModifierKeys) => void>>(new Set());

  const handleKeyPress = useCallback((key: string, modifiers: ModifierKeys = {}) => {
    subscribersRef.current.forEach(callback => {
      callback(key, modifiers);
    });
  }, []); // stable – always reads the latest subscribers through the ref

  const subscribe = useCallback((callback: (key: string, modifiers?: ModifierKeys) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  return (
    <KeyboardInputContext.Provider value={{ handleKeyPress, subscribe }}>
      {children}
    </KeyboardInputContext.Provider>
  );
}

export function useKeyboardInput() {
  const context = useContext(KeyboardInputContext);
  if (context === undefined) {
    throw new Error('useKeyboardInput must be used within a KeyboardInputProvider');
  }
  return context;
}

