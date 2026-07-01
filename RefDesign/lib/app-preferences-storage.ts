import {
  APP_PREFERENCES_VERSION,
  DEFAULT_APP_PREFERENCES,
  isAppPreferences,
  type AppPreferences,
} from '@/lib/app-preferences';
import { isTauri } from '@/lib/is-tauri';
import { VALID_KEYBOARD_TYPES, type KeyboardType } from '@/lib/keyboard-types';
import type { ThemeName } from '@/contexts/ThemeContext';

const IDB_NAME = 'keyboard-simulator';
const IDB_STORE = 'preferences';
const IDB_KEY = 'app-preferences';
const TAURI_STORE_FILE = 'app-preferences.json';
const TAURI_STORE_KEY = 'preferences';
const THEME_CACHE_KEY = 'theme';
const KEYBOARD_TYPE_CACHE_KEY = 'keyboardType';

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const request = tx.objectStore(IDB_STORE).get(key);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB get failed'));
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const request = tx.objectStore(IDB_STORE).put(value, key);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB put failed'));
    request.onsuccess = () => resolve();
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
  });
}

let tauriStorePromise: Promise<import('@tauri-apps/plugin-store').LazyStore> | null = null;

async function getTauriStore() {
  if (!tauriStorePromise) {
    tauriStorePromise = (async () => {
      const { LazyStore } = await import('@tauri-apps/plugin-store');
      return new LazyStore(TAURI_STORE_FILE, { autoSave: 100, defaults: {} });
    })();
  }
  return tauriStorePromise;
}

function readLegacyLocalStorage(): Partial<AppPreferences> | null {
  try {
    const legacy: Partial<AppPreferences> = {};
    let found = false;

    const theme = localStorage.getItem(THEME_CACHE_KEY) as ThemeName | null;
    if (theme) {
      legacy.theme = theme;
      found = true;
    }

    const keyboardType = localStorage.getItem(KEYBOARD_TYPE_CACHE_KEY) as KeyboardType | null;
    if (keyboardType && VALID_KEYBOARD_TYPES.includes(keyboardType)) {
      legacy.keyboardType = keyboardType;
      found = true;
    }

    return found ? legacy : null;
  } catch {
    return null;
  }
}

function syncThemeCache(theme: ThemeName) {
  try {
    localStorage.setItem(THEME_CACHE_KEY, theme);
  } catch {
    // ignore quota / private mode errors
  }
}

function mergeWithDefaults(partial: Partial<AppPreferences>): AppPreferences {
  return {
    ...DEFAULT_APP_PREFERENCES,
    ...partial,
    locks: { ...DEFAULT_APP_PREFERENCES.locks, ...partial.locks },
    statusControls: {
      ...DEFAULT_APP_PREFERENCES.statusControls,
      ...partial.statusControls,
    },
    keyboardView: partial.keyboardView ?? DEFAULT_APP_PREFERENCES.keyboardView,
  };
}

export async function loadAppPreferences(): Promise<AppPreferences> {
  try {
    if (isTauri()) {
      const store = await getTauriStore();
      const stored = await store.get<AppPreferences>(TAURI_STORE_KEY);
      if (isAppPreferences(stored)) {
        syncThemeCache(stored.theme);
        return mergeWithDefaults(stored);
      }
    } else {
      const stored = await idbGet<AppPreferences>(IDB_KEY);
      if (isAppPreferences(stored)) {
        syncThemeCache(stored.theme);
        return mergeWithDefaults(stored);
      }
    }
  } catch (error) {
    console.error('Failed to load app preferences:', error);
  }

  const legacy = readLegacyLocalStorage();
  if (legacy) {
    const merged = mergeWithDefaults(legacy);
    await saveAppPreferences(merged);
    return merged;
  }

  return { ...DEFAULT_APP_PREFERENCES };
}

export async function saveAppPreferences(preferences: AppPreferences): Promise<void> {
  const payload: AppPreferences = {
    ...preferences,
    version: APP_PREFERENCES_VERSION,
    locks: { ...preferences.locks },
    statusControls: { ...preferences.statusControls },
  };

  syncThemeCache(payload.theme);

  try {
    if (isTauri()) {
      const store = await getTauriStore();
      await store.set(TAURI_STORE_KEY, payload);
    } else {
      await idbSet(IDB_KEY, payload);
    }
  } catch (error) {
    console.error('Failed to save app preferences:', error);
  }
}

export async function resetAppPreferences(): Promise<AppPreferences> {
  const defaults = { ...DEFAULT_APP_PREFERENCES };
  await saveAppPreferences(defaults);
  return defaults;
}
