export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    '__TAURI_INTERNALS__' in window ||
    '__TAURI_METADATA__' in window ||
    (window as Window & { __TAURI__?: unknown }).__TAURI__ !== undefined
  );
}
