/**
 * Debug logging utility.
 * Set VITE_DEBUG=true in .env.local to enable all debug output.
 * Logs are completely stripped (no-op functions) when DEBUG is false.
 */

const DEBUG = import.meta.env.VITE_DEBUG === 'true';

const COLORS: Record<string, string> = {
  DocumentEditor: '#7c3aed',
  KeyboardInput:  '#0369a1',
  Keyboard:       '#047857',
  default:        '#92400e',
};

export function createDebugLogger(namespace: string) {
  if (!DEBUG) return (..._args: unknown[]) => {};

  const color = COLORS[namespace] ?? COLORS.default;
  const prefix = `%c[${namespace}]%c`;
  const prefixStyle = `color:${color};font-weight:bold`;
  const resetStyle = 'color:inherit;font-weight:normal';

  return (...args: unknown[]) => {
    const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    console.log(prefix, prefixStyle, resetStyle, `(${ts})`, ...args);
  };
}
