/**
 * Type definition for keyboard button configuration
 */
export interface KeyboardButton {
  /** Unique identifier for the button (used for detection) */
  id: string;
  /** Primary key code (e.g., "Escape", "F1", "a", "1", "Space") */
  primary: string;
  /** Secondary key code (for Fn combinations, leave empty string if it's an icon/function key) */
  secondary: string;
  /** Fn key code (for Fn key combinations, leave empty string if not applicable) */
  fn: string;
}

/**
 * Keyboard button configuration type
 */
export type KeyboardButtonConfig = KeyboardButton[];

// Also export as a value for better ESM compatibility
export { type KeyboardButtonConfig as KeyboardButtonConfigType };
