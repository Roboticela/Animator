import type { ThemeName } from '@/contexts/ThemeContext';
import { DEFAULT_KEYBOARD_TYPE } from '@/lib/keyboard-types';

export { DEFAULT_KEYBOARD_TYPE };
export type { KeyboardType } from '@/lib/keyboard-types';

export const DEFAULT_THEME: ThemeName = 'dark';
export const DEFAULT_KEYBOARD_SYNC = true;

export const STATUS_CONTROLS_DEFAULTS = {
  touchpad: true,
  sleep: false,
  lock: false,
  displayMode: 'pc-only' as const,
  powerSaving: false,
  volume: 75,
  brightness: 80,
  keyboardLight: 50,
  wifi: true,
  bluetooth: true,
  screenOn: true,
  mic: true,
};

export const EMPTY_EDITOR_SNAPSHOT = {
  text: '',
  cursor: 0,
  selStart: 0,
  selEnd: 0,
};
