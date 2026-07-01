"use client";

import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { motion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { useKeyboardInput } from "@/contexts/KeyboardInputContext";
import { useKeyboardLock } from "@/contexts/KeyboardLockContext";
import { createDebugLogger } from "@/lib/debug";
import { modifiersForKeyDisplay } from "@/lib/key-display";
import {
  resolveDocumentShortcut,
  getSelectionFocus,
  type EditorSnapshot,
} from "@/lib/document-editor-actions";
import { useAppReset } from "@/contexts/AppResetContext";
import { useMouse } from "@/contexts/MouseContext";
import { EMPTY_EDITOR_SNAPSHOT } from "@/lib/app-defaults";

const dbg = createDebugLogger('DocumentEditor');

const EDITOR_SELECTION_BG = 'color-mix(in srgb, var(--primary) 38%, transparent)';
const EDITOR_CARET_BG = 'var(--primary)';
const EDITOR_OVERWRITE_BG = 'color-mix(in srgb, var(--primary) 35%, transparent)';
const EDITOR_OVERWRITE_BORDER = 'var(--primary)';

interface DocumentEditorProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

// Textarea caret position calculation based on stackoverflow.com/questions/2897155
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const div = document.createElement('div');
  const style = getComputedStyle(element);
  const computed = {
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    padding: style.padding,
    border: style.border,
    boxSizing: style.boxSizing
  };

  Object.assign(div.style, computed);
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.overflowWrap = 'break-word';
  div.style.width = element.clientWidth + 'px';
  div.style.height = element.clientHeight + 'px';
  div.style.overflow = 'auto';

  document.body.appendChild(div);

  const text = element.value.substring(0, position);
  div.textContent = text;

  const span = document.createElement('span');
  span.textContent = element.value.substring(position, position + 1) || '.';
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop - element.scrollTop,
    left: span.offsetLeft - element.scrollLeft,
    height: span.offsetHeight,
    width: span.offsetWidth
  };

  document.body.removeChild(div);
  return coordinates;
}

interface EditorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getSelectionRects(element: HTMLTextAreaElement, start: number, end: number): EditorRect[] {
  if (start === end) return [];

  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const text = element.value;
  const rects: EditorRect[] = [];

  let lineStart = 0;
  while (lineStart <= text.length) {
    const lineBreak = text.indexOf('\n', lineStart);
    const lineEnd = lineBreak === -1 ? text.length : lineBreak;
    const selStartInLine = Math.max(from, lineStart);
    const selEndInLine = Math.min(to, lineEnd);

    if (selStartInLine < selEndInLine) {
      const startCoords = getCaretCoordinates(element, selStartInLine);
      const endCoords = getCaretCoordinates(element, selEndInLine);
      rects.push({
        top: startCoords.top,
        left: startCoords.left,
        width: Math.max(endCoords.left - startCoords.left, endCoords.width, 2),
        height: startCoords.height,
      });
    }

    if (lineBreak === -1) break;
    lineStart = lineBreak + 1;
  }

  return rects;
}

const DocumentEditor = forwardRef<HTMLDivElement, DocumentEditorProps>(function DocumentEditor(
  { isFullscreen = false, onToggleFullscreen },
  forwardedRef,
) {
  const [text, setText] = useState('');
  const { insert, toggleInsert } = useKeyboardLock();
  // insert lock ON = overwrite mode (matches keyboard LED / OVR convention)
  const isOverwrite = insert;
  const [cursorPos, setCursorPos] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0, height: 20, width: 2 });
  const [caretMode, setCaretMode] = useState<'insert' | 'overwrite' | 'selection'>('insert');
  const [caretVisible, setCaretVisible] = useState(true);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const [selectionRects, setSelectionRects] = useState<EditorRect[]>([]);
  const [lastKeyPress, setLastKeyPress] = useState<{ key: string; modifiers?: { shift?: boolean; ctrl?: boolean; alt?: boolean; meta?: boolean; capsLock?: boolean } } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );
  const { subscribe } = useKeyboardInput();
  const { registerComponentReset } = useAppReset();
  const { mouseEnabled } = useMouse();
  const editorCursor = mouseEnabled ? "none" : isOverwrite ? "cell" : "text";
  
  // Use refs to access current state values without causing re-subscriptions
  const textRef = useRef(text);
  const isOverwriteRef = useRef(isOverwrite);
  // Tracks the intended cursor position synchronously so fast typing stays
  // in order even when multiple setTimeout callbacks are still queued.
  const intendedCursorPosRef = useRef(0);
  const selectionAnchorRef = useRef(0);
  const findQueryRef = useRef<string | null>(null);
  const historyRef = useRef<EditorSnapshot[]>([
    { text: '', cursor: 0, selStart: 0, selEnd: 0 },
  ]);
  const historyIndexRef = useRef(0);
  
  // Log mount / unmount
  useEffect(() => {
    dbg('mounted');
    return () => dbg('unmounted');
  }, []);

  // Update refs when state changes
  useEffect(() => {
    textRef.current = text;
    dbg('text changed', { length: text.length });
  }, [text]);
  
  useEffect(() => {
    isOverwriteRef.current = isOverwrite;
    dbg('overwrite mode changed', { isOverwrite });
  }, [isOverwrite]);

  const lines = text.split('\n');
  const currentLine = text.substring(0, cursorPos).split('\n').length;
  const currentCol = text.substring(0, cursorPos).split('\n').pop()?.length || 0;
  const hasSelection = selectionRange.start !== selectionRange.end;

  const updateEditorVisuals = (posOverride?: number) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const currentText = textRef.current;
    const overwriteEnabled = isOverwriteRef.current;
    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;
    setSelectionRange((prev) =>
      prev.start === selStart && prev.end === selEnd
        ? prev
        : { start: selStart, end: selEnd },
    );

    if (selStart !== selEnd) {
      setSelectionRects(getSelectionRects(textarea, selStart, selEnd));
      const focusPos = getSelectionFocus(selectionAnchorRef.current, selStart, selEnd);
      const coords = getCaretCoordinates(textarea, focusPos);
      const isVisible =
        textarea.clientHeight <= 0 ||
        (coords.top + coords.height > 0 && coords.top < textarea.clientHeight);
      setCaretMode('selection');
      setCaretVisible(isVisible);
      setCaretPos({
        top: coords.top,
        left: coords.left,
        height: coords.height,
        width: 2,
      });
      return;
    }

    setSelectionRects([]);

    const pos = posOverride !== undefined ? posOverride : intendedCursorPosRef.current;
    const coords = getCaretCoordinates(textarea, pos);
    const canOverwrite =
      overwriteEnabled && pos < currentText.length && currentText[pos] !== '\n';

    let width = 2;
    if (canOverwrite) {
      width = Math.max(coords.width, 8);
    }

    const isVisible =
      textarea.clientHeight <= 0 ||
      (coords.top + coords.height > 0 && coords.top < textarea.clientHeight);

    dbg('updateEditorVisuals', { pos, coords, width, isVisible, canOverwrite, hasSelection: false });

    setCaretMode(canOverwrite ? 'overwrite' : 'insert');
    setCaretVisible(isVisible);
    setCaretPos({
      top: coords.top,
      left: coords.left,
      height: coords.height,
      width,
    });
  };

  const resetDocument = useCallback(() => {
    textRef.current = '';
    intendedCursorPosRef.current = 0;
    selectionAnchorRef.current = 0;
    findQueryRef.current = null;
    historyRef.current = [{ ...EMPTY_EDITOR_SNAPSHOT }];
    historyIndexRef.current = 0;

    setText('');
    setCursorPos(0);
    setSelectionRange({ start: 0, end: 0 });
    setSelectionRects([]);
    setLastKeyPress(null);
    setIsTyping(false);
    setCaretMode('insert');
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    setTimeout(() => {
      if (!textareaRef.current) return;
      textareaRef.current.selectionStart = 0;
      textareaRef.current.selectionEnd = 0;
      updateEditorVisuals(0);
    }, 0);
  }, []);

  useEffect(() => registerComponentReset(resetDocument), [registerComponentReset, resetDocument]);

  const handleMouseDown = () => {
    if (textareaRef.current) {
      selectionAnchorRef.current = textareaRef.current.selectionStart;
    }
  };

  const handleClick = () => {
    dbg('handleClick (onClick/onMouseUp) scheduled');
    setTimeout(() => {
      if (textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current;
        intendedCursorPosRef.current = selectionEnd;
        setCursorPos(selectionEnd);
        setSelectionRange({ start: selectionStart, end: selectionEnd });
        updateEditorVisuals(selectionEnd);
      }
    }, 0);
  };

  const scrollCaretIntoView = (position?: number) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const pos = position !== undefined ? position : textarea.selectionStart;
    const coords = getCaretCoordinates(textarea, pos);

    dbg('scrollCaretIntoView', { pos, coords });
    
    if (coords.top < 0) {
      textarea.scrollTop = textarea.scrollTop + coords.top - 10;
    } else if (coords.top + coords.height > textarea.clientHeight) {
      textarea.scrollTop = textarea.scrollTop + (coords.top + coords.height - textarea.clientHeight) + 10;
    }
    
    if (coords.left < 0) {
      textarea.scrollLeft = textarea.scrollLeft + coords.left - 10;
    } else if (coords.left + coords.width > textarea.clientWidth) {
      textarea.scrollLeft = textarea.scrollLeft + (coords.left + coords.width - textarea.clientWidth) + 10;
    }
    
    // Pass pos explicitly so this still works correctly when called from inside a stale
    // closure (e.g. handleVirtualKeyPress via useCallback with [] deps).
    setTimeout(() => updateEditorVisuals(pos), 0);
  };

  useEffect(() => {
    dbg('effect[cursorPos,text,isOverwrite] fired', {
      cursorPos,
      textLength: text.length,
      isOverwrite,
    });
    updateEditorVisuals();
  }, [cursorPos, text, isOverwrite]);

  // Initial layout pass — textarea dimensions are 0 until after first paint
  useEffect(() => {
    const raf = requestAnimationFrame(() => updateEditorVisuals());
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;

    dbg('handleKeyDown', {
      key: e.key,
      start,
      selectionEnd: textarea.selectionEnd,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
      shift: e.shiftKey,
    });

    // Update last keypress display
    setLastKeyPress({
      key: e.key,
      modifiers: {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey,
        capsLock: e.getModifierState('CapsLock'),
      }
    });

    if (e.key === 'Insert') {
      e.preventDefault();
      dbg('handleKeyDown → Insert: toggling insert/overwrite', { next: !insert });
      toggleInsert();
      setTimeout(() => updateEditorVisuals(), 0);
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      
      setIsTyping(true);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 500);
      
      if (isOverwrite && start < text.length && text[start] !== '\n') {
        const newText = text.substring(0, start) + e.key + text.substring(start + 1);
        const newPos = start + 1;
        dbg('handleKeyDown → printable (overwrite)', { key: e.key, start, nextPos: newPos });
        intendedCursorPosRef.current = newPos;
        textRef.current = newText;
        setText(newText);
        setCursorPos(newPos);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = newPos;
          scrollCaretIntoView(newPos);
        }, 0);
      } else {
        const newText = text.substring(0, start) + e.key + text.substring(start);
        const newPos = start + 1;
        dbg('handleKeyDown → printable (insert)', { key: e.key, start, nextPos: newPos });
        intendedCursorPosRef.current = newPos;
        textRef.current = newText;
        setText(newText);
        setCursorPos(newPos);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = newPos;
          scrollCaretIntoView(newPos);
        }, 0);
      }
      return;
    }

    dbg('handleKeyDown → non-printable fallthrough', { key: e.key, start });
    setTimeout(() => {
      if (textarea) {
        dbg('handleKeyDown → non-printable timer: setCursorPos', textarea.selectionStart);
        setCursorPos(textarea.selectionStart);
        scrollCaretIntoView();
      }
    }, 10);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Capture position NOW, before React's re-render resets selectionStart to 0
    const pos = e.target.selectionStart;
    intendedCursorPosRef.current = pos;
    dbg('handleInput (onChange)', { pos, valueLength: e.target.value.length });
    setText(e.target.value);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = pos;
        dbg('handleInput timer: restoring selectionStart + setCursorPos', pos);
        setCursorPos(pos);
      }
    }, 0);
  };

  const handleSelect = () => {
    setTimeout(() => {
      if (!textareaRef.current) return;
      const { selectionStart, selectionEnd } = textareaRef.current;
      intendedCursorPosRef.current = selectionEnd;
      setCursorPos(selectionEnd);
      setSelectionRange({ start: selectionStart, end: selectionEnd });
      updateEditorVisuals(selectionEnd);
    }, 0);
  };

  const handleScroll = () => {
    updateEditorVisuals();
  };

  // Format keypress for display
  const formatKeyPress = (key: string, modifiers?: { shift?: boolean; ctrl?: boolean; alt?: boolean; meta?: boolean; capsLock?: boolean; fn?: boolean }): string => {
    const displayModifiers = modifiersForKeyDisplay(key, modifiers ?? {});
    const parts: string[] = [];
    
    if (displayModifiers.ctrl) parts.push('Ctrl');
    if (displayModifiers.meta) parts.push('Win');
    if (displayModifiers.alt) parts.push('Alt');
    if (displayModifiers.shift) parts.push('Shift');
    if (displayModifiers.fn) parts.push('Fn');
    
    // Format the key name
    let keyName = key;
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'Enter': 'Enter',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'Tab': 'Tab',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'PageUp',
      'PageDown': 'PageDown',
      'Insert': 'Insert',
      'Escape': 'Esc',
      'Fn': 'Fn',
      'Shift': 'Shift',
      'Control': 'Ctrl',
      'Alt': 'Alt',
      'Meta': 'Win',
      'Windows': 'Win',
      'CapsLock': 'CapsLock',
      'NumLock': 'NumLock',
      'ScrollLock': 'ScrollLock',
      'PrintScreen': 'PrintScreen',
      'Pause': 'Pause',
      'Break': 'Break',
      'F1': 'F1',
      'F2': 'F2',
      'F3': 'F3',
      'F4': 'F4',
      'F5': 'F5',
      'F6': 'F6',
      'F7': 'F7',
      'F8': 'F8',
      'F9': 'F9',
      'F10': 'F10',
      'F11': 'F11',
      'F12': 'F12',
    };
    
    // Map Fn function names to readable display names
    const fnFunctionMap: Record<string, string> = {
      'VolumeMute': 'Mute',
      'Volume-': 'Vol-',
      'Volume+': 'Vol+',
      'Brightness-': 'Bright-',
      'Brightness+': 'Bright+',
      'KeyboardBacklight-': 'KB Light-',
      'KeyboardBacklight+': 'KB Light+',
      'SleepMode': 'Sleep',
      'AirplaneMode': 'Airplane',
      'TurnOffScreen': 'Screen Off',
      'DisplayModeSwitch': 'Display',
      'TouchpadToggle': 'Touchpad',
      'PlayPause': 'Play/Pause',
      'NextTrack': 'Next',
      'PreviousTrack': 'Prev',
      'NumLock': 'NumLock',
      'CapsLock': 'CapsLock',
      'ScrollLock': 'ScrollLock',
    };
    
    // Check if it's an Fn function name
    if (fnFunctionMap[key]) {
      keyName = fnFunctionMap[key];
    } else if (keyMap[key]) {
      keyName = keyMap[key];
    } else if (key.length === 1) {
      // For single character keys, show them as-is
      keyName = key;
    }
    
    if (parts.length > 0) {
      return `${parts.join(' + ')} + ${keyName}`;
    }
    return keyName;
  };

  // Handle virtual keyboard input
  const handleVirtualKeyPress = useCallback((key: string, modifiers?: { shift?: boolean; ctrl?: boolean; alt?: boolean; meta?: boolean; capsLock?: boolean; fn?: boolean }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Update last keypress display
    setLastKeyPress({ key, modifiers });

    const domStart = textarea.selectionStart;
    const domEnd = textarea.selectionEnd;
    const hasSelection = domStart !== domEnd;
    const selStart = hasSelection ? Math.min(domStart, domEnd) : intendedCursorPosRef.current;
    const selEnd = hasSelection ? Math.max(domStart, domEnd) : intendedCursorPosRef.current;
    const focus = hasSelection
      ? getSelectionFocus(selectionAnchorRef.current, selStart, selEnd)
      : intendedCursorPosRef.current;
    // For normal typing (no selection) use the intended position so rapid key presses
    // stay in sequence even before previous setTimeout callbacks have run.
    const start = hasSelection ? selStart : intendedCursorPosRef.current;
    const end   = hasSelection ? selEnd   : intendedCursorPosRef.current;
    const ctrlOrMeta = modifiers?.ctrl || modifiers?.meta;
    const currentText = textRef.current;
    const currentIsOverwrite = isOverwriteRef.current;

    dbg('handleVirtualKeyPress', { key, modifiers, start, end, hasSelection, textLength: currentText.length });

    const applyEditorSnapshot = (snap: EditorSnapshot) => {
      intendedCursorPosRef.current = snap.cursor;
      textRef.current = snap.text;
      if (snap.selStart === snap.selEnd) {
        selectionAnchorRef.current = snap.cursor;
      }
      setSelectionRange({ start: snap.selStart, end: snap.selEnd });
      setText(snap.text);
      setCursorPos(snap.cursor);
      setTimeout(() => {
        if (!textareaRef.current) return;
        textareaRef.current.selectionStart = snap.selStart;
        textareaRef.current.selectionEnd = snap.selEnd;
        scrollCaretIntoView(snap.cursor);
      }, 0);
    };

    const commitMutation = (snap: EditorSnapshot) => {
      const hist = historyRef.current.slice(0, historyIndexRef.current + 1);
      hist.push(snap);
      if (hist.length > 100) hist.shift();
      historyRef.current = hist;
      historyIndexRef.current = hist.length - 1;
      applyEditorSnapshot(snap);
    };

    const editorState: EditorSnapshot = {
      text: currentText,
      cursor: focus,
      selStart: start,
      selEnd: end,
    };

    const shortcut = resolveDocumentShortcut({
      key,
      modifiers,
      state: editorState,
      selectionAnchor: hasSelection ? selectionAnchorRef.current : focus,
      findQuery: findQueryRef.current,
    });

    if (shortcut.handled) {
      if (shortcut.findQuery !== undefined) {
        findQueryRef.current = shortcut.findQuery;
      }
      if (shortcut.selectionAnchor !== undefined) {
        selectionAnchorRef.current = shortcut.selectionAnchor;
      }
      if (shortcut.sideEffect === 'undo') {
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          applyEditorSnapshot(historyRef.current[historyIndexRef.current]);
        }
        return;
      }
      if (shortcut.sideEffect === 'redo') {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyIndexRef.current++;
          applyEditorSnapshot(historyRef.current[historyIndexRef.current]);
        }
        return;
      }
      if (shortcut.sideEffect === 'copy') {
        if (hasSelection) {
          navigator.clipboard.writeText(currentText.substring(start, end));
        }
        return;
      }
      if (shortcut.sideEffect === 'cut') {
        if (hasSelection) {
          navigator.clipboard.writeText(currentText.substring(start, end));
          commitMutation({
            text: currentText.substring(0, start) + currentText.substring(end),
            cursor: start,
            selStart: start,
            selEnd: start,
          });
        }
        return;
      }
      if (shortcut.sideEffect === 'paste') {
        navigator.clipboard.readText().then(pastedText => {
          const newPos = start + pastedText.length;
          commitMutation({
            text: currentText.substring(0, start) + pastedText + currentText.substring(end),
            cursor: newPos,
            selStart: newPos,
            selEnd: newPos,
          });
        }).catch(() => {
          dbg('vkp → paste: clipboard access denied');
        });
        return;
      }
      if (shortcut.snapshot) {
        if (ctrlOrMeta && key.toLowerCase() === 'n') {
          historyRef.current = [shortcut.snapshot];
          historyIndexRef.current = 0;
          findQueryRef.current = null;
          applyEditorSnapshot(shortcut.snapshot);
          return;
        }
        if (shortcut.snapshot.text !== currentText) {
          commitMutation(shortcut.snapshot);
        } else {
          applyEditorSnapshot(shortcut.snapshot);
        }
        return;
      }
      return;
    }

    // Handle Insert key (toggle insert/overwrite via shared lock state)
    if (key === 'Insert') {
      dbg('vkp → Insert: toggling insert/overwrite', { next: !insert });
      toggleInsert();
      setTimeout(() => updateEditorVisuals(), 0);
      return;
    }

    // Handle Ctrl/Cmd + A (Select All)
    if (ctrlOrMeta && key.toLowerCase() === 'a') {
      dbg('vkp → Ctrl+A: select all');
      selectionAnchorRef.current = 0;
      intendedCursorPosRef.current = currentText.length;
      textarea.selectionStart = 0;
      textarea.selectionEnd = currentText.length;
      setSelectionRange({ start: 0, end: currentText.length });
      setCursorPos(currentText.length);
      setTimeout(() => updateEditorVisuals(currentText.length), 0);
      return;
    }

    // Handle Ctrl/Cmd + C (Copy)
    if (ctrlOrMeta && key.toLowerCase() === 'c') {
      dbg('vkp → Ctrl+C: copy', { hasSelection, chars: end - start });
      if (hasSelection) {
        navigator.clipboard.writeText(currentText.substring(start, end));
      }
      return;
    }

    // Handle Ctrl/Cmd + X (Cut)
    if (ctrlOrMeta && key.toLowerCase() === 'x') {
      dbg('vkp → Ctrl+X: cut', { hasSelection, start, end });
      if (hasSelection) {
        navigator.clipboard.writeText(currentText.substring(start, end));
        commitMutation({
          text: currentText.substring(0, start) + currentText.substring(end),
          cursor: start,
          selStart: start,
          selEnd: start,
        });
      }
      return;
    }

    // Handle Ctrl/Cmd + V (Paste)
    if (ctrlOrMeta && key.toLowerCase() === 'v') {
      dbg('vkp → Ctrl+V: paste start', { start, end });
      navigator.clipboard.readText().then(pastedText => {
        const newPos = start + pastedText.length;
        commitMutation({
          text: currentText.substring(0, start) + pastedText + currentText.substring(end),
          cursor: newPos,
          selStart: newPos,
          selEnd: newPos,
        });
      }).catch(() => {
        dbg('vkp → Ctrl+V: clipboard access denied');
      });
      return;
    }

    // Handle Backspace
    if (key === 'Backspace') {
      if (hasSelection) {
        dbg('vkp → Backspace: delete selection', { start, end });
        commitMutation({
          text: currentText.substring(0, start) + currentText.substring(end),
          cursor: start,
          selStart: start,
          selEnd: start,
        });
      } else if (start > 0) {
        dbg('vkp → Backspace: delete char at', start - 1);
        commitMutation({
          text: currentText.substring(0, start - 1) + currentText.substring(start),
          cursor: start - 1,
          selStart: start - 1,
          selEnd: start - 1,
        });
      } else {
        dbg('vkp → Backspace: nothing to delete (start=0)');
      }
      return;
    }

    // Handle Delete
    if (key === 'Delete') {
      if (hasSelection) {
        dbg('vkp → Delete: delete selection', { start, end });
        commitMutation({
          text: currentText.substring(0, start) + currentText.substring(end),
          cursor: start,
          selStart: start,
          selEnd: start,
        });
      } else if (start < currentText.length) {
        dbg('vkp → Delete: delete char at', start);
        commitMutation({
          text: currentText.substring(0, start) + currentText.substring(start + 1),
          cursor: start,
          selStart: start,
          selEnd: start,
        });
      } else {
        dbg('vkp → Delete: nothing to delete (at end)');
      }
      return;
    }

    // Handle Enter
    if (key === 'Enter') {
      const enterPos = start + 1;
      dbg('vkp → Enter', { start, nextPos: enterPos });
      setIsTyping(true);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 500);

      commitMutation({
        text: currentText.substring(0, start) + '\n' + currentText.substring(end),
        cursor: enterPos,
        selStart: enterPos,
        selEnd: enterPos,
      });
      return;
    }

    // Handle Tab
    if (key === 'Tab') {
      dbg('vkp → Tab', { start });
      setIsTyping(true);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 500);

      const tabText = '  ';
      const tabPos = start + tabText.length;
      commitMutation({
        text: currentText.substring(0, start) + tabText + currentText.substring(end),
        cursor: tabPos,
        selStart: tabPos,
        selEnd: tabPos,
      });
      return;
    }

    // Handle Arrow keys
    if (key === 'ArrowLeft') {
      const newPos = Math.max(0, start - 1);
      dbg('vkp → ArrowLeft', { from: start, to: newPos });
      selectionAnchorRef.current = newPos;
      intendedCursorPosRef.current = newPos;
      textarea.selectionStart = textarea.selectionEnd = newPos;
      setCursorPos(newPos);
      scrollCaretIntoView(newPos);
      return;
    }

    if (key === 'ArrowRight') {
      const newPos = Math.min(currentText.length, start + 1);
      dbg('vkp → ArrowRight', { from: start, to: newPos });
      selectionAnchorRef.current = newPos;
      intendedCursorPosRef.current = newPos;
      textarea.selectionStart = textarea.selectionEnd = newPos;
      setCursorPos(newPos);
      scrollCaretIntoView(newPos);
      return;
    }

    if (key === 'ArrowUp') {
      const lines = currentText.substring(0, start).split('\n');
      const currentLine = lines.length - 1;
      const currentCol = lines[currentLine]?.length || 0;
      
      if (currentLine > 0) {
        const prevLine = lines[currentLine - 1];
        const newCol = Math.min(currentCol, prevLine.length);
        const newPos = currentText.substring(0, start).lastIndexOf('\n') - (lines[currentLine]?.length || 0) + newCol;
        const actualPos = Math.max(0, newPos);
        dbg('vkp → ArrowUp', { from: start, to: actualPos, currentLine });
        selectionAnchorRef.current = actualPos;
        intendedCursorPosRef.current = actualPos;
        textarea.selectionStart = textarea.selectionEnd = actualPos;
        setCursorPos(actualPos);
        scrollCaretIntoView(actualPos);
      } else {
        dbg('vkp → ArrowUp: already on first line');
      }
      return;
    }

    if (key === 'ArrowDown') {
      const lines = currentText.substring(0, start).split('\n');
      const currentLine = lines.length - 1;
      const currentCol = lines[currentLine]?.length || 0;
      const remainingText = currentText.substring(start);
      const nextLineBreak = remainingText.indexOf('\n');
      
      if (nextLineBreak !== -1) {
        const nextLine = remainingText.substring(0, nextLineBreak);
        const newCol = Math.min(currentCol, nextLine.length);
        const newPos = start + nextLineBreak + 1 + newCol;
        dbg('vkp → ArrowDown', { from: start, to: newPos, currentLine });
        selectionAnchorRef.current = newPos;
        intendedCursorPosRef.current = newPos;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        setCursorPos(newPos);
        scrollCaretIntoView(newPos);
      } else {
        const endPos = currentText.length;
        dbg('vkp → ArrowDown: no next line → end of doc', endPos);
        selectionAnchorRef.current = endPos;
        intendedCursorPosRef.current = endPos;
        textarea.selectionStart = textarea.selectionEnd = endPos;
        setCursorPos(endPos);
        scrollCaretIntoView(endPos);
      }
      return;
    }

    // Handle Home
    if (key === 'Home') {
      const lines = currentText.substring(0, start).split('\n');
      const currentLineStart = start - (lines[lines.length - 1]?.length || 0);
      dbg('vkp → Home', { from: start, to: currentLineStart });
      selectionAnchorRef.current = currentLineStart;
      intendedCursorPosRef.current = currentLineStart;
      textarea.selectionStart = textarea.selectionEnd = currentLineStart;
      setCursorPos(currentLineStart);
      scrollCaretIntoView(currentLineStart);
      return;
    }

    // Handle End
    if (key === 'End') {
      const lines = currentText.substring(0, start).split('\n');
      const currentLineStart = start - (lines[lines.length - 1]?.length || 0);
      const remainingText = currentText.substring(currentLineStart);
      const nextLineBreak = remainingText.indexOf('\n');
      const lineEnd = nextLineBreak === -1 ? currentText.length : currentLineStart + nextLineBreak;
      dbg('vkp → End', { from: start, to: lineEnd });
      selectionAnchorRef.current = lineEnd;
      intendedCursorPosRef.current = lineEnd;
      textarea.selectionStart = textarea.selectionEnd = lineEnd;
      setCursorPos(lineEnd);
      scrollCaretIntoView(lineEnd);
      return;
    }

    // Handle PageUp (move to start of document)
    if (key === 'PageUp') {
      dbg('vkp → PageUp: jump to 0');
      selectionAnchorRef.current = 0;
      intendedCursorPosRef.current = 0;
      textarea.selectionStart = textarea.selectionEnd = 0;
      setCursorPos(0);
      scrollCaretIntoView(0);
      return;
    }

    // Handle PageDown (move to end of document)
    if (key === 'PageDown') {
      const endPos = currentText.length;
      dbg('vkp → PageDown: jump to end', endPos);
      selectionAnchorRef.current = endPos;
      intendedCursorPosRef.current = endPos;
      textarea.selectionStart = textarea.selectionEnd = endPos;
      setCursorPos(endPos);
      scrollCaretIntoView(endPos);
      return;
    }

    // Handle printable characters (single character)
    if (key.length === 1 && !ctrlOrMeta && !modifiers?.alt) {
      setIsTyping(true);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 500);

      if (currentIsOverwrite && !hasSelection && start < currentText.length && currentText[start] !== '\n') {
        const newPos = start + 1;
        dbg('vkp → printable (overwrite)', { key, start, nextPos: newPos });
        commitMutation({
          text: currentText.substring(0, start) + key + currentText.substring(start + 1),
          cursor: newPos,
          selStart: newPos,
          selEnd: newPos,
        });
      } else {
        const newPos = start + 1;
        dbg('vkp → printable (insert)', { key, start, nextPos: newPos });
        commitMutation({
          text: currentText.substring(0, start) + key + currentText.substring(end),
          cursor: newPos,
          selStart: newPos,
          selEnd: newPos,
        });
      }
    } else {
      dbg('vkp → unhandled key', { key, ctrlOrMeta, alt: modifiers?.alt });
    }
  }, []);

  // Subscribe to virtual keyboard input
  useEffect(() => {
    const unsubscribe = subscribe(handleVirtualKeyPress);
    return unsubscribe;
  }, [subscribe, handleVirtualKeyPress]);

  return (
    <motion.div
      ref={setContainerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`h-full flex flex-col relative w-full bg-card/40 backdrop-blur-md rounded-xl transition-all duration-300 ease-in-out overflow-hidden group${mouseEnabled ? " cursor-none [&_*]:!cursor-none" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center justify-between gap-2 sm:gap-2.5 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-3.5 border-b border-border/20 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent flex-shrink-0"
      >
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="flex gap-1 sm:gap-2">
            {[
              { color: "bg-[#ff5f57]" },
              { color: "bg-yellow-500" },
              { color: "bg-[#28ca42]" },
            ].map((dot, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: 0.15 + index * 0.05 }}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full ${dot.color}`}
              />
            ))}
          </div>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-[10px] sm:text-xs font-medium text-foreground/80 ml-1 sm:ml-2 font-mono truncate"
          >
            Document.txt
          </motion.span>
        </div>
        {onToggleFullscreen && (
          <motion.button
            onClick={onToggleFullscreen}
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="p-1.5 rounded-lg border border-border/30 bg-card/40 hover:bg-card/60 hover:border-primary/40 opacity-0 group-hover:opacity-100"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <motion.div
              key={isFullscreen ? "minimize" : "maximize"}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-foreground/70" />
              ) : (
                <Maximize2 className="w-4 h-4 text-foreground/70" />
              )}
            </motion.div>
          </motion.button>
        )}
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex-1 min-h-0 pl-6 pr-2 overflow-hidden relative"
        style={{ cursor: editorCursor }}
      >
        <div className="h-full min-h-0 overflow-auto custom-scrollbar" onScroll={handleScroll}>
          <div className="relative w-full h-full min-h-full">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onMouseUp={handleClick}
            onSelect={handleSelect}
            className="document-editor-textarea w-full h-full min-h-full font-mono text-xs sm:text-sm md:text-base leading-relaxed bg-transparent text-foreground resize-none outline-none border-none focus:ring-0 focus:outline-none whitespace-pre-wrap break-words hide-scrollbar block"
            placeholder="Start typing... Press Insert to toggle overwrite mode"
            spellCheck={false}
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              cursor: editorCursor,
              caretColor: 'transparent',
              lineHeight: '1.5',
              padding: 0,
            }}
          />
          {selectionRects.map((rect, index) => (
            <div
              key={`sel-${index}-${rect.top}-${rect.left}`}
              className="absolute pointer-events-none rounded-sm"
              style={{
                left: `${rect.left}px`,
                top: `${rect.top}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                backgroundColor: EDITOR_SELECTION_BG,
              }}
            />
          ))}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${caretPos.left}px`,
              top: `${caretPos.top}px`,
              width: `${caretPos.width}px`,
              height: `${caretPos.height}px`,
              display: caretVisible ? 'block' : 'none',
              ...(caretMode === 'selection'
                ? {
                    backgroundColor: EDITOR_CARET_BG,
                    borderRadius: '1px',
                    animation: 'doc-editor-caret-blink 1s step-end infinite',
                  }
                : caretMode === 'overwrite'
                  ? {
                      backgroundColor: EDITOR_OVERWRITE_BG,
                      border: `2px solid ${EDITOR_OVERWRITE_BORDER}`,
                      borderRadius: '2px',
                      boxSizing: 'border-box',
                      animation: 'none',
                    }
                  : {
                      backgroundColor: EDITOR_CARET_BG,
                      borderRadius: '1px',
                      animation: isTyping ? 'none' : 'doc-editor-caret-blink 1s step-end infinite',
                    }),
            }}
          />
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 border-t border-border/20 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent flex justify-between items-center gap-2 text-[10px] sm:text-xs text-foreground/70 font-mono flex-shrink-0"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {[
            { label: "Chars", value: text.length },
            { label: "Lines", value: lines.length },
            { label: "Pos", value: `${currentLine}:${currentCol + 1}` },
            { label: "Mode", value: isOverwrite ? "OVR" : "INS" },
          ].map((stat, index) => (
            <motion.span
              key={stat.label}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
              className={`font-medium truncate ${stat.label === 'Mode' ? (isOverwrite ? 'text-amber-500/90' : 'text-primary/80') : ''}`}
            >
              {stat.label}: {stat.value}
            </motion.span>
          ))}
        </div>
        {lastKeyPress && (
          <motion.div
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="font-medium truncate text-primary/80"
          >
            {formatKeyPress(lastKeyPress.key, lastKeyPress.modifiers)}
          </motion.div>
        )}
      </motion.div>
      <style>{`
        .document-editor-textarea::selection {
          background: color-mix(in srgb, var(--primary) 38%, transparent);
          color: inherit;
        }
        @keyframes doc-editor-caret-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
});

export default DocumentEditor;
