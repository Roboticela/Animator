export interface EditorSnapshot {
  text: string;
  cursor: number;
  selStart: number;
  selEnd: number;
}

export interface EditorModifiers {
  shift?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export interface ShortcutContext {
  key: string;
  modifiers?: EditorModifiers;
  state: EditorSnapshot;
  selectionAnchor: number;
  findQuery: string | null;
}

export type ShortcutSideEffect = 'copy' | 'cut' | 'paste' | 'undo' | 'redo';

export interface ShortcutResult {
  handled: boolean;
  snapshot?: EditorSnapshot;
  selectionAnchor?: number;
  findQuery?: string | null;
  sideEffect?: ShortcutSideEffect;
}

function isCtrlOrMeta(modifiers?: EditorModifiers): boolean {
  return Boolean(modifiers?.ctrl || modifiers?.meta);
}

function hasSelection(state: EditorSnapshot): boolean {
  return state.selStart !== state.selEnd;
}

/** Active caret end of a selection (opposite the fixed anchor). */
export function getSelectionFocus(
  anchor: number,
  selStart: number,
  selEnd: number,
): number {
  if (selStart === selEnd) return selStart;
  return anchor === selStart ? selEnd : selStart;
}

function getLineStart(text: string, pos: number): number {
  const idx = text.lastIndexOf('\n', pos - 1);
  return idx === -1 ? 0 : idx + 1;
}

function getLineEnd(text: string, pos: number): number {
  const idx = text.indexOf('\n', pos);
  return idx === -1 ? text.length : idx;
}

function findWordStart(text: string, pos: number): number {
  if (pos <= 0) return 0;
  let i = pos;
  while (i > 0 && /\s/.test(text[i - 1] ?? '')) i--;
  while (i > 0 && !/\s/.test(text[i - 1] ?? '')) i--;
  return i;
}

function findWordEnd(text: string, pos: number): number {
  if (pos >= text.length) return text.length;
  let i = pos;
  while (i < text.length && /\s/.test(text[i] ?? '')) i++;
  while (i < text.length && !/\s/.test(text[i] ?? '')) i++;
  return i;
}

function getWordAtCursor(text: string, pos: number): string {
  const start = findWordStart(text, pos);
  const end = findWordEnd(text, pos);
  const word = text.substring(start, end).trim();
  return word;
}

function moveCursor(state: EditorSnapshot, pos: number, anchor?: number): ShortcutResult {
  const clamped = Math.max(0, Math.min(pos, state.text.length));
  if (anchor !== undefined) {
    const selStart = Math.min(anchor, clamped);
    const selEnd = Math.max(anchor, clamped);
    return {
      handled: true,
      snapshot: { text: state.text, cursor: clamped, selStart, selEnd },
      selectionAnchor: anchor,
    };
  }
  return {
    handled: true,
    snapshot: { text: state.text, cursor: clamped, selStart: clamped, selEnd: clamped },
    selectionAnchor: clamped,
  };
}

function replaceRange(
  text: string,
  start: number,
  end: number,
  insert: string,
): { text: string; cursor: number } {
  const newText = text.substring(0, start) + insert + text.substring(end);
  return { text: newText, cursor: start + insert.length };
}

function wrapSelection(
  state: EditorSnapshot,
  before: string,
  after: string,
): ShortcutResult {
  const { text, selStart, selEnd } = state;
  if (!hasSelection(state)) return { handled: false };
  const selected = text.substring(selStart, selEnd);
  const { text: newText } = replaceRange(text, selStart, selEnd, before + selected + after);
  const selStartOut = selStart + before.length;
  const selEndOut = selStartOut + selected.length;
  return {
    handled: true,
    snapshot: { text: newText, cursor: selEndOut, selStart: selStartOut, selEnd: selEndOut },
    selectionAnchor: selStartOut,
  };
}

function findNextMatch(
  text: string,
  query: string,
  from: number,
): { index: number; length: number } | null {
  if (!query) return null;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let idx = lowerText.indexOf(lowerQuery, from);
  if (idx === -1 && from > 0) {
    idx = lowerText.indexOf(lowerQuery, 0);
  }
  if (idx === -1) return null;
  return { index: idx, length: query.length };
}

function findPreviousMatch(
  text: string,
  query: string,
  from: number,
): { index: number; length: number } | null {
  if (!query) return null;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let idx = lowerText.lastIndexOf(lowerQuery, from - 1);
  if (idx === -1) {
    idx = lowerText.lastIndexOf(lowerQuery);
  }
  if (idx === -1) return null;
  return { index: idx, length: query.length };
}

function selectFindMatch(
  state: EditorSnapshot,
  match: { index: number; length: number },
  query: string,
): ShortcutResult {
  const selStart = match.index;
  const selEnd = match.index + match.length;
  return {
    handled: true,
    snapshot: { text: state.text, cursor: selEnd, selStart, selEnd },
    selectionAnchor: selStart,
    findQuery: query,
  };
}

export function resolveDocumentShortcut(ctx: ShortcutContext): ShortcutResult {
  const { key, modifiers, state, selectionAnchor, findQuery } = ctx;
  const { text, cursor, selStart, selEnd } = state;
  const ctrlOrMeta = isCtrlOrMeta(modifiers);
  const shift = Boolean(modifiers?.shift);
  const keyLower = key.toLowerCase();
  const focus = hasSelection(state)
    ? getSelectionFocus(selectionAnchor, selStart, selEnd)
    : cursor;
  const activeEnd = focus;

  // Undo / Redo (handled via side effects dummies — DocumentEditor owns history)
  if (ctrlOrMeta && keyLower === 'z' && !shift) {
    return { handled: true, sideEffect: 'undo' };
  }
  if (ctrlOrMeta && (keyLower === 'y' || (keyLower === 'z' && shift))) {
    return { handled: true, sideEffect: 'redo' };
  }

  // Clipboard aliases
  if (ctrlOrMeta && key === 'Insert') {
    return { handled: true, sideEffect: 'copy' };
  }
  if (shift && key === 'Insert' && !ctrlOrMeta) {
    return { handled: true, sideEffect: 'paste' };
  }
  if (shift && key === 'Delete' && !ctrlOrMeta) {
    return { handled: true, sideEffect: 'cut' };
  }

  // Find / Find next / Find previous
  if (ctrlOrMeta && keyLower === 'f') {
    const query = hasSelection(state)
      ? text.substring(selStart, selEnd)
      : getWordAtCursor(text, cursor);
    if (!query) return { handled: true, findQuery: query };
    const match = findNextMatch(text, query, cursor + 1);
    if (!match) return { handled: true, findQuery: query };
    return selectFindMatch(state, match, query);
  }
  if (ctrlOrMeta && keyLower === 'g') {
    const query = findQuery ?? (hasSelection(state) ? text.substring(selStart, selEnd) : getWordAtCursor(text, cursor));
    if (!query) return { handled: true };
    const match = shift
      ? findPreviousMatch(text, query, focus)
      : findNextMatch(text, query, focus);
    if (!match) return { handled: true, findQuery: query };
    return selectFindMatch(state, match, query);
  }

  // New document
  if (ctrlOrMeta && keyLower === 'n') {
    return {
      handled: true,
      snapshot: { text: '', cursor: 0, selStart: 0, selEnd: 0 },
      selectionAnchor: 0,
      findQuery: null,
    };
  }

  // Bold / Italic / Underline (markdown-style markers)
  if (ctrlOrMeta && keyLower === 'b') return wrapSelection(state, '**', '**');
  if (ctrlOrMeta && keyLower === 'i') return wrapSelection(state, '*', '*');
  if (ctrlOrMeta && keyLower === 'u') return wrapSelection(state, '__', '__');

  // Ctrl+Home / Ctrl+End
  if (ctrlOrMeta && key === 'Home') {
    return moveCursor(state, 0);
  }
  if (ctrlOrMeta && key === 'End') {
    return moveCursor(state, text.length);
  }

  // Word navigation
  if (ctrlOrMeta && key === 'ArrowLeft') {
    const newPos = findWordStart(text, focus);
    if (shift) {
      const anchor = hasSelection(state) ? selectionAnchor : cursor;
      return moveCursor(state, newPos, anchor);
    }
    return moveCursor(state, newPos);
  }
  if (ctrlOrMeta && key === 'ArrowRight') {
    const newPos = findWordEnd(text, focus);
    if (shift) {
      const anchor = hasSelection(state) ? selectionAnchor : cursor;
      return moveCursor(state, newPos, anchor);
    }
    return moveCursor(state, newPos);
  }

  // Ctrl+Backspace / Ctrl+Delete
  if (ctrlOrMeta && key === 'Backspace') {
    const delStart = hasSelection(state) ? selStart : findWordStart(text, cursor);
    const delEnd = hasSelection(state) ? selEnd : cursor;
    if (delStart === delEnd) return { handled: true };
    const { text: newText, cursor: newCursor } = replaceRange(text, delStart, delEnd, '');
    return {
      handled: true,
      snapshot: { text: newText, cursor: newCursor, selStart: newCursor, selEnd: newCursor },
      selectionAnchor: newCursor,
    };
  }
  if (ctrlOrMeta && key === 'Delete') {
    const delStart = hasSelection(state) ? selStart : cursor;
    const delEnd = hasSelection(state) ? selEnd : findWordEnd(text, cursor);
    if (delStart === delEnd) return { handled: true };
    const { text: newText, cursor: newCursor } = replaceRange(text, delStart, delEnd, '');
    return {
      handled: true,
      snapshot: { text: newText, cursor: newCursor, selStart: newCursor, selEnd: newCursor },
      selectionAnchor: newCursor,
    };
  }

  // Shift+Tab outdent
  if (shift && key === 'Tab' && !ctrlOrMeta) {
    const lineStart = getLineStart(text, cursor);
    const beforeCursor = text.substring(lineStart, cursor);
    if (beforeCursor.endsWith('  ')) {
      const { text: newText, cursor: newCursor } = replaceRange(text, cursor - 2, cursor, '');
      return {
        handled: true,
        snapshot: { text: newText, cursor: newCursor, selStart: newCursor, selEnd: newCursor },
        selectionAnchor: newCursor,
      };
    }
    return { handled: true };
  }

  // Shift + arrow / home / end / page navigation (extend selection)
  if (shift && !ctrlOrMeta && !modifiers?.alt) {
    const anchor = hasSelection(state) ? selectionAnchor : cursor;

    if (key === 'ArrowLeft') {
      return moveCursor(state, Math.max(0, activeEnd - 1), anchor);
    }
    if (key === 'ArrowRight') {
      return moveCursor(state, Math.min(text.length, activeEnd + 1), anchor);
    }
    if (key === 'ArrowUp') {
      const lines = text.substring(0, activeEnd).split('\n');
      const currentLine = lines.length - 1;
      const currentCol = lines[currentLine]?.length ?? 0;
      if (currentLine > 0) {
        const prevLine = lines[currentLine - 1] ?? '';
        const newCol = Math.min(currentCol, prevLine.length);
        const lineStart = text.lastIndexOf('\n', activeEnd - 1);
        const prevLineStart = text.lastIndexOf('\n', Math.max(0, lineStart - 1)) + 1;
        const newPos = prevLineStart + newCol;
        return moveCursor(state, newPos, anchor);
      }
      return moveCursor(state, 0, anchor);
    }
    if (key === 'ArrowDown') {
      const lines = text.substring(0, activeEnd).split('\n');
      const currentCol = lines[lines.length - 1]?.length ?? 0;
      const remaining = text.substring(activeEnd);
      const nextBreak = remaining.indexOf('\n');
      if (nextBreak !== -1) {
        const nextLine = remaining.substring(0, nextBreak);
        const newCol = Math.min(currentCol, nextLine.length);
        const newPos = activeEnd + nextBreak + 1 + newCol;
        return moveCursor(state, newPos, anchor);
      }
      return moveCursor(state, text.length, anchor);
    }
    if (key === 'Home') {
      return moveCursor(state, getLineStart(text, activeEnd), anchor);
    }
    if (key === 'End') {
      return moveCursor(state, getLineEnd(text, activeEnd), anchor);
    }
    if (key === 'PageUp') {
      return moveCursor(state, 0, anchor);
    }
    if (key === 'PageDown') {
      return moveCursor(state, text.length, anchor);
    }
  }

  return { handled: false };
}
