"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { STATUS_CONTROLS_DEFAULTS } from "@/lib/app-defaults";
import type { DisplayMode, StatusControlsPreferences } from "@/lib/app-preferences";

interface StatusControlsContextType extends StatusControlsPreferences {
  setTouchpad: (value: boolean | ((prev: boolean) => boolean)) => void;
  setSleep: (value: boolean | ((prev: boolean) => boolean)) => void;
  setLock: (value: boolean) => void;
  setDisplayMode: (value: DisplayMode | ((prev: DisplayMode) => DisplayMode)) => void;
  setPowerSaving: (value: boolean) => void;
  setVolume: (value: number | ((prev: number) => number)) => void;
  setBrightness: (value: number | ((prev: number) => number)) => void;
  setKeyboardLight: (value: number | ((prev: number) => number)) => void;
  setWifi: (value: boolean) => void;
  setBluetooth: (value: boolean) => void;
  setScreenOn: (value: boolean | ((prev: boolean) => boolean)) => void;
  setMic: (value: boolean) => void;
  applyStatusControls: (values: StatusControlsPreferences) => void;
  resetStatusControls: () => void;
}

const StatusControlsContext = createContext<StatusControlsContextType | undefined>(undefined);

export function StatusControlsProvider({ children }: { children: ReactNode }) {
  const [touchpad, setTouchpadState] = useState(STATUS_CONTROLS_DEFAULTS.touchpad);
  const [sleep, setSleepState] = useState(STATUS_CONTROLS_DEFAULTS.sleep);
  const [lock, setLock] = useState(STATUS_CONTROLS_DEFAULTS.lock);
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(STATUS_CONTROLS_DEFAULTS.displayMode);
  const [powerSaving, setPowerSaving] = useState(STATUS_CONTROLS_DEFAULTS.powerSaving);
  const [volume, setVolume] = useState(STATUS_CONTROLS_DEFAULTS.volume);
  const [brightness, setBrightness] = useState(STATUS_CONTROLS_DEFAULTS.brightness);
  const [keyboardLight, setKeyboardLight] = useState(STATUS_CONTROLS_DEFAULTS.keyboardLight);
  const [wifi, setWifi] = useState(STATUS_CONTROLS_DEFAULTS.wifi);
  const [bluetooth, setBluetooth] = useState(STATUS_CONTROLS_DEFAULTS.bluetooth);
  const [screenOn, setScreenOnState] = useState(STATUS_CONTROLS_DEFAULTS.screenOn);
  const [mic, setMic] = useState(STATUS_CONTROLS_DEFAULTS.mic);

  const setTouchpad = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setTouchpadState((prev) => (typeof value === "function" ? value(prev) : value));
  }, []);

  const setSleep = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setSleepState((prev) => (typeof value === "function" ? value(prev) : value));
  }, []);

  const setDisplayMode = useCallback(
    (value: DisplayMode | ((prev: DisplayMode) => DisplayMode)) => {
      setDisplayModeState((prev) => (typeof value === "function" ? value(prev) : value));
    },
    [],
  );

  const setScreenOn = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setScreenOnState((prev) => (typeof value === "function" ? value(prev) : value));
  }, []);

  const applyStatusControls = useCallback((values: StatusControlsPreferences) => {
    setTouchpadState(values.touchpad);
    setSleepState(values.sleep);
    setLock(values.lock);
    setDisplayModeState(values.displayMode);
    setPowerSaving(values.powerSaving);
    setVolume(values.volume);
    setBrightness(values.brightness);
    setKeyboardLight(values.keyboardLight);
    setWifi(values.wifi);
    setBluetooth(values.bluetooth);
    setScreenOnState(values.screenOn);
    setMic(values.mic);
  }, []);

  const resetStatusControls = useCallback(() => {
    applyStatusControls(STATUS_CONTROLS_DEFAULTS);
  }, [applyStatusControls]);

  return (
    <StatusControlsContext.Provider
      value={{
        touchpad,
        sleep,
        lock,
        displayMode,
        powerSaving,
        volume,
        brightness,
        keyboardLight,
        wifi,
        bluetooth,
        screenOn,
        mic,
        setTouchpad,
        setSleep,
        setLock,
        setDisplayMode,
        setPowerSaving,
        setVolume,
        setBrightness,
        setKeyboardLight,
        setWifi,
        setBluetooth,
        setScreenOn,
        setMic,
        applyStatusControls,
        resetStatusControls,
      }}
    >
      {children}
    </StatusControlsContext.Provider>
  );
}

export function useStatusControls() {
  const context = useContext(StatusControlsContext);
  if (context === undefined) {
    throw new Error("useStatusControls must be used within a StatusControlsProvider");
  }
  return context;
}
