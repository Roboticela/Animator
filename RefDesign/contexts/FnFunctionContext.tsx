'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface FnFunctionContextType {
  handleFnFunction: (fnFunction: string) => void;
  subscribe: (callback: (fnFunction: string) => void) => () => void;
}

const FnFunctionContext = createContext<FnFunctionContextType | undefined>(undefined);

export function FnFunctionProvider({ children }: { children: ReactNode }) {
  const [subscribers, setSubscribers] = useState<Set<(fnFunction: string) => void>>(new Set());

  const handleFnFunction = useCallback((fnFunction: string) => {
    subscribers.forEach(callback => {
      callback(fnFunction);
    });
  }, [subscribers]);

  const subscribe = useCallback((callback: (fnFunction: string) => void) => {
    setSubscribers(prev => new Set([...prev, callback]));
    return () => {
      setSubscribers(prev => {
        const next = new Set(prev);
        next.delete(callback);
        return next;
      });
    };
  }, []);

  return (
    <FnFunctionContext.Provider value={{ handleFnFunction, subscribe }}>
      {children}
    </FnFunctionContext.Provider>
  );
}

export function useFnFunction() {
  const context = useContext(FnFunctionContext);
  if (context === undefined) {
    throw new Error('useFnFunction must be used within a FnFunctionProvider');
  }
  return context;
}

