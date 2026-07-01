import type { ThemeName } from '@/contexts/ThemeContext';
import {
  DEFAULT_KEYBOARD_SYNC,
  DEFAULT_THEME,
  STATUS_CONTROLS_DEFAULTS,
} from '@/lib/app-defaults';
import { DEFAULT_KEYBOARD_TYPE, type KeyboardType } from '@/lib/keyboard-types';

export const APP_PREFERENCES_VERSION = 1 as const;

export type DisplayMode = 'pc-only' | 'duplicate' | 'extend';

export interface KeyboardViewPreferences {
  scale: number;
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  objectX: number;
  objectY: number;
  objectZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export interface KeyboardLockPreferences {
  capsLock: boolean;
  numLock: boolean;
  scrollLock: boolean;
  fnLock: boolean;
  fnHold: boolean;
  winLock: boolean;
  insert: boolean;
}

export interface StatusControlsPreferences {
  touchpad: boolean;
  sleep: boolean;
  lock: boolean;
  displayMode: DisplayMode;
  powerSaving: boolean;
  volume: number;
  brightness: number;
  keyboardLight: number;
  wifi: boolean;
  bluetooth: boolean;
  screenOn: boolean;
  mic: boolean;
}

export interface AppPreferences {
  version: typeof APP_PREFERENCES_VERSION;
  theme: ThemeName;
  glowEnabled: boolean;
  keyboardType: KeyboardType;
  handEnabled: boolean;
  fullscreenEnabled: boolean;
  mouseEnabled: boolean;
  keyboardMouseEnabled: boolean;
  arrowEnabled: boolean;
  keyboardSyncEnabled: boolean;
  fnShortcutEnabled: boolean;
  typingHandsEnabled: boolean;
  locks: KeyboardLockPreferences;
  flightMode: boolean;
  statusControls: StatusControlsPreferences;
  keyboardView: KeyboardViewPreferences | null;
}

export const DEFAULT_KEYBOARD_LOCKS: KeyboardLockPreferences = {
  capsLock: false,
  numLock: false,
  scrollLock: false,
  fnLock: false,
  fnHold: false,
  winLock: false,
  insert: false,
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  version: APP_PREFERENCES_VERSION,
  theme: DEFAULT_THEME,
  glowEnabled: false,
  keyboardType: DEFAULT_KEYBOARD_TYPE,
  handEnabled: false,
  fullscreenEnabled: false,
  mouseEnabled: false,
  keyboardMouseEnabled: false,
  arrowEnabled: false,
  keyboardSyncEnabled: DEFAULT_KEYBOARD_SYNC,
  fnShortcutEnabled: false,
  typingHandsEnabled: false,
  locks: { ...DEFAULT_KEYBOARD_LOCKS },
  flightMode: false,
  statusControls: { ...STATUS_CONTROLS_DEFAULTS },
  keyboardView: null,
};

export function isAppPreferences(value: unknown): value is AppPreferences {
  if (!value || typeof value !== 'object') return false;
  const prefs = value as AppPreferences;
  return prefs.version === APP_PREFERENCES_VERSION && typeof prefs.theme === 'string';
}
