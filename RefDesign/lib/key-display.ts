export type KeyModifiers = {
  shift?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  meta?: boolean;
  capsLock?: boolean;
  fn?: boolean;
};

/** Drop the modifier flag that matches the key being shown (avoids "Ctrl + Ctrl"). */
export function modifiersForKeyDisplay(key: string, modifiers: KeyModifiers = {}): KeyModifiers {
  const display = { ...modifiers };
  const normalized = key.toLowerCase();

  if (normalized === 'shift') display.shift = false;
  if (normalized === 'control' || normalized === 'ctrl') display.ctrl = false;
  if (normalized === 'alt') display.alt = false;
  if (
    normalized === 'meta' ||
    normalized === 'windows' ||
    normalized === 'os' ||
    normalized === 'cmd' ||
    normalized === 'command'
  ) {
    display.meta = false;
  }
  if (normalized === 'fn') display.fn = false;

  return display;
}

export function isMetaKeyEvent(key: string, code: string): boolean {
  return (
    key === 'Meta' ||
    key === 'OS' ||
    key === 'Windows' ||
    code === 'MetaLeft' ||
    code === 'MetaRight'
  );
}

const NAV_ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/** When Key Scroll mode is on, plain arrow keys should reach the browser (scroll, native focus nav). */
export function shouldPropagateNavArrowToBrowser(
  key: string,
  arrowEnabled: boolean,
  modifiers: Partial<KeyModifiers>,
): boolean {
  if (!arrowEnabled || !NAV_ARROW_KEYS.has(key)) return false;
  return !modifiers.ctrl && !modifiers.meta && !modifiers.alt && !modifiers.fn;
}

/** When Key Mouse mode is on, plain arrow keys move the virtual cursor instead of the document. */
export function shouldControlVirtualMouseWithArrow(
  key: string,
  keyboardMouseEnabled: boolean,
  mouseEnabled: boolean,
  modifiers: Partial<KeyModifiers>,
): boolean {
  if (!keyboardMouseEnabled || !mouseEnabled) return false;
  if (!NAV_ARROW_KEYS.has(key)) return false;
  return !modifiers.ctrl && !modifiers.meta && !modifiers.alt && !modifiers.fn;
}
