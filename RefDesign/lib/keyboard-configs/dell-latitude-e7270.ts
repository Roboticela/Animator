import type { KeyboardButtonConfig } from '../keyboard-button-types';

/**
 * Keyboard button configuration for Dell Latitude E7270
 * Secondary keys are left empty if they are icons/function keys (to be filled manually)
 */
export const dellLatitudeE7270Config: KeyboardButtonConfig = [
  // Row 1 - Function keys
  { id: 'esc', primary: 'Escape', secondary: '', fn: 'FnLock' }, // Icon: lock + fn
  { id: 'f1', primary: 'F1', secondary: '', fn: 'VolumeMute' }, // Icon: mute
  { id: 'f2', primary: 'F2', secondary: '', fn: 'Volume-' }, // Icon: volume down
  { id: 'f3', primary: 'F3', secondary: '', fn: 'Volume+' }, // Icon: volume up
  { id: 'f4', primary: 'F4', secondary: '', fn: 'MicToggle' }, // Icon: mic/mic-off
  { id: 'f5', primary: 'F5', secondary: '', fn: 'NumLock' }, // Icon: lock
  { id: 'f6', primary: 'F6', secondary: '', fn: 'ScrollLock' }, // Icon: brightness down
  { id: 'f7', primary: 'F7', secondary: '', fn: '' }, // Icon: brightness up
  { id: 'f8', primary: 'F8', secondary: '', fn: 'DisplayModeSwitch' }, // Icon: extend screen
  { id: 'f9', primary: 'F9', secondary: '', fn: 'SearchToggle' },
  { id: 'f10', primary: 'F10', secondary: '', fn: 'BacklightToggle' },
  { id: 'f11', primary: 'F11', secondary: '', fn: 'Brightness-' },
  { id: 'f12', primary: 'F12', secondary: '', fn: 'Brightness+' },
  { id: 'prtsc', primary: 'PrintScreen', secondary: '', fn: 'WifiToggle' },
  { id: 'insert', primary: 'Insert', secondary: '', fn: 'SleepMode' },
  { id: 'delete', primary: 'Delete', secondary: '', fn: '' },

  // Row 2 - Number row
  { id: 'backtick', primary: '`', secondary: '~', fn: '' },
  { id: '1', primary: '1', secondary: '!', fn: '' },
  { id: '2', primary: '2', secondary: '@', fn: '' },
  { id: '3', primary: '3', secondary: '#', fn: '' },
  { id: '4', primary: '4', secondary: '$', fn: '' },
  { id: '5', primary: '5', secondary: '%', fn: '' },
  { id: '6', primary: '6', secondary: '^', fn: '' },
  { id: '7', primary: '7', secondary: '&', fn: '7' },
  { id: '8', primary: '8', secondary: '*', fn: '8' },
  { id: '9', primary: '9', secondary: '(', fn: '9' },
  { id: '0', primary: '0', secondary: ')', fn: '/' },
  { id: 'minus', primary: '-', secondary: '_', fn: '' },
  { id: 'equals', primary: '=', secondary: '+', fn: '' },
  { id: 'backspace', primary: 'Backspace', secondary: '', fn: '' },

  // Row 3 - QWERTY row
  { id: 'tab', primary: 'Tab', secondary: '', fn: '' },
  { id: 'q', primary: 'q', secondary: 'Q', fn: '' },
  { id: 'w', primary: 'w', secondary: 'W', fn: '' },
  { id: 'e', primary: 'e', secondary: 'E', fn: '' },
  { id: 'r', primary: 'r', secondary: 'R', fn: '' },
  { id: 't', primary: 't', secondary: 'T', fn: '' },
  { id: 'y', primary: 'y', secondary: 'Y', fn: '' },
  { id: 'u', primary: 'u', secondary: 'U', fn: '4' },
  { id: 'i', primary: 'i', secondary: 'I', fn: '5' },
  { id: 'o', primary: 'o', secondary: 'O', fn: '6' },
  { id: 'p', primary: 'p', secondary: 'P', fn: '*' },
  { id: 'bracket-left', primary: '[', secondary: '{', fn: '' },
  { id: 'bracket-right', primary: ']', secondary: '}', fn: '' },
  { id: 'backslash', primary: '\\', secondary: '|', fn: '' },

  // Row 4 - ASDF row
  { id: 'capslock', primary: 'CapsLock', secondary: '', fn: '' },
  { id: 'a', primary: 'a', secondary: 'A', fn: '' },
  { id: 's', primary: 's', secondary: 'S', fn: '' },
  { id: 'd', primary: 'd', secondary: 'D', fn: '' },
  { id: 'f', primary: 'f', secondary: 'F', fn: '' },
  { id: 'g', primary: 'g', secondary: 'G', fn: '' },
  { id: 'h', primary: 'h', secondary: 'H', fn: '' },
  { id: 'j', primary: 'j', secondary: 'J', fn: '1' },
  { id: 'k', primary: 'k', secondary: 'K', fn: '2' },
  { id: 'l', primary: 'l', secondary: 'L', fn: '3' },
  { id: 'semicolon', primary: ';', secondary: ':', fn: '-' },
  { id: 'quote', primary: "'", secondary: '"', fn: '' },
  { id: 'enter', primary: 'Enter', secondary: '', fn: '' },

  // Row 5 - ZXCV row
  { id: 'shift-left', primary: 'Shift', secondary: '', fn: '' },
  { id: 'z', primary: 'z', secondary: 'Z', fn: '' },
  { id: 'x', primary: 'x', secondary: 'X', fn: '' },
  { id: 'c', primary: 'c', secondary: 'C', fn: '' },
  { id: 'v', primary: 'v', secondary: 'V', fn: '' },
  { id: 'b', primary: 'b', secondary: 'B', fn: '' },
  { id: 'n', primary: 'n', secondary: 'N', fn: '' },
  { id: 'm', primary: 'm', secondary: 'M', fn: '0' },
  { id: 'comma', primary: ',', secondary: '<', fn: '' },
  { id: 'period', primary: '.', secondary: '>', fn: '.' },
  { id: 'slash', primary: '/', secondary: '?', fn: '+' },
  { id: 'shift-right', primary: 'Shift', secondary: '', fn: '' },

  // Row 6 - Bottom row
  { id: 'ctrl-left', primary: 'Control', secondary: '', fn: '' },
  { id: 'fn', primary: 'Fn', secondary: '', fn: '' },
  { id: 'windows', primary: 'Meta', secondary: '', fn: '' }, // Windows key
  { id: 'alt-left', primary: 'Alt', secondary: '', fn: '' },
  { id: 'space', primary: ' ', secondary: '', fn: '' },
  { id: 'alt-right', primary: 'Alt', secondary: '', fn: '' },
  { id: 'ctrl-right', primary: 'Control', secondary: '', fn: 'ContextMenu' },
  { id: 'arrow-left', primary: 'ArrowLeft', secondary: '', fn: 'Home' },
  { id: 'arrow-up', primary: 'ArrowUp', secondary: '', fn: '' },
  { id: 'arrow-down', primary: 'ArrowDown', secondary: '', fn: '' },
  { id: 'arrow-right', primary: 'ArrowRight', secondary: '', fn: 'End' },
  { id: 'pgup', primary: 'PageUp', secondary: '', fn: '' },
  { id: 'pgdn', primary: 'PageDown', secondary: '', fn: '' },
];




