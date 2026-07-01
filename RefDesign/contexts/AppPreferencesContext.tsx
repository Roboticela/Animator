"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_APP_PREFERENCES,
  type AppPreferences,
} from "@/lib/app-preferences";
import {
  loadAppPreferences,
  resetAppPreferences,
} from "@/lib/app-preferences-storage";

interface AppPreferencesContextType {
  isReady: boolean;
  preferences: AppPreferences;
  setHydrating: (hydrating: boolean) => void;
  isHydrating: () => boolean;
  resetPreferences: () => Promise<AppPreferences>;
}

const AppPreferencesContext = createContext<AppPreferencesContextType | undefined>(undefined);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_APP_PREFERENCES);
  const hydratingRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const loaded = await loadAppPreferences();
      if (cancelled) return;
      setPreferences(loaded);
      setIsReady(true);
      hydratingRef.current = false;
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setHydrating = useCallback((hydrating: boolean) => {
    hydratingRef.current = hydrating;
  }, []);

  const isHydrating = useCallback(() => hydratingRef.current, []);

  const resetPreferences = useCallback(async () => {
    hydratingRef.current = true;
    const defaults = await resetAppPreferences();
    setPreferences(defaults);
    hydratingRef.current = false;
    return defaults;
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      preferences,
      setHydrating,
      isHydrating,
      resetPreferences,
    }),
    [isHydrating, isReady, preferences, resetPreferences, setHydrating],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (context === undefined) {
    throw new Error("useAppPreferences must be used within an AppPreferencesProvider");
  }
  return context;
}
