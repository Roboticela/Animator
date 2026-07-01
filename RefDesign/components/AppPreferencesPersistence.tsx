"use client";

import { useEffect, useRef } from "react";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { useArrow } from "@/contexts/ArrowContext";
import { useFnShortcut } from "@/contexts/FnShortcutContext";
import { useFullscreen } from "@/contexts/FullscreenContext";
import { useHand } from "@/contexts/HandContext";
import { useKeyboardLock } from "@/contexts/KeyboardLockContext";
import { useKeyboardSync } from "@/contexts/KeyboardSyncContext";
import { useKeyboardType } from "@/contexts/KeyboardTypeContext";
import { useKeyboardView } from "@/contexts/KeyboardViewContext";
import { useMouse } from "@/contexts/MouseContext";
import { useStatusControls } from "@/contexts/StatusControlsContext";
import { useSystemState } from "@/contexts/SystemStateContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypingHands } from "@/contexts/TypingHandsContext";
import type { AppPreferences } from "@/lib/app-preferences";
import { saveAppPreferences } from "@/lib/app-preferences-storage";

function buildPreferencesSnapshot(
  theme: ReturnType<typeof useTheme>,
  keyboardType: ReturnType<typeof useKeyboardType>,
  hand: ReturnType<typeof useHand>,
  fullscreen: ReturnType<typeof useFullscreen>,
  mouse: ReturnType<typeof useMouse>,
  arrow: ReturnType<typeof useArrow>,
  keyboardSync: ReturnType<typeof useKeyboardSync>,
  fnShortcut: ReturnType<typeof useFnShortcut>,
  typingHands: ReturnType<typeof useTypingHands>,
  locks: ReturnType<typeof useKeyboardLock>,
  systemState: ReturnType<typeof useSystemState>,
  statusControls: ReturnType<typeof useStatusControls>,
  keyboardView: ReturnType<typeof useKeyboardView>,
): AppPreferences {
  return {
    version: 1,
    theme: theme.theme,
    glowEnabled: theme.glowEnabled,
    keyboardType: keyboardType.keyboardType,
    handEnabled: hand.handEnabled,
    fullscreenEnabled: fullscreen.fullscreenEnabled,
    mouseEnabled: mouse.mouseEnabled,
    keyboardMouseEnabled: mouse.keyboardMouseEnabled,
    arrowEnabled: arrow.arrowEnabled,
    keyboardSyncEnabled: keyboardSync.keyboardSyncEnabled,
    fnShortcutEnabled: fnShortcut.fnShortcutEnabled,
    typingHandsEnabled: typingHands.typingHandsEnabled,
    locks: {
      capsLock: locks.capsLock,
      numLock: locks.numLock,
      scrollLock: locks.scrollLock,
      fnLock: locks.fnLock,
      fnHold: locks.fnHold,
      winLock: locks.winLock,
      insert: locks.insert,
    },
    flightMode: systemState.flightMode,
    statusControls: {
      touchpad: statusControls.touchpad,
      sleep: statusControls.sleep,
      lock: statusControls.lock,
      displayMode: statusControls.displayMode,
      powerSaving: statusControls.powerSaving,
      volume: statusControls.volume,
      brightness: statusControls.brightness,
      keyboardLight: statusControls.keyboardLight,
      wifi: statusControls.wifi,
      bluetooth: statusControls.bluetooth,
      screenOn: statusControls.screenOn,
      mic: statusControls.mic,
    },
    keyboardView: keyboardView.getSavedViewState(),
  };
}

export default function AppPreferencesPersistence() {
  const { isReady, preferences, setHydrating, isHydrating } = useAppPreferences();
  const theme = useTheme();
  const keyboardType = useKeyboardType();
  const hand = useHand();
  const fullscreen = useFullscreen();
  const mouse = useMouse();
  const arrow = useArrow();
  const keyboardSync = useKeyboardSync();
  const fnShortcut = useFnShortcut();
  const typingHands = useTypingHands();
  const locks = useKeyboardLock();
  const systemState = useSystemState();
  const statusControls = useStatusControls();
  const keyboardView = useKeyboardView();

  const appliedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isReady || appliedRef.current) return;

    setHydrating(true);

    theme.setTheme(preferences.theme);
    theme.setGlowEnabled(preferences.glowEnabled);
    keyboardType.setKeyboardType(preferences.keyboardType);
    hand.setHandEnabled(preferences.handEnabled);
    fullscreen.setFullscreenEnabled(preferences.fullscreenEnabled);
    mouse.setMouseEnabled(preferences.mouseEnabled);
    mouse.setKeyboardMouseEnabled(preferences.keyboardMouseEnabled);
    arrow.setArrowEnabled(preferences.arrowEnabled);
    keyboardSync.setKeyboardSyncEnabled(preferences.keyboardSyncEnabled);
    fnShortcut.setFnShortcutEnabled(preferences.fnShortcutEnabled);
    typingHands.setTypingHandsEnabled(preferences.typingHandsEnabled);

    locks.setCapsLock(preferences.locks.capsLock);
    locks.setNumLock(preferences.locks.numLock);
    locks.setScrollLock(preferences.locks.scrollLock);
    locks.setFnLock(preferences.locks.fnLock);
    locks.setFnHold(preferences.locks.fnHold);
    locks.setWinLock(preferences.locks.winLock);
    locks.setInsert(preferences.locks.insert);

    systemState.setFlightMode(preferences.flightMode);
    statusControls.applyStatusControls(preferences.statusControls);

    if (preferences.keyboardView) {
      requestAnimationFrame(() => {
        keyboardView.applySavedViewState(preferences.keyboardView!);
      });
    }

    appliedRef.current = true;
    setHydrating(false);
  }, [
    arrow,
    fnShortcut,
    fullscreen,
    hand,
    isReady,
    keyboardSync,
    keyboardType,
    keyboardView,
    locks,
    mouse,
    preferences,
    setHydrating,
    statusControls,
    systemState,
    theme,
    typingHands,
  ]);

  useEffect(() => {
    if (!isReady || !appliedRef.current || isHydrating()) return;

    const snapshot = buildPreferencesSnapshot(
      theme,
      keyboardType,
      hand,
      fullscreen,
      mouse,
      arrow,
      keyboardSync,
      fnShortcut,
      typingHands,
      locks,
      systemState,
      statusControls,
      keyboardView,
    );

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void saveAppPreferences(snapshot);
    }, 250);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [
    arrow.arrowEnabled,
    fnShortcut.fnShortcutEnabled,
    fullscreen.fullscreenEnabled,
    hand.handEnabled,
    isReady,
    keyboardSync.keyboardSyncEnabled,
    keyboardType.keyboardType,
    locks.capsLock,
    locks.fnHold,
    locks.fnLock,
    locks.insert,
    locks.numLock,
    locks.scrollLock,
    locks.winLock,
    mouse.keyboardMouseEnabled,
    mouse.mouseEnabled,
    statusControls.bluetooth,
    statusControls.brightness,
    statusControls.displayMode,
    statusControls.keyboardLight,
    statusControls.lock,
    statusControls.mic,
    statusControls.powerSaving,
    statusControls.screenOn,
    statusControls.sleep,
    statusControls.touchpad,
    statusControls.volume,
    statusControls.wifi,
    systemState.flightMode,
    theme.glowEnabled,
    theme.theme,
    typingHands.typingHandsEnabled,
    keyboardView.viewRevision,
    isHydrating,
    theme,
    keyboardType,
    hand,
    fullscreen,
    mouse,
    arrow,
    keyboardSync,
    fnShortcut,
    typingHands,
    locks,
    systemState,
    statusControls,
  ]);

  return null;
}
