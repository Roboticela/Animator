'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createDebugLogger } from '@/lib/debug';

const dbgKbd = createDebugLogger('Keyboard');
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import KeyboardLoader from './KeyboardLoader';
import { AsusUX370UAR } from './Asus-UX370UAR';
import { DellLatitude53002In1 } from './Dell-Latitude-5300-2-in-1';
import { DellLatitudeE7270 } from './Dell-Latitude-E7270';
import { HPEliteBook820G4 } from './HP-EliteBook-820-G4';
import { ToshibaPortegeX30E } from './Toshiba-Portege-X30-E';
import { PC } from './PC';
import { useHand } from '@/contexts/HandContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFullscreen } from '@/contexts/FullscreenContext';
import { useKeyboardView } from '@/contexts/KeyboardViewContext';
import { useKeyboardSync } from '@/contexts/KeyboardSyncContext';
import { useArrow } from '@/contexts/ArrowContext';
import { useMouse } from '@/contexts/MouseContext';
import { useKeyboardType } from '@/contexts/KeyboardTypeContext';
import { useKeyboardLock } from '@/contexts/KeyboardLockContext';
import { useKeyboardInput } from '@/contexts/KeyboardInputContext';
import { useFnFunction } from '@/contexts/FnFunctionContext';
import { useSystemState } from '@/contexts/SystemStateContext';
import { getKeyboardConfig } from '@/lib/keyboard-configs';
import type { KeyboardButton } from '@/lib/keyboard-button-types';
import {
  dispatchKeyPressToast,
  KEY_PRESS_TOAST_EVENT,
} from '@/lib/keyboard-shortcut-toasts';
import { modifiersForKeyDisplay, isMetaKeyEvent, shouldPropagateNavArrowToBrowser, shouldControlVirtualMouseWithArrow } from '@/lib/key-display';

const NUMPAD_ALWAYS_PRIMARY_IDS = new Set([
  'numlock',
  'num-slash',
  'num-multiply',
  'num-minus',
  'num-plus',
  'num-enter',
]);

const NUMPAD_CODE_TO_BUTTON_ID: Record<string, string> = {
  Numpad0: 'num0',
  Numpad1: 'num1',
  Numpad2: 'num2',
  Numpad3: 'num3',
  Numpad4: 'num4',
  Numpad5: 'num5',
  Numpad6: 'num6',
  Numpad7: 'num7',
  Numpad8: 'num8',
  Numpad9: 'num9',
  NumpadDecimal: 'num-period',
  NumpadAdd: 'num-plus',
  NumpadSubtract: 'num-minus',
  NumpadMultiply: 'num-multiply',
  NumpadDivide: 'num-slash',
  NumpadEnter: 'num-enter',
};

/** When Num Lock is off, numpad digit keys act as navigation keys (Home, arrows, etc.). */
function resolveKeyFromConfig(
  buttonConfig: Pick<KeyboardButton, 'id' | 'primary' | 'secondary'>,
  numLock: boolean,
): { primary: string; secondary: string } {
  const primary = buttonConfig.primary;
  const secondary = buttonConfig.secondary || '';

  if (
    buttonConfig.id.startsWith('num') &&
    !NUMPAD_ALWAYS_PRIMARY_IDS.has(buttonConfig.id) &&
    !numLock &&
    secondary
  ) {
    return { primary: secondary, secondary: '' };
  }

  return { primary, secondary };
}

// Generic component to detect hover and click on all keyboard buttons using actual DOM element positions
function KeyboardButtonHoverDetector({ css3DRendererRef }: { css3DRendererRef: React.MutableRefObject<CSS3DRenderer | null>, css3DObjectRef: React.MutableRefObject<CSS3DObject | null> }) {
  const { gl } = useThree();
  const { theme } = useTheme();
  const { keyboardType } = useKeyboardType();
  const {
    capsLock,
    numLock,
    scrollLock,
    insert,
    fnLock,
    fnHold,
    winLock,
    toggleCapsLock,
    toggleNumLock,
    toggleScrollLock,
    toggleFnLock,
    toggleFnHold,
  } = useKeyboardLock();
  const { handleKeyPress } = useKeyboardInput();
  const { handleFnFunction } = useFnFunction();
  const { flightMode } = useSystemState();
  const { mouseEnabled, keyboardMouseEnabled, moveVirtualMouse } = useMouse();
  const buttonsRef = useRef<Map<HTMLElement, string>>(new Map());
  const hoveredButtonRef = useRef<HTMLElement | null>(null);
  const clickedButtonsRef = useRef<Set<HTMLElement>>(new Set());
  const originalStylesRef = useRef<Map<HTMLElement, { filter: string; backgroundColor: string; transform: string; boxShadow: string }>>(new Map());
  const toggledModifierKeysRef = useRef<Set<HTMLElement>>(new Set());

  // Helper function to get theme primary color in rgba format
  const getThemeGlowColor = (opacity: number = 0.6): string => {
    // Always get the computed color value to ensure we have the latest theme color
    const testElement = document.createElement('div');
    testElement.style.color = 'var(--primary)';
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.style.pointerEvents = 'none';
    document.body.appendChild(testElement);

    const computedColor = getComputedStyle(testElement).color;
    document.body.removeChild(testElement);

    // Extract RGB values from computed color (format: "rgb(r, g, b)" or "rgba(r, g, b, a)")
    const rgbMatch = computedColor.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Fallback: try to get from CSS variable directly
    const root = document.documentElement;
    let primaryColor = getComputedStyle(root).getPropertyValue('--primary').trim();

    // If primary color is a hex color, convert to rgb
    if (primaryColor.startsWith('#')) {
      const hex = primaryColor.slice(1);
      // Handle both 3-digit and 6-digit hex
      const r = hex.length === 3
        ? parseInt(hex[0] + hex[0], 16)
        : parseInt(hex.substring(0, 2), 16);
      const g = hex.length === 3
        ? parseInt(hex[1] + hex[1], 16)
        : parseInt(hex.substring(2, 4), 16);
      const b = hex.length === 3
        ? parseInt(hex[2] + hex[2], 16)
        : parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Fallback to a default color if parsing fails
    return `rgba(100, 150, 255, ${opacity})`;
  };

  // Helper function to check if a point is over a button
  const getButtonAtPosition = (clientX: number, clientY: number): HTMLElement | null => {
    for (const [buttonElement] of buttonsRef.current) {
      const buttonRect = buttonElement.getBoundingClientRect();

      const isOverButton =
        clientX >= buttonRect.left &&
        clientX <= buttonRect.right &&
        clientY >= buttonRect.top &&
        clientY <= buttonRect.bottom;

      if (isOverButton) {
        return buttonElement;
      }
    }
    return null;
  };

  // Store only transform for animation purposes (get other styles fresh each time)
  const storeOriginalTransform = (button: HTMLElement) => {
    if (!originalStylesRef.current.has(button)) {
      const computedStyle = window.getComputedStyle(button);
      originalStylesRef.current.set(button, {
        filter: 'none', // Not used, but keeping structure
        backgroundColor: 'transparent', // Not used, get fresh each time
        transform: computedStyle.transform || 'none',
        boxShadow: 'none', // Not used, get fresh each time
      });
    }
  };

  // Apply hover effect (brightness + glow)
  const applyHoverEffect = (button: HTMLElement) => {
    storeOriginalTransform(button);
    button.style.filter = 'brightness(1.2)';

    // Get theme-based glow colors
    const glowColor1 = getThemeGlowColor(0.6);
    const glowColor2 = getThemeGlowColor(0.4);

    // Add glow effect, but preserve clicked state's inset box-shadow if present
    const isClicked = clickedButtonsRef.current.has(button);
    const clickGlowColor = getThemeGlowColor(0.4);

    if (isClicked) {
      // If clicked, combine inset shadow with hover glow
      button.style.boxShadow = `inset 0 0 20px ${clickGlowColor}, 0 0 15px ${glowColor1}, 0 0 30px ${glowColor2}`;
    } else {
      // If not clicked, just apply glow
      button.style.boxShadow = `0 0 15px ${glowColor1}, 0 0 30px ${glowColor2}`;
    }

    button.style.transition = 'filter 0.2s ease, box-shadow 0.2s ease';
  };

  // Remove hover effect (but preserve clicked state)
  const removeHoverEffect = (button: HTMLElement) => {
    const isClicked = clickedButtonsRef.current.has(button);
    const clickGlowColor = getThemeGlowColor(0.4);

    // Restore filter - clear inline style to let CSS handle it
    button.style.filter = '';

    // Handle box-shadow: remove hover glow but preserve clicked inset shadow
    if (isClicked) {
      // Button is clicked - restore to just the inset shadow (remove hover glow)
      // Also ensure background color is maintained (clicked state)
      const bgColor = getThemeGlowColor(0.3);
      button.style.backgroundColor = bgColor;
      button.style.boxShadow = `inset 0 0 20px ${clickGlowColor}`;
    } else {
      // Button is not clicked - clear inline styles to let CSS handle it (fresh theme colors)
      button.style.boxShadow = '';
      button.style.backgroundColor = '';
    }
  };

  // Apply click effect (on mousedown)
  const applyClickEffect = (button: HTMLElement) => {
    storeOriginalTransform(button);

    const original = originalStylesRef.current.get(button);
    const isHovered = hoveredButtonRef.current === button;
    const clickGlowColor = getThemeGlowColor(0.4);

    // Change background color using theme color with opacity
    const bgColor = getThemeGlowColor(0.3);
    button.style.backgroundColor = bgColor;

    const hoverGlowColor1 = getThemeGlowColor(0.6);
    const hoverGlowColor2 = getThemeGlowColor(0.4);

    if (isHovered) {
      // If hovered, combine inset with hover glow
      button.style.boxShadow = `inset 0 0 20px ${clickGlowColor}, 0 0 15px ${hoverGlowColor1}, 0 0 30px ${hoverGlowColor2}`;
    } else {
      // If not hovered, just add inset
      button.style.boxShadow = `inset 0 0 20px ${clickGlowColor}`;
    }

    button.style.transition = 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease';

    // Click animation: scale down then back up
    button.style.transform = 'scale(0.95)';

    setTimeout(() => {
      const originalTransform = original?.transform || 'none';
      if (originalTransform === 'none' || originalTransform === '') {
        button.style.transform = '';
      } else {
        button.style.transform = originalTransform;
      }
    }, 250);

    clickedButtonsRef.current.add(button);
  };

  // Remove click effect (on mouseup)
  const removeClickEffect = (button: HTMLElement) => {
    const isHovered = hoveredButtonRef.current === button;

    // Restore original background color - clear inline style to let CSS handle it
    // This ensures we get the current theme's color, not a stored old theme color
    button.style.backgroundColor = '';

    // Restore box-shadow, but preserve hover glow if currently hovered
    if (isHovered) {
      const glowColor1 = getThemeGlowColor(0.6);
      const glowColor2 = getThemeGlowColor(0.4);
      button.style.boxShadow = `0 0 15px ${glowColor1}, 0 0 30px ${glowColor2}`;
    } else {
      // Clear inline style to let CSS handle it (fresh theme colors)
      button.style.boxShadow = '';
    }

    button.style.transition = 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease';

    clickedButtonsRef.current.delete(button);
  };

  useEffect(() => {
    // Find all keyboard buttons after keyboard is rendered
    const findButtons = () => {
      if (!css3DRendererRef.current?.domElement) return false;

      // Find all keyboard elements (supports multiple keyboards)
      const keyboards = css3DRendererRef.current.domElement.querySelectorAll('.keyboard');
      if (keyboards.length === 0) return false;

      const newButtons = new Map<HTMLElement, string>();

      // Find all buttons in all keyboards
      keyboards.forEach((keyboard) => {
        const buttons = keyboard.querySelectorAll('button');
        buttons.forEach((button) => {
          const buttonElement = button as HTMLElement;
          // Get button identifier from class name or data attribute
          // Priority: data-key-name > class name > button text
          let keyName = buttonElement.getAttribute('data-key-name');

          if (!keyName) {
            // Try to extract from class name (e.g., "space-key" -> "space")
            const keyClass = Array.from(buttonElement.classList).find(cls =>
              cls.includes('key') && cls !== 'key'
            );
            if (keyClass) {
              keyName = keyClass.replace('-key', '').replace(/-/g, ' ');
            }
          }

          if (!keyName) {
            // Try to get from button text content
            const textContent = buttonElement.textContent?.trim();
            if (textContent) {
              keyName = textContent.split('\n')[0].trim(); // Get first line
            }
          }

          if (!keyName) {
            keyName = 'unknown';
          }

          newButtons.set(buttonElement, keyName);
        });
      });

      // Clean up styles for buttons that are no longer in the DOM
      const currentButtonSet = new Set(newButtons.keys());
      for (const [oldButton] of buttonsRef.current) {
        if (!currentButtonSet.has(oldButton)) {
          // Restore original styles for removed buttons
          const original = originalStylesRef.current.get(oldButton);
          if (original) {
            oldButton.style.filter = original.filter;
            oldButton.style.backgroundColor = original.backgroundColor;
            oldButton.style.transform = original.transform;
            oldButton.style.boxShadow = original.boxShadow;
          }
          originalStylesRef.current.delete(oldButton);
          clickedButtonsRef.current.delete(oldButton);
        }
      }

      // Clear hover state when buttons change
      if (hoveredButtonRef.current && !currentButtonSet.has(hoveredButtonRef.current)) {
        hoveredButtonRef.current = null;
      }

      // Only update if buttons were found
      if (newButtons.size > 0) {
        buttonsRef.current = newButtons;
        return true;
      }

      return false;
    };

    // Clear all button states when keyboard type changes
    hoveredButtonRef.current = null;
    buttonsRef.current.clear();
    originalStylesRef.current.clear();
    clickedButtonsRef.current.clear();
    toggledModifierKeysRef.current.clear();

    // Try to find buttons, retry if not found
    if (!findButtons()) {
      const timer = setInterval(() => {
        if (findButtons()) {
          clearInterval(timer);
        }
      }, 100);

      return () => clearInterval(timer);
    }

    // Also refresh button list periodically to handle dynamic updates
    const refreshTimer = setInterval(() => {
      findButtons();
    }, 1000);

    return () => {
      clearInterval(refreshTimer);
      // Clean up all applied styles on unmount
      for (const [button, original] of originalStylesRef.current) {
        button.style.filter = original.filter;
        button.style.backgroundColor = original.backgroundColor;
        button.style.transform = original.transform;
        button.style.boxShadow = original.boxShadow;
      }
      originalStylesRef.current.clear();
      clickedButtonsRef.current.clear();
      toggledModifierKeysRef.current.clear();
    };
  }, [css3DRendererRef, keyboardType]);

  // Track which button is currently being pressed
  const pressedButtonRef = useRef<HTMLElement | null>(null);
  // Track if Fn key is currently held/pressed
  const fnKeyPressedRef = useRef<boolean>(false);
  // Key-repeat timers (mimics real keyboard hold behaviour)
  const repeatInitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper function to check if a button is a modifier key
  const isModifierKey = (buttonElement: HTMLElement): boolean => {
    const buttonName = buttonsRef.current.get(buttonElement);
    if (!buttonName) return false;

    const keyboardConfig = getKeyboardConfig(keyboardType);
    if (!keyboardConfig) return false;

    const buttonConfig = keyboardConfig.find(btn => btn.id === buttonName);
    if (!buttonConfig) return false;

    const primary = buttonConfig.primary.toLowerCase();
    if (primary === 'meta') return winLock;
    return primary === 'shift' || primary === 'control' || primary === 'alt' || primary === 'fn';
  };

  const isWinButtonName = (name: string): boolean =>
    name === 'windows-left' || name === 'windows-right' || name === 'windows';

  // Helper function to release all toggled modifier keys
  const releaseAllModifierKeys = () => {
    // Preserve fn key if fnHold is enabled
    let fnButton: HTMLElement | null = null;
    if (fnHold) {
      for (const [btn, name] of buttonsRef.current) {
        if (name === 'fn' && toggledModifierKeysRef.current.has(btn)) {
          fnButton = btn;
          break;
        }
      }
    }

    toggledModifierKeysRef.current.forEach((button) => {
      // Don't release fn key if fnHold is enabled
      if (fnHold && button === fnButton) {
        return;
      }
      removeClickEffect(button);
    });

    toggledModifierKeysRef.current.clear();

    if (fnHold && fnButton) {
      toggledModifierKeysRef.current.add(fnButton);
      fnKeyPressedRef.current = true;
    } else {
      fnKeyPressedRef.current = false;
    }
  };

  // Helper function to check if a modifier key is currently pressed
  const isModifierPressed = (modifierName: string): boolean => {
    for (const [btn, name] of buttonsRef.current) {
      if (toggledModifierKeysRef.current.has(btn)) {
        const keyboardConfig = getKeyboardConfig(keyboardType);
        if (keyboardConfig) {
          // Try to find button config by id first
          let buttonConfig = keyboardConfig.find(btnConfig => btnConfig.id === name);
          // If not found, try to find by matching primary key (for cases where button name doesn't match id)
          if (!buttonConfig) {
            buttonConfig = keyboardConfig.find(btnConfig => 
              btnConfig.primary.toLowerCase() === modifierName.toLowerCase()
            );
          }
          if (buttonConfig && buttonConfig.primary.toLowerCase() === modifierName.toLowerCase()) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Helper function to check if Shift is currently pressed
  const isShiftPressed = (): boolean => {
    return isModifierPressed('shift');
  };

  // Helper function to check if Control is currently pressed
  const isControlPressed = (): boolean => {
    return isModifierPressed('control');
  };

  // Helper function to check if Alt is currently pressed
  const isAltPressed = (): boolean => {
    return isModifierPressed('alt');
  };

  // Helper function to check if Meta/Command is currently pressed
  const isMetaPressed = (): boolean => {
    return isModifierPressed('meta');
  };

  // Helper function to get all currently pressed modifier keys
  const getAllModifiers = () => {
    return {
      shift: isShiftPressed(),
      ctrl: isControlPressed(),
      alt: isAltPressed(),
      meta: isMetaPressed(),
      capsLock: capsLock,
      fn: fnKeyPressedRef.current || fnHold,
    };
  };

  // Helper function to check if a key is a special key (not a printable character)
  const isSpecialKey = (key: string): boolean => {
    const specialKeys = [
      'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'PrintScreen', 'ScrollLock', 'Pause', 'Break',
      'Insert', 'Home', 'PageUp', 'Delete', 'End', 'PageDown',
      'Tab', 'CapsLock', 'Enter', 'Backspace',
      'Shift', 'Control', 'Alt', 'Meta', 'Fn',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'NumLock', 'ScrollLock'
    ];
    return specialKeys.includes(key);
  };

  // Helper function to get the character to insert based on key, shift, and caps lock
  const getCharacterToInsert = (primary: string, secondary: string, isShift: boolean, isCaps: boolean): string | null => {
    // If it's a special key, return the key name
    if (isSpecialKey(primary)) {
      return primary;
    }

    // Handle letter keys
    if (primary.length === 1 && /[a-zA-Z]/.test(primary)) {
      // Normalize primary to lowercase for consistent processing
      const normalizedPrimary = primary.toLowerCase();
      const shouldUppercase = (isShift && !isCaps) || (!isShift && isCaps);
      return shouldUppercase ? normalizedPrimary.toUpperCase() : normalizedPrimary;
    }

    // Handle number row and symbols (including space)
    if (primary.length === 1) {
      // If Shift is pressed and there's a secondary character, use it
      if (isShift && secondary && secondary.length === 1) {
        return secondary;
      }
      // Otherwise return the primary character (handles space, numbers, symbols)
      return primary;
    }

    return null;
  };

  // Add mousedown/mouseup detection for press-and-hold effect
  useEffect(() => {
    if (!gl.domElement) return;
    
    // Clear pressed button when keyboard changes
    if (pressedButtonRef.current) {
      removeClickEffect(pressedButtonRef.current);
      pressedButtonRef.current = null;
    }
    // Clear toggled modifier keys when keyboard changes
    releaseAllModifierKeys();

    // --- Key-repeat helpers (500 ms initial delay, 40 ms repeat rate) ---
    const KEY_REPEAT_DELAY = 500;
    const KEY_REPEAT_INTERVAL = 40;

    const stopKeyRepeat = () => {
      if (repeatInitTimerRef.current !== null) {
        dbgKbd('stopKeyRepeat: clearing init timer');
        clearTimeout(repeatInitTimerRef.current);
        repeatInitTimerRef.current = null;
      }
      if (repeatTickTimerRef.current !== null) {
        dbgKbd('stopKeyRepeat: clearing tick interval');
        clearInterval(repeatTickTimerRef.current);
        repeatTickTimerRef.current = null;
      }
    };

    const startKeyRepeat = (action: () => void) => {
      stopKeyRepeat();
      dbgKbd('startKeyRepeat: scheduling first repeat in', KEY_REPEAT_DELAY, 'ms');
      repeatInitTimerRef.current = setTimeout(() => {
        repeatInitTimerRef.current = null;
        dbgKbd('startKeyRepeat: firing first repeat, then every', KEY_REPEAT_INTERVAL, 'ms');
        action();
        repeatTickTimerRef.current = setInterval(() => {
          dbgKbd('startKeyRepeat: repeat tick');
          action();
        }, KEY_REPEAT_INTERVAL);
      }, KEY_REPEAT_DELAY);
    };

    // Global mouseup safety net: stop repeat even if the canvas mouseup is missed
    // (e.g. when mouse is released outside the canvas or over another element)
    const globalStopKeyRepeat = () => stopKeyRepeat();
    document.addEventListener('mouseup', globalStopKeyRepeat);
    // ------------------------------------------------------------------

    const handleMouseDown = (e: MouseEvent) => {
      if (buttonsRef.current.size === 0) return;
      if (e.button !== 0) return; // Only handle left mouse button

      // Prevent default to avoid stealing focus from textarea
      e.preventDefault();
      e.stopPropagation();

      // Get mouse position
      const clientX = e.clientX;
      const clientY = e.clientY;

      // Check if mouse is over any button
      const buttonUnderMouse = getButtonAtPosition(clientX, clientY);

      if (buttonUnderMouse) {
        const buttonName = buttonsRef.current.get(buttonUnderMouse) || 'unknown';
        
        // Get keyboard configuration for current keyboard type
        const keyboardConfig = getKeyboardConfig(keyboardType);
        let buttonConfig = null;
        if (keyboardConfig) {
          // Find the button config entry that matches this button's ID
          buttonConfig = keyboardConfig.find(btn => btn.id === buttonName);
          if (buttonConfig) {
            console.log('Button Clicked:', {
              id: buttonConfig.id,
              primary: buttonConfig.primary,
              secondary: buttonConfig.secondary || '(empty)',
              fn: buttonConfig.fn || '(empty)'
            });
          } else {
            console.log(`Button "${buttonName}" clicked (no config found)`);
          }
        } else {
          console.log(`Button "${buttonName}" clicked (no keyboard config found for type: ${keyboardType})`);
        }

        // Show key info toast (single keys) or shortcut toast (modifier combos)
        {
          const modifiers = getAllModifiers();
          dispatchKeyPressToast(buttonName, buttonConfig, modifiers, numLock, winLock);
        }

        // Handle Fn key separately - it should be held like a modifier key
        // Only toggle fnHold if it's being toggled from StatusControls, not from keyboard
        if (buttonName === 'fn') {
          // Fn key is pressed - mark it as held (normal modifier behavior)
          fnKeyPressedRef.current = true;
          // Apply click effect to show it's being held
          applyClickEffect(buttonUnderMouse);
          toggledModifierKeysRef.current.add(buttonUnderMouse);
          
          // Send Fn key press event to show it in status bar
          const modifiers = getAllModifiers();
          // Exclude Fn from modifiers to avoid showing "Fn + Fn"
          const displayModifiers = { ...modifiers, fn: false };
          handleKeyPress('Fn', displayModifiers);
          
          return; // Don't process further
        }

        // Handle Esc key (Fn Lock button)
        if (buttonName === 'esc') {
          const modifiers = getAllModifiers();
          
          if (fnLock) {
            // If Fn Lock is enabled
            if (fnKeyPressedRef.current) {
              // Fn + Esc when Fn Lock is enabled → normal Esc behavior (don't toggle Fn Lock)
              // Release Fn key and let Esc process normally, but only if fnHold is not enabled
              if (!fnHold) {
                fnKeyPressedRef.current = false;
                // Find and release Fn button if it's in toggled keys
                for (const [btn, name] of buttonsRef.current) {
                  if (name === 'fn' && toggledModifierKeysRef.current.has(btn)) {
                    removeClickEffect(btn);
                    toggledModifierKeysRef.current.delete(btn);
                    break;
                  }
                }
              }
              // Send Esc for display
              handleKeyPress('Escape', modifiers);
              // Continue to process Esc normally (don't return early)
            } else {
              // Esc alone when Fn Lock is enabled → turn off Fn Lock
              toggleFnLock();
              // Still send Esc for display
              handleKeyPress('Escape', modifiers);
              return; // Don't process as regular key
            }
          } else if (fnKeyPressedRef.current) {
            // If Fn Lock is disabled and Fn is held, Fn + Esc turns it on
            toggleFnLock();
            // Send Esc for display with Fn modifier
            const fnModifiers = getAllModifiers();
            fnModifiers.fn = true;
            handleKeyPress('Escape', fnModifiers);
            // Release Fn key, but only if fnHold is not enabled
            if (!fnHold) {
              fnKeyPressedRef.current = false;
              // Find and release Fn button if it's in toggled keys
              for (const [btn, name] of buttonsRef.current) {
                if (name === 'fn' && toggledModifierKeysRef.current.has(btn)) {
                  removeClickEffect(btn);
                  toggledModifierKeysRef.current.delete(btn);
                  break;
                }
              }
            }
            return; // Don't process as regular key
          } else {
            // Esc alone when Fn Lock is disabled → send for display
            handleKeyPress('Escape', modifiers);
            // Continue to process Esc normally
          }
        }

        // Determine if we should use Fn function:
        // - If Fn Lock is enabled: use fn function directly (no fn needed), primary requires fn
        // - If Fn Lock is disabled: use primary directly, fn function requires fn
        // Logic: use fn function when (fnLock enabled AND fn NOT pressed) OR (fnLock disabled AND fn pressed)
        const shouldUseFnFunction = (fnLock && !fnKeyPressedRef.current) || (!fnLock && fnKeyPressedRef.current);
        let effectiveKeyName = buttonName;
        let fnFunctionToCall: string | null = null;
        
        if (shouldUseFnFunction && buttonConfig) {
          // Fn is pressed and Fn Lock is disabled - check for Fn function
          const fnFunction = buttonConfig.fn?.trim();
          if (fnFunction) {
            // If fn function is a single character (like 'é', 'á'), don't treat it as a system function
            // It will be handled in the character insertion section below
            if (fnFunction.length === 1) {
              // Single character fn function - let it fall through to character insertion
              // Don't store in fnFunctionToCall, it will be handled at line 749
            } else {
              // Map Fn function names to lock key names (for lock keys)
              const fnToLockKeyMap: Record<string, string> = {
                'NumLock': 'numlock',
                'CapsLock': 'capslock',
                'ScrollLock': 'scroll-lock',
                'Insert': 'insert',
              };
              
              const lockKeyName = fnToLockKeyMap[fnFunction];
              if (lockKeyName) {
                effectiveKeyName = lockKeyName;
              } else {
                // Not a lock key - it's a system function, store it to call later
                fnFunctionToCall = fnFunction;
              }
            }
          }
        }

        // Check if this is a lock key that should toggle lock state
        const lockKeyMap: Record<string, () => void> = {
          'capslock': toggleCapsLock,
          'numlock': toggleNumLock,
          'scroll-lock': toggleScrollLock,
        };

        const lockToggle = lockKeyMap[effectiveKeyName];
        if (lockToggle) {
          // This is a lock key - toggle the lock state
          lockToggle();
          
          // Send keypress event for lock key display
          const modifiers = getAllModifiers();
          let displayKeyName = effectiveKeyName;
          // Map lock key names to proper key names
          const lockKeyDisplayMap: Record<string, string> = {
            'capslock': 'CapsLock',
            'numlock': 'NumLock',
            'scroll-lock': 'ScrollLock',
          };
          if (lockKeyDisplayMap[effectiveKeyName]) {
            displayKeyName = lockKeyDisplayMap[effectiveKeyName];
          }
          handleKeyPress(displayKeyName, modifiers);
          
          // Release Fn key if it was held, but only if fnHold is not enabled
          if (fnKeyPressedRef.current && !fnHold) {
            fnKeyPressedRef.current = false;
            // Find and release Fn button if it's in toggled keys
            for (const [btn, name] of buttonsRef.current) {
              if (name === 'fn' && toggledModifierKeysRef.current.has(btn)) {
                removeClickEffect(btn);
                toggledModifierKeysRef.current.delete(btn);
                break;
              }
            }
          }
          // The visual state will be updated by the useEffect that watches lock states
          return; // Don't process as regular modifier key
        }

        // Check if this is a modifier key
        const isModifier = isModifierKey(buttonUnderMouse);

        if (isModifier) {
          // Get current modifier states for display (before toggling)
          const modifiers = getAllModifiers();

          // Toggle modifier key state
          if (toggledModifierKeysRef.current.has(buttonUnderMouse)) {
            // Already toggled - untoggle it
            removeClickEffect(buttonUnderMouse);
            toggledModifierKeysRef.current.delete(buttonUnderMouse);
          } else {
            // Not toggled - toggle it on
            applyClickEffect(buttonUnderMouse);
            toggledModifierKeysRef.current.add(buttonUnderMouse);
            
            // Send keypress event for modifier key display
            // Map button name to key name
            let keyName = buttonName;
            if (buttonConfig) {
              keyName = buttonConfig.primary;
            }
            
            // Create modifiers object excluding the pressed modifier itself
            const displayModifiers: typeof modifiers = { ...modifiers };
            // Remove the pressed modifier from display modifiers to avoid redundancy
            if (keyName.toLowerCase() === 'shift') {
              displayModifiers.shift = false;
            } else if (keyName.toLowerCase() === 'control') {
              displayModifiers.ctrl = false;
            } else if (keyName.toLowerCase() === 'alt') {
              displayModifiers.alt = false;
            } else if (keyName.toLowerCase() === 'meta' || keyName.toLowerCase() === 'command') {
              displayModifiers.meta = false;
            } else if (keyName.toLowerCase() === 'fn') {
              displayModifiers.fn = false;
            }
            
            // Send the modifier key press with other modifiers (excluding itself)
            handleKeyPress(keyName, displayModifiers);
          }
        } else {
          // Non-modifier key - get all modifier states before releasing
          const modifiers = getAllModifiers();
          
          // Apply click effect FIRST for all non-modifier keys to show visual feedback immediately
          // This ensures F keys and other keys light up as soon as they're pressed
          pressedButtonRef.current = buttonUnderMouse;
          applyClickEffect(buttonUnderMouse);
          
          // Handle Fn function if applicable (Fn pressed and Fn Lock disabled)
          if (fnFunctionToCall) {
            // Call the Fn function (e.g., VolumeMute, Brightness+, etc.)
            handleFnFunction(fnFunctionToCall);
            
            // Also send the key press to DocumentEditor to show in status bar
            // Use the primary key (F1, F2, etc.) with Fn modifier
            // Ensure Fn is included in modifiers even if Fn Lock is enabled
            if (buttonConfig) {
              const fnModifiers = getAllModifiers();
              // Ensure Fn is shown in status bar when Fn function is triggered
              // (either through Fn Lock or Fn key press)
              fnModifiers.fn = true;
              handleKeyPress(buttonConfig.primary, fnModifiers);
            }
            
            // Release Fn key after using it only if fnHold is not enabled
            if (fnKeyPressedRef.current && !fnHold) {
              fnKeyPressedRef.current = false;
              // Find and release Fn button
              for (const [btn, name] of buttonsRef.current) {
                if (name === 'fn' && toggledModifierKeysRef.current.has(btn)) {
                  removeClickEffect(btn);
                  toggledModifierKeysRef.current.delete(btn);
                  break;
                }
              }
            }
            // Release all modifier keys (fn will be preserved if fnHold is enabled)
            releaseAllModifierKeys();
            
            // The click effect will be removed by the mouseup handler with delay
            return; // Don't process as regular key when Fn function is used
          }
          
          // Release all modifier keys first (but keep track of their state)
          releaseAllModifierKeys();

          // Dispatch key press to DocumentEditor for display - ALL keys should be sent
          if (buttonConfig) {
            const { primary, secondary } = resolveKeyFromConfig(buttonConfig, numLock);
            
            // Always send the key if Ctrl/Cmd/Alt/Shift is pressed (for shortcuts)
            
            // For F keys: send primary when (fnLock enabled AND fn pressed) OR (fnLock disabled AND fn not pressed)
            // For special keys that can be used in combinations, send the key name
            const specialKeysForCombos = ['Enter', 'Backspace', 'Delete', 'Tab', 'Home', 'End', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'PrintScreen', 'Pause', 'Break', 'Escape', 'PageUp', 'PageDown', 'Insert', 'CapsLock', 'NumLock', 'ScrollLock', 'Shift', 'Control', 'Alt', 'Meta', 'Fn'];
            
            // Build a repeatable fire function for this keypress, capturing all
            // relevant state at mousedown time so repeats stay consistent.
            let repeatFn: (() => void) | null = null;

            if (specialKeysForCombos.includes(primary)) {
              const dispatchKey = (key: string, mods: typeof modifiers) => {
                if (shouldControlVirtualMouseWithArrow(key, keyboardMouseEnabled, mouseEnabled, mods)) {
                  moveVirtualMouse(key);
                  return;
                }
                handleKeyPress(key, mods);
              };
              dispatchKey(primary, modifiers);
              const _primary = primary;
              const _mods = { ...modifiers };
              repeatFn = () => dispatchKey(_primary, _mods);
            } else if ((modifiers.ctrl || modifiers.meta || modifiers.alt) && primary.length === 1 && /[a-zA-Z]/.test(primary)) {
              // For letter keys with Ctrl/Alt/Meta modifiers (like Ctrl+A), send the lowercase key name
              // Note: Shift is handled separately in getCharacterToInsert
              handleKeyPress(primary.toLowerCase(), modifiers);
              const _key = primary.toLowerCase(); const _mods = { ...modifiers };
              repeatFn = () => handleKeyPress(_key, _mods);
            } else {
              // For printable characters, get the character to insert
              // This handles Shift and CapsLock correctly for both letters and symbols
              // If shouldUseFnFunction is true, use fn function (single character like 'é', 'á', etc.)
              // Otherwise, use primary/secondary based on Shift and CapsLock
              let characterToInsert: string | null = null;
              
              if (shouldUseFnFunction && buttonConfig.fn && buttonConfig.fn.length === 1) {
                // Fn function is a single character (like 'é', 'á', etc.)
                characterToInsert = buttonConfig.fn;
              } else {
                // Use normal character insertion (primary/secondary based on Shift and CapsLock)
                // Ensure boolean values are properly passed
                const isShift = Boolean(modifiers.shift);
                const isCaps = Boolean(modifiers.capsLock);
                characterToInsert = getCharacterToInsert(primary, secondary, isShift, isCaps);
              }
              
              if (characterToInsert !== null) {
                handleKeyPress(characterToInsert, modifiers);
                const _char = characterToInsert; const _mods = { ...modifiers };
                repeatFn = () => handleKeyPress(_char, _mods);
              } else {
                // Even if characterToInsert is null, send the primary key for display
                handleKeyPress(primary, modifiers);
                const _primary = primary; const _mods = { ...modifiers };
                repeatFn = () => handleKeyPress(_primary, _mods);
              }
            }

            // Start hold-to-repeat for the key (modifier keys are handled above and don't reach here)
            if (repeatFn) {
              dbgKbd('handleMouseDown: starting key repeat for', buttonName);
              startKeyRepeat(repeatFn);
            }
          }
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only handle left mouse button

      stopKeyRepeat();

      // Handle Fn key release
      if (pressedButtonRef.current) {
        const buttonName = buttonsRef.current.get(pressedButtonRef.current);
        if (buttonName === 'fn') {
          // Only release Fn key if fnHold is not enabled
          // If fnHold is enabled, the useEffect will keep it held
          if (!fnHold) {
            fnKeyPressedRef.current = false;
            if (toggledModifierKeysRef.current.has(pressedButtonRef.current)) {
              removeClickEffect(pressedButtonRef.current);
              toggledModifierKeysRef.current.delete(pressedButtonRef.current);
            }
          }
          pressedButtonRef.current = null;
          return;
        }
      }

      // Only remove click effect from pressed button if it's not a toggled modifier key
      if (pressedButtonRef.current) {
        // Check if it's a modifier key that's toggled
        if (!toggledModifierKeysRef.current.has(pressedButtonRef.current)) {
          // Store button reference before clearing
          const buttonToRemove = pressedButtonRef.current;
          // Add a small delay before removing click effect for better visual feedback
          // This ensures users can see the key light up, especially for F keys
          setTimeout(() => {
            if (buttonToRemove && !toggledModifierKeysRef.current.has(buttonToRemove)) {
              removeClickEffect(buttonToRemove);
            }
          }, 200); // 200ms delay for visual feedback
        }
        pressedButtonRef.current = null;
      }
    };

    // Also handle mouseleave to ensure button is unclicked if mouse leaves canvas
    const handleMouseLeave = () => {
      stopKeyRepeat();
      if (pressedButtonRef.current) {
        removeClickEffect(pressedButtonRef.current);
        pressedButtonRef.current = null;
      }
    };

    // Listen for mouse events on the canvas
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    gl.domElement.addEventListener('mouseup', handleMouseUp);
    gl.domElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      stopKeyRepeat();
      document.removeEventListener('mouseup', globalStopKeyRepeat);
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      gl.domElement.removeEventListener('mouseup', handleMouseUp);
      gl.domElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [gl, css3DRendererRef, keyboardType, fnLock, fnHold, winLock, toggleFnLock, toggleFnHold, capsLock, keyboardMouseEnabled, mouseEnabled, moveVirtualMouse, handleKeyPress, handleFnFunction, numLock, toggleCapsLock, toggleNumLock, toggleScrollLock]);

  // Handle fnHold state - keep fn key held when fnHold is enabled
  useEffect(() => {
    // Find the fn button
    let fnButton: HTMLElement | null = null;
    for (const [btn, name] of buttonsRef.current) {
      if (name === 'fn') {
        fnButton = btn;
        break;
      }
    }

    if (!fnButton) return;

    if (fnHold) {
      // fnHold is enabled - keep fn key pressed
      fnKeyPressedRef.current = true;
      if (!toggledModifierKeysRef.current.has(fnButton)) {
        applyClickEffect(fnButton);
        toggledModifierKeysRef.current.add(fnButton);
      }
    } else {
      // fnHold is disabled - release fn key
      fnKeyPressedRef.current = false;
      if (toggledModifierKeysRef.current.has(fnButton)) {
        removeClickEffect(fnButton);
        toggledModifierKeysRef.current.delete(fnButton);
      }
    }
  }, [fnHold, css3DRendererRef, keyboardType]);

  // When Win Lock is disabled, release any Win keys held as modifiers
  useEffect(() => {
    if (winLock) return;

    for (const [btn, name] of buttonsRef.current) {
      if (isWinButtonName(name) && toggledModifierKeysRef.current.has(btn)) {
        removeClickEffect(btn);
        toggledModifierKeysRef.current.delete(btn);
      }
    }
  }, [winLock, css3DRendererRef, keyboardType]);

  // Update clicked buttons' colors when theme changes
  useEffect(() => {
    // Function to update colors
    const updateColors = () => {
      // Update all currently clicked buttons with new theme colors
      if (clickedButtonsRef.current.size === 0) return;

      const clickGlowColor = getThemeGlowColor(0.4);
      const bgColor = getThemeGlowColor(0.3);

      clickedButtonsRef.current.forEach((button) => {
        const isHovered = hoveredButtonRef.current === button;

        // Update background color with new theme color
        button.style.backgroundColor = bgColor;

        // Update box-shadow based on hover state
        if (isHovered) {
          const hoverGlowColor1 = getThemeGlowColor(0.6);
          const hoverGlowColor2 = getThemeGlowColor(0.4);
          button.style.boxShadow = `inset 0 0 20px ${clickGlowColor}, 0 0 15px ${hoverGlowColor1}, 0 0 30px ${hoverGlowColor2}`;
        } else {
          button.style.boxShadow = `inset 0 0 20px ${clickGlowColor}`;
        }
      });
    };

    // Use multiple requestAnimationFrame calls to ensure DOM and CSS are fully updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateColors();
      });
    });

    // Also set up MutationObserver to watch for data-theme attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          // Theme attribute changed, update colors
          requestAnimationFrame(() => {
            updateColors();
          });
        }
      });
    });

    // Observe the document element for data-theme attribute changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => {
      observer.disconnect();
    };
  }, [theme]);

  // Update LED indicators based on lock states
  useEffect(() => {
    if (!css3DRendererRef.current?.domElement) return;

    const updateLEDIndicators = () => {
      const keyboardElement = css3DRendererRef.current?.domElement;
      if (!keyboardElement) return;

      // Find all lock key buttons and their LED indicators
      const capslockButton = keyboardElement.querySelector('[data-key-name="capslock"]') as HTMLElement | null;
      const numlockButton = keyboardElement.querySelector('[data-key-name="f12"]') as HTMLElement | null; // NumLock is often on F12
      const scrollLockButton = keyboardElement.querySelector('[data-key-name="scroll-lock"]') as HTMLElement | null;
      const insertButton = keyboardElement.querySelector('[data-key-name="insert"]') as HTMLElement | null;
      const escButton = keyboardElement.querySelector('[data-key-name="esc"]') as HTMLElement | null; // Fn Lock is on Esc key
      const f2Button = keyboardElement.querySelector('[data-key-name="f2"]') as HTMLElement | null; // Airplane mode is on F2

      // Update CapsLock LED (only the light, not the button background)
      if (capslockButton) {
        const lightElement = capslockButton.querySelector('.light') as HTMLElement;
        if (lightElement) {
          if (capsLock) {
            lightElement.style.backgroundColor = 'var(--primary)';
            lightElement.style.opacity = '1';
            lightElement.style.boxShadow = '0 0 4px var(--primary), 0 0 6px var(--primary)';
          } else {
            lightElement.style.backgroundColor = '';
            lightElement.style.opacity = '';
            lightElement.style.boxShadow = '';
          }
        }
      }

      // Update NumLock LED (only the light, not the button background)
      if (numlockButton) {
        const lightElement = numlockButton.querySelector('.light') as HTMLElement;
        if (lightElement) {
          if (numLock) {
            lightElement.style.backgroundColor = 'var(--primary)';
            lightElement.style.opacity = '1';
            lightElement.style.boxShadow = '0 0 4px var(--primary), 0 0 6px var(--primary)';
          } else {
            lightElement.style.backgroundColor = '';
            lightElement.style.opacity = '';
            lightElement.style.boxShadow = '';
          }
        }
      }

      // Update ScrollLock LED (only the light, not the button background)
      if (scrollLockButton) {
        const lightElement = scrollLockButton.querySelector('.light') as HTMLElement;
        if (lightElement) {
          if (scrollLock) {
            lightElement.style.backgroundColor = 'var(--primary)';
            lightElement.style.opacity = '1';
            lightElement.style.boxShadow = '0 0 4px var(--primary), 0 0 6px var(--primary)';
          } else {
            lightElement.style.backgroundColor = '';
            lightElement.style.opacity = '';
            lightElement.style.boxShadow = '';
          }
        }
      }

      // Update Insert LED (only the light, not the button background)
      if (insertButton) {
        const lightElement = insertButton.querySelector('.light') as HTMLElement;
        if (lightElement) {
          if (insert) {
            lightElement.style.backgroundColor = 'var(--primary)';
            lightElement.style.opacity = '1';
            lightElement.style.boxShadow = '0 0 4px var(--primary), 0 0 6px var(--primary)';
          } else {
            lightElement.style.backgroundColor = '';
            lightElement.style.opacity = '';
            lightElement.style.boxShadow = '';
          }
        }
      }

      // Update Fn Lock LED on Esc key (only the light, not the button background)
      if (escButton) {
        const lightElement = escButton.querySelector('.light') as HTMLElement;
        if (lightElement) {
          if (fnLock) {
            lightElement.style.backgroundColor = 'var(--primary)';
            lightElement.style.opacity = '1';
            lightElement.style.boxShadow = '0 0 4px var(--primary), 0 0 6px var(--primary)';
          } else {
            lightElement.style.backgroundColor = '';
            lightElement.style.opacity = '';
            lightElement.style.boxShadow = '';
          }
        }
      }

      // Update Airplane Mode LED on F2 key (only the light, not the button background)
      if (f2Button) {
        const lightElement = f2Button.querySelector('.light') as HTMLElement;
        if (lightElement) {
          if (flightMode) {
            lightElement.style.backgroundColor = 'var(--primary)';
            lightElement.style.opacity = '1';
            lightElement.style.boxShadow = '0 0 4px var(--primary), 0 0 6px var(--primary)';
          } else {
            lightElement.style.backgroundColor = '';
            lightElement.style.opacity = '';
            lightElement.style.boxShadow = '';
          }
        }
      }

      // Update standalone indicator lights (e.g. PC keyboard's dedicated LEDs)
      const applyIndicator = (el: HTMLElement | null, active: boolean) => {
        if (!el) return;
        if (active) {
          el.style.backgroundColor = 'var(--primary)';
          el.style.opacity = '1';
          el.style.boxShadow = '0 0 4px var(--primary), 0 0 6px var(--primary)';
        } else {
          el.style.backgroundColor = '';
          el.style.opacity = '';
          el.style.boxShadow = '';
        }
      };

      applyIndicator(keyboardElement.querySelector('[data-indicator="capslock"]') as HTMLElement | null, capsLock);
      applyIndicator(keyboardElement.querySelector('[data-indicator="numlock"]') as HTMLElement | null, numLock);
      applyIndicator(keyboardElement.querySelector('[data-indicator="scrolllock"]') as HTMLElement | null, scrollLock);
    };

    // Update immediately
    updateLEDIndicators();

    // Also update when keyboard type changes (to catch newly rendered keyboards)
    const interval = setInterval(updateLEDIndicators, 500);

    return () => clearInterval(interval);
  }, [capsLock, numLock, scrollLock, insert, fnLock, flightMode, css3DRendererRef, keyboardType]);

  useFrame((state) => {
    if (buttonsRef.current.size === 0 || !gl.domElement) return;
    if (!css3DRendererRef.current?.domElement) return;

    // Get mouse position from Three.js state (normalized -1 to 1)
    const mouseX = state.mouse.x;
    const mouseY = state.mouse.y;

    // Use CSS3D renderer's domElement for bounding rect (where buttons actually are)
    const rect = css3DRendererRef.current.domElement.getBoundingClientRect();

    // Convert normalized coordinates to viewport/client coordinates
    const clientX = rect.left + (mouseX * 0.5 + 0.5) * rect.width;
    const clientY = rect.top + (-mouseY * 0.5 + 0.5) * rect.height;

    // Check if mouse is over any button using helper function
    const currentlyHovered = getButtonAtPosition(clientX, clientY);

    // Apply/remove hover effects
    if (currentlyHovered && currentlyHovered !== hoveredButtonRef.current) {
      // Remove hover effect from previous button
      if (hoveredButtonRef.current) {
        removeHoverEffect(hoveredButtonRef.current);
      }

      // Apply hover effect to new button
      applyHoverEffect(currentlyHovered);

      hoveredButtonRef.current = currentlyHovered;
    } else if (!currentlyHovered && hoveredButtonRef.current) {
      // Remove hover effect when leaving button
      removeHoverEffect(hoveredButtonRef.current);
      hoveredButtonRef.current = null;
    }
  });

  return null;
}

// Component to sync real keyboard with virtual keyboard when keyboard sync is enabled
function KeyboardSyncHandler() {
  const { keyboardSyncEnabled } = useKeyboardSync();
  const { arrowEnabled } = useArrow();
  const { mouseEnabled, keyboardMouseEnabled } = useMouse();
  const { keyboardType } = useKeyboardType();
  const { handleKeyPress } = useKeyboardInput();
  const {
    capsLock,
    numLock,
    scrollLock,
    fnLock,
    fnHold,
    winLock,
    toggleCapsLock,
    toggleNumLock,
    toggleScrollLock,
  } = useKeyboardLock();
  const { handleFnFunction } = useFnFunction();
  const { flightMode } = useSystemState();
  const { theme } = useTheme();
  
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const pressedButtonsRef = useRef<Map<string, HTMLElement>>(new Map());
  const originalStylesRef = useRef<Map<HTMLElement, { filter: string; backgroundColor: string; transform: string; boxShadow: string }>>(new Map());
  const realFnKeyPressedRef = useRef<boolean>(false);
  const activeLockKeysRef = useRef<Map<string, HTMLElement>>(new Map()); // Track active lock keys

  // Helper function to get theme primary color in rgba format
  const getThemeGlowColor = (opacity: number = 0.6): string => {
    const testElement = document.createElement('div');
    testElement.style.color = 'var(--primary)';
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.style.pointerEvents = 'none';
    document.body.appendChild(testElement);

    const computedColor = getComputedStyle(testElement).color;
    document.body.removeChild(testElement);

    const rgbMatch = computedColor.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    const root = document.documentElement;
    let primaryColor = getComputedStyle(root).getPropertyValue('--primary').trim();

    if (primaryColor.startsWith('#')) {
      const hex = primaryColor.slice(1);
      const r = hex.length === 3
        ? parseInt(hex[0] + hex[0], 16)
        : parseInt(hex.substring(0, 2), 16);
      const g = hex.length === 3
        ? parseInt(hex[1] + hex[1], 16)
        : parseInt(hex.substring(2, 4), 16);
      const b = hex.length === 3
        ? parseInt(hex[2] + hex[2], 16)
        : parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    return `rgba(100, 150, 255, ${opacity})`;
  };

  // Store original transform for animation purposes
  const storeOriginalTransform = (button: HTMLElement) => {
    if (!originalStylesRef.current.has(button)) {
      const computedStyle = window.getComputedStyle(button);
      originalStylesRef.current.set(button, {
        filter: 'none',
        backgroundColor: 'transparent',
        transform: computedStyle.transform || 'none',
        boxShadow: 'none',
      });
    }
  };

  // Apply click effect to virtual keyboard button
  const applyClickEffect = (button: HTMLElement) => {
    storeOriginalTransform(button);
    const clickGlowColor = getThemeGlowColor(0.4);
    const bgColor = getThemeGlowColor(0.3);
    
    button.style.backgroundColor = bgColor;
    button.style.boxShadow = `inset 0 0 20px ${clickGlowColor}`;
    button.style.transition = 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease';
    button.style.transform = 'scale(0.95)';

    setTimeout(() => {
      const original = originalStylesRef.current.get(button);
      const originalTransform = original?.transform || 'none';
      if (originalTransform === 'none' || originalTransform === '') {
        button.style.transform = '';
      } else {
        button.style.transform = originalTransform;
      }
    }, 250);
  };

  // Remove click effect from virtual keyboard button
  const removeClickEffect = (button: HTMLElement) => {
    button.style.backgroundColor = '';
    button.style.boxShadow = '';
    button.style.transition = 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease';
  };

  // Find virtual keyboard button element by button ID
  const findButtonByID = (buttonId: string): HTMLElement | null => {
    // Find all keyboard containers
    const keyboards = document.querySelectorAll('.keyboard');
    if (keyboards.length === 0) return null;

    // Search within keyboard containers
    for (const keyboard of keyboards) {
      // Try to find button by data-key-name attribute first
      const buttonByDataAttr = keyboard.querySelector(`button[data-key-name="${buttonId}"]`) as HTMLElement;
      if (buttonByDataAttr) return buttonByDataAttr;

      // Try to find by class name (e.g., "space-key" for "space")
      const classPattern = buttonId.replace(/\s+/g, '-').toLowerCase();
      const buttonByClass = keyboard.querySelector(`button.${classPattern}-key`) as HTMLElement;
      if (buttonByClass) return buttonByClass;
    }

    // Try to find by text content (fallback) - search all keyboards
    for (const keyboard of keyboards) {
      const allButtons = keyboard.querySelectorAll('button');
      for (const button of allButtons) {
        const buttonElement = button as HTMLElement;
        const textContent = buttonElement.textContent?.trim().split('\n')[0].trim().toLowerCase();
        const normalizedButtonId = buttonId.toLowerCase().replace(/\s+/g, '');
        const normalizedText = textContent?.replace(/\s+/g, '');
        if (normalizedText === normalizedButtonId || normalizedText?.includes(normalizedButtonId)) {
          return buttonElement;
        }
      }
    }

    return null;
  };

  // Resolve a mapped button id against the active keyboard config (handles ins/insert, del/delete, etc.)
  const resolveConfigButtonId = (
    keyboardConfig: ReturnType<typeof getKeyboardConfig>,
    candidateId: string,
    primaryKey?: string,
  ): string => {
    if (!keyboardConfig) return candidateId;
    if (keyboardConfig.some(btn => btn.id === candidateId)) return candidateId;
    if (primaryKey) {
      const byPrimary = keyboardConfig.find(btn => btn.primary === primaryKey);
      if (byPrimary) return byPrimary.id;
    }
    const aliasGroups = [
      ['ins', 'insert'],
      ['del', 'delete'],
      ['scrolllock', 'scroll-lock'],
    ];
    for (const group of aliasGroups) {
      if (!group.includes(candidateId)) continue;
      for (const alt of group) {
        if (keyboardConfig.some(btn => btn.id === alt)) return alt;
      }
    }
    return candidateId;
  };

  // Map browser KeyboardEvent key to virtual keyboard button ID
  const mapKeyToButtonID = (key: string, code: string, modifiers: { shift: boolean; ctrl: boolean; alt: boolean; meta: boolean; fn: boolean }): string | null => {
    const keyboardConfig = getKeyboardConfig(keyboardType);
    if (!keyboardConfig) return null;

    // Normalize key for matching
    const normalizedKey = key.length === 1 ? key.toLowerCase() : key;

    if (NUMPAD_CODE_TO_BUTTON_ID[code]) {
      return NUMPAD_CODE_TO_BUTTON_ID[code];
    }

    // Handle special keys
    const specialKeyMap: Record<string, string> = {
      'Escape': 'esc',
      'Tab': 'tab',
      'Enter': 'enter',
      'Backspace': 'backspace',
      'Delete': 'del',
      'Insert': 'ins',
      'Home': 'home',
      'End': 'end',
      'PageUp': 'pgup',
      'PageDown': 'pgdn',
      'ArrowUp': 'arrow-up',
      'ArrowDown': 'arrow-down',
      'ArrowLeft': 'arrow-left',
      'ArrowRight': 'arrow-right',
      'CapsLock': 'capslock',
      'NumLock': 'numlock',
      'ScrollLock': 'scrolllock',
      'PrintScreen': 'prtsc',
      'Print': 'prtsc', // Alternative name for Print Screen
      'Pause': 'pause',
      'Break': 'break',
      'ContextMenu': 'menu',
      ' ': 'space',
    };

    // Handle F keys
    if (/^F\d+$/.test(key)) {
      return key.toLowerCase();
    }

    // Handle special keys - check both key and code for Print Screen
    if (specialKeyMap[key]) {
      return resolveConfigButtonId(keyboardConfig, specialKeyMap[key], key);
    }
    // Also check code for Print Screen (some browsers use different key names)
    if (code === 'PrintScreen' || code === 'Print') {
      return 'prtsc';
    }

    // Handle modifier keys
    if (key === 'Shift') {
      // Determine left or right shift based on code
      return code.includes('Left') ? 'shift-left' : 'shift-right';
    }
    if (key === 'Control' || key === 'Ctrl') {
      return code.includes('Left') ? 'ctrl-left' : 'ctrl-right';
    }
    if (key === 'Alt') {
      return code.includes('Left') ? 'alt-left' : 'alt-right';
    }
    if (isMetaKeyEvent(key, code)) {
      const isRight = code.includes('Right');
      const sideId = isRight ? 'windows-right' : 'windows-left';
      if (keyboardConfig.some(btn => btn.id === sideId)) {
        return sideId;
      }
      const windowsButton = keyboardConfig.find(btn => btn.id === 'windows');
      if (windowsButton) {
        return 'windows';
      }
      const anyWinKey = keyboardConfig.find(
        btn => btn.primary === 'Meta' || btn.primary === 'Windows',
      );
      if (anyWinKey) return anyWinKey.id;
      return sideId;
    }
    if (key === 'Fn') {
      return 'fn';
    }
    if (key === 'ContextMenu') {
      // Check if there's a dedicated menu button or if it's a secondary key
      const menuButton = keyboardConfig.find(btn => btn.id === 'menu');
      if (menuButton) return 'menu';
      // Some keyboards have ContextMenu as secondary on ctrl-right
      const ctrlRightButton = keyboardConfig.find(btn => btn.id === 'ctrl-right' && btn.secondary === 'ContextMenu');
      if (ctrlRightButton) return 'ctrl-right';
    }

    // Handle printable characters - find button by primary or secondary key
    for (const buttonConfig of keyboardConfig) {
      // Normalize for comparison
      const primaryLower = buttonConfig.primary.toLowerCase();
      const secondaryLower = buttonConfig.secondary?.toLowerCase() || '';
      const fnLower = buttonConfig.fn?.toLowerCase() || '';
      
      // Check if key matches primary (case-insensitive for letters)
      if (buttonConfig.primary.length === 1 && /[a-zA-Z]/.test(buttonConfig.primary)) {
        // For letters, compare case-insensitively
        if (primaryLower === normalizedKey) {
          return buttonConfig.id;
        }
      } else {
        // For non-letters, exact match
        if (buttonConfig.primary === key || primaryLower === normalizedKey) {
          return buttonConfig.id;
        }
      }
      
      // Check if key matches secondary (with shift)
      if (modifiers.shift && buttonConfig.secondary) {
        if (buttonConfig.secondary.length === 1 && /[a-zA-Z]/.test(buttonConfig.secondary)) {
          if (secondaryLower === normalizedKey) {
            return buttonConfig.id;
          }
        } else {
          if (buttonConfig.secondary === key || secondaryLower === normalizedKey) {
            return buttonConfig.id;
          }
        }
      }
      
      // Check if key matches fn function (for single character fn functions)
      if (modifiers.fn && buttonConfig.fn && buttonConfig.fn.length === 1) {
        if (fnLower === normalizedKey) {
          return buttonConfig.id;
        }
      }
    }

    // Fallback: try direct ID match
    const directMatch = keyboardConfig.find(btn => btn.id === normalizedKey || btn.id === key.toLowerCase());
    if (directMatch) return directMatch.id;

    return null;
  };

  // Get character to insert based on key, shift, and caps lock
  const getCharacterToInsert = (primary: string, secondary: string, isShift: boolean, isCaps: boolean): string | null => {
    const specialKeys = [
      'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'PrintScreen', 'ScrollLock', 'Pause', 'Break',
      'Insert', 'Home', 'PageUp', 'Delete', 'End', 'PageDown',
      'Tab', 'CapsLock', 'Enter', 'Backspace',
      'Shift', 'Control', 'Alt', 'Meta', 'Fn',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'NumLock', 'ScrollLock'
    ];
    
    if (specialKeys.includes(primary)) {
      return primary;
    }

    if (primary.length === 1 && /[a-zA-Z]/.test(primary)) {
      const normalizedPrimary = primary.toLowerCase();
      const shouldUppercase = (isShift && !isCaps) || (!isShift && isCaps);
      return shouldUppercase ? normalizedPrimary.toUpperCase() : normalizedPrimary;
    }

    if (primary.length === 1) {
      if (isShift && secondary && secondary.length === 1) {
        return secondary;
      }
      return primary;
    }

    return null;
  };

  // Watch for lock key state changes and update visual feedback
  useEffect(() => {
    if (!keyboardSyncEnabled) return;
    
    // Update visual feedback for lock keys based on their current state
    const updateLockKeyVisuals = () => {
      // CapsLock
      const capslockButton = findButtonByID('capslock');
      if (capslockButton) {
        if (capsLock) {
          // CapsLock is on - ensure visual feedback is applied
          if (!activeLockKeysRef.current.has('capslock')) {
            applyClickEffect(capslockButton);
            activeLockKeysRef.current.set('capslock', capslockButton);
          }
        } else {
          // CapsLock is off - remove visual feedback
          if (activeLockKeysRef.current.has('capslock')) {
            removeClickEffect(capslockButton);
            activeLockKeysRef.current.delete('capslock');
          }
        }
      }
      
      // NumLock
      const numlockButton = findButtonByID('numlock');
      if (numlockButton) {
        if (numLock) {
          if (!activeLockKeysRef.current.has('numlock')) {
            applyClickEffect(numlockButton);
            activeLockKeysRef.current.set('numlock', numlockButton);
          }
        } else {
          if (activeLockKeysRef.current.has('numlock')) {
            removeClickEffect(numlockButton);
            activeLockKeysRef.current.delete('numlock');
          }
        }
      }
      
      // ScrollLock
      const scrolllockButton = findButtonByID('scroll-lock');
      if (scrolllockButton) {
        if (scrollLock) {
          if (!activeLockKeysRef.current.has('scroll-lock')) {
            applyClickEffect(scrolllockButton);
            activeLockKeysRef.current.set('scroll-lock', scrolllockButton);
          }
        } else {
          if (activeLockKeysRef.current.has('scroll-lock')) {
            removeClickEffect(scrolllockButton);
            activeLockKeysRef.current.delete('scroll-lock');
          }
        }
      }
    };
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateLockKeyVisuals, 50);
    
    return () => clearTimeout(timeoutId);
  }, [capsLock, numLock, scrollLock, keyboardSyncEnabled, keyboardType]);

  useEffect(() => {
    if (!keyboardSyncEnabled) {
      // Clean up pressed buttons when sync is disabled
      pressedButtonsRef.current.forEach((button) => {
        removeClickEffect(button);
      });
      pressedButtonsRef.current.clear();
      pressedKeysRef.current.clear();
      activeLockKeysRef.current.clear();
      return;
    }

    // Non-modifier keys that should NOT repeat when held
    const nonRepeatableKeys = new Set([
      'CapsLock', 'NumLock', 'ScrollLock', 'Insert',
      'Shift', 'Control', 'Alt', 'Meta', 'Fn',
    ]);

    const emitKeyPress = (
      pressedKey: string,
      pressedModifiers: {
        shift: boolean;
        ctrl: boolean;
        alt: boolean;
        meta: boolean;
        fn: boolean;
        capsLock: boolean;
      },
    ) => {
      handleKeyPress(pressedKey, modifiersForKeyDisplay(pressedKey, pressedModifiers));
    };

    const showKeyToast = (
      buttonID: string,
      buttonConfig: Pick<KeyboardButton, 'id' | 'primary' | 'secondary'> | null | undefined,
      toastModifiers: {
        shift: boolean;
        ctrl: boolean;
        alt: boolean;
        meta: boolean;
        fn: boolean;
      },
    ) => {
      dispatchKeyPressToast(buttonID, buttonConfig, toastModifiers, numLock, winLock);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      const keyId = `${key}-${code}`;

      const fnActive = realFnKeyPressedRef.current || fnHold || fnLock;
      const arrowModifierState = {
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        alt: e.altKey,
        fn: fnActive,
      };
      const keyboardMouseArrow = shouldControlVirtualMouseWithArrow(
        key,
        keyboardMouseEnabled,
        mouseEnabled,
        arrowModifierState,
      );
      const propagateNavArrow = !keyboardMouseArrow && shouldPropagateNavArrowToBrowser(
        key,
        arrowEnabled,
        arrowModifierState,
      );

      // Special handling for Print Screen - Windows captures this for screenshots
      // Check multiple variations of Print Screen key
      const isPrintScreen = 
        key === 'PrintScreen' || 
        key === 'Print' || 
        code === 'PrintScreen' || 
        code === 'Print' ||
        code === 'F13' || // Some keyboards map Print Screen to F13
        (key.length === 0 && code.includes('Print')); // Some browsers don't set key for Print Screen
      
      // For Print Screen, don't prevent default - let Windows handle it
      // When Key Scroll mode is on, let plain arrow keys scroll / use native browser behavior
      if (!isPrintScreen && !propagateNavArrow) {
        e.preventDefault();
        e.stopPropagation();
      }

      // OS-level key repeat: the browser fires keydown with e.repeat=true while a key is held.
      if (e.repeat) {
        if (propagateNavArrow) return;
        if (keyboardMouseArrow) return;
        if (!nonRepeatableKeys.has(key) && pressedKeysRef.current.has(keyId)) {
          const rModifiers = {
            shift: e.shiftKey,
            ctrl: e.ctrlKey,
            alt: e.altKey,
            meta: e.metaKey,
            fn: realFnKeyPressedRef.current || fnHold || fnLock,
            capsLock: capsLock,
          };
          const rButtonID = mapKeyToButtonID(key, code, rModifiers) || (isPrintScreen ? 'prtsc' : null);
          if (rButtonID) {
            const rKbConfig = getKeyboardConfig(keyboardType);
            if (rKbConfig) {
              const rBtnConfig = rKbConfig.find(btn => btn.id === rButtonID);
              if (rBtnConfig) {
                if (rModifiers.fn && rBtnConfig.fn && handleFnFunction) {
                  handleFnFunction(rBtnConfig.fn);
                } else {
                  const { primary: rPrimary, secondary: rSecondary } = resolveKeyFromConfig(rBtnConfig, numLock);
                  const rKeyToSend = getCharacterToInsert(rPrimary, rSecondary, rModifiers.shift, rModifiers.capsLock);
                  emitKeyPress(rKeyToSend ?? rPrimary, rModifiers);
                }
              }
            }
          } else if (isPrintScreen) {
            emitKeyPress('PrintScreen', rModifiers);
          }
        }
        return;
      }

      // Skip if already processing this key (first keydown only)
      if (pressedKeysRef.current.has(keyId)) return;
      pressedKeysRef.current.add(keyId);

      // Note: Most keyboards don't send Fn key events (handled at hardware level)
      // So we rely on fnLock and fnHold from the context
      // However, we can try to detect it if the browser supports it
      if (key === 'Fn' || code === 'FnLeft' || code === 'FnRight') {
        realFnKeyPressedRef.current = true;
      }

      // Get current modifier states
      const modifiers = {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey,
        fn: realFnKeyPressedRef.current || fnHold || fnLock,
        capsLock: capsLock,
      };
      const toastModifiers = {
        shift: modifiers.shift,
        ctrl: modifiers.ctrl,
        alt: modifiers.alt,
        meta: modifiers.meta,
        fn: modifiers.fn,
      };

      // Check if this is a lock key before toggling
      const isLockKey = key === 'CapsLock' || key === 'NumLock' || key === 'ScrollLock';
      let lockKeyStateAfterToggle = false;
      
      // Handle lock keys
      if (key === 'CapsLock') {
        toggleCapsLock();
        lockKeyStateAfterToggle = !capsLock; // State after toggle
        modifiers.capsLock = lockKeyStateAfterToggle;
      } else if (key === 'NumLock') {
        toggleNumLock();
        lockKeyStateAfterToggle = !numLock; // State after toggle
      } else if (key === 'ScrollLock') {
        toggleScrollLock();
        lockKeyStateAfterToggle = !scrollLock; // State after toggle
      }

      // Map real key to virtual button ID
      let buttonID = mapKeyToButtonID(key, code, modifiers);
      
      // Special handling for Print Screen - check both key and code
      if (isPrintScreen && !buttonID) {
        buttonID = 'prtsc';
      }
      
      if (buttonID) {
        // Find the virtual keyboard button
        const buttonElement = findButtonByID(buttonID);
        
        if (buttonElement) {
          // Apply visual feedback
          applyClickEffect(buttonElement);
          pressedButtonsRef.current.set(keyId, buttonElement);
          
          // For lock keys, keep the visual feedback if the lock is now active
          if (isLockKey && lockKeyStateAfterToggle) {
            // Store that this is an active lock key - don't remove on keyup
            // The visual feedback will persist until the lock is toggled off
            activeLockKeysRef.current.set(buttonID, buttonElement);
          } else if (isLockKey && !lockKeyStateAfterToggle) {
            // Lock key is being toggled off - remove from active locks
            activeLockKeysRef.current.delete(buttonID);
          }
        }

        // Get keyboard config to determine what key to send
        const keyboardConfig = getKeyboardConfig(keyboardType);
        if (keyboardConfig) {
          const buttonConfig = keyboardConfig.find(btn => btn.id === buttonID);
          
          if (buttonConfig) {
            // Handle Fn functions
            if (modifiers.fn && buttonConfig.fn && handleFnFunction) {
              handleFnFunction(buttonConfig.fn);
            } else {
              // Determine which key to send (primary, secondary, or fn)
              let keyToSend: string | null = null;
              
              if (modifiers.fn && buttonConfig.fn) {
                // Fn function takes priority
                if (buttonConfig.fn.length === 1) {
                  keyToSend = buttonConfig.fn;
                } else {
                  // Fn function name
                  handleFnFunction(buttonConfig.fn);
                  return;
                }
              } else {
                // Use primary/secondary based on shift, caps lock, and num lock
                const { primary, secondary } = resolveKeyFromConfig(buttonConfig, numLock);
                keyToSend = getCharacterToInsert(primary, secondary, modifiers.shift, modifiers.capsLock);
              }

              if (keyToSend !== null) {
                showKeyToast(buttonID, buttonConfig, toastModifiers);
                if (!keyboardMouseArrow && !propagateNavArrow) {
                  emitKeyPress(keyToSend, modifiers);
                }
              } else {
                showKeyToast(buttonID, buttonConfig, toastModifiers);
                if (!keyboardMouseArrow && !propagateNavArrow) {
                  emitKeyPress(buttonConfig.primary, modifiers);
                }
              }
            }
          } else if (key.length > 1 || isMetaKeyEvent(key, code)) {
            showKeyToast(buttonID, null, toastModifiers);
            if (!keyboardMouseArrow && !propagateNavArrow) {
              emitKeyPress(isMetaKeyEvent(key, code) ? 'Meta' : key, modifiers);
            }
          } else if (isPrintScreen) {
            showKeyToast('prtsc', null, toastModifiers);
            if (!propagateNavArrow) {
              emitKeyPress('PrintScreen', modifiers);
            }
          }
        }
      } else if (isMetaKeyEvent(key, code)) {
        const sideId = code.includes('Right') ? 'windows-right' : 'windows-left';
        const buttonElement = findButtonByID(sideId);
        if (buttonElement) {
          applyClickEffect(buttonElement);
          pressedButtonsRef.current.set(keyId, buttonElement);
        }
        const keyboardConfig = getKeyboardConfig(keyboardType);
        const winConfig = keyboardConfig?.find(btn => btn.id === sideId) ?? null;
        showKeyToast(sideId, winConfig, toastModifiers);
        if (!propagateNavArrow) {
          emitKeyPress('Meta', modifiers);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      const keyId = `${key}-${code}`;

      const fnActive = realFnKeyPressedRef.current || fnHold || fnLock;
      const arrowModifierState = {
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        alt: e.altKey,
        fn: fnActive,
      };
      const keyboardMouseArrow = shouldControlVirtualMouseWithArrow(
        key,
        keyboardMouseEnabled,
        mouseEnabled,
        arrowModifierState,
      );
      const propagateNavArrow = !keyboardMouseArrow && shouldPropagateNavArrowToBrowser(
        key,
        arrowEnabled,
        arrowModifierState,
      );

      // Special handling for Print Screen - Windows captures this for screenshots
      // Check multiple variations of Print Screen key
      const isPrintScreen = 
        key === 'PrintScreen' || 
        key === 'Print' || 
        code === 'PrintScreen' || 
        code === 'Print' ||
        code === 'F13' || // Some keyboards map Print Screen to F13
        (key.length === 0 && code.includes('Print')); // Some browsers don't set key for Print Screen
      
      // For Print Screen, don't prevent default - let Windows handle it
      if (!isPrintScreen && !propagateNavArrow) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Track Fn key release
      if (key === 'Fn' || code === 'FnLeft' || code === 'FnRight') {
        // Only release if fnHold is not enabled
        if (!fnHold) {
          realFnKeyPressedRef.current = false;
        }
      }

      // Check if this is a lock key
      const isLockKey = key === 'CapsLock' || key === 'NumLock' || key === 'ScrollLock';
      
      // Get current lock states to determine if lock is active
      let lockIsActive = false;
      if (key === 'CapsLock') {
        lockIsActive = capsLock; // Use the state from context (already toggled in keydown)
      } else if (key === 'NumLock') {
        lockIsActive = numLock;
      } else if (key === 'ScrollLock') {
        lockIsActive = scrollLock;
      }

      // Remove from pressed keys
      pressedKeysRef.current.delete(keyId);

      // Remove visual feedback with delay for better visibility
      // BUT: For lock keys that are now active, keep the visual feedback
      const buttonElement = pressedButtonsRef.current.get(keyId);
      if (buttonElement) {
        // Determine button ID for lock keys
        let buttonID: string | null = null;
        if (key === 'CapsLock') buttonID = 'capslock';
        else if (key === 'NumLock') buttonID = 'numlock';
        else if (key === 'ScrollLock') buttonID = 'scroll-lock';
        
        if (isLockKey && lockIsActive && buttonID) {
          // Lock key is active - keep the visual feedback (don't remove it)
          // The button will stay visually pressed until the lock is toggled off
          activeLockKeysRef.current.set(buttonID, buttonElement);
        } else if (isLockKey && !lockIsActive && buttonID) {
          // Lock key is being toggled off - remove visual feedback
          activeLockKeysRef.current.delete(buttonID);
          setTimeout(() => {
            removeClickEffect(buttonElement);
            pressedButtonsRef.current.delete(keyId);
          }, 200);
        } else {
          // Regular key - add a delay before removing click effect for better visual feedback
          setTimeout(() => {
            removeClickEffect(buttonElement);
            pressedButtonsRef.current.delete(keyId);
          }, 200); // 200ms delay for visual feedback
        }
      }
    };

    // Use capture phase to catch events before they reach other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    
    // Also add document-level non-capture listeners for Print Screen specifically
    // Print Screen might not be caught in capture phase due to OS-level interception
    // Using document instead of window and non-capture phase as fallback
    const handlePrintScreenKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      const isPrintScreen = 
        key === 'PrintScreen' || 
        key === 'Print' || 
        code === 'PrintScreen' || 
        code === 'Print' ||
        code === 'F13' ||
        (key.length === 0 && code.includes('Print'));
      
      if (isPrintScreen) {
        // Don't prevent default - let Windows handle screenshot
        // But still process for virtual keyboard
        const keyId = `${key}-${code}`;
        
        // Skip if already processing this key
        if (pressedKeysRef.current.has(keyId)) return;
        pressedKeysRef.current.add(keyId);
        
        const modifiers = {
          shift: e.shiftKey,
          ctrl: e.ctrlKey,
          alt: e.altKey,
          meta: e.metaKey,
          fn: realFnKeyPressedRef.current || fnHold || fnLock,
          capsLock: capsLock,
        };
        
        // Map to button ID
        const buttonID = 'prtsc';
        
        // Find the virtual keyboard button
        const buttonElement = findButtonByID(buttonID);
        
        if (buttonElement) {
          // Apply visual feedback
          applyClickEffect(buttonElement);
          pressedButtonsRef.current.set(keyId, buttonElement);
        }
        
        // Send key press
        emitKeyPress('PrintScreen', modifiers);
      }
    };
    
    const handlePrintScreenKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      const isPrintScreen = 
        key === 'PrintScreen' || 
        key === 'Print' || 
        code === 'PrintScreen' || 
        code === 'Print' ||
        code === 'F13' ||
        (key.length === 0 && code.includes('Print'));
      
      if (isPrintScreen) {
        const keyId = `${key}-${code}`;
        
        // Remove from pressed keys
        pressedKeysRef.current.delete(keyId);
        
        // Remove visual feedback with delay
        const buttonElement = pressedButtonsRef.current.get(keyId);
        if (buttonElement) {
          setTimeout(() => {
            removeClickEffect(buttonElement);
            pressedButtonsRef.current.delete(keyId);
          }, 200);
        }
      }
    };
    
    // Add non-capture listeners on document as fallback
    document.addEventListener('keydown', handlePrintScreenKeyDown, false);
    document.addEventListener('keyup', handlePrintScreenKeyUp, false);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('keydown', handlePrintScreenKeyDown, false);
      document.removeEventListener('keyup', handlePrintScreenKeyUp, false);
      
      // Clean up pressed buttons
      pressedButtonsRef.current.forEach((button) => {
        removeClickEffect(button);
      });
      pressedButtonsRef.current.clear();
      pressedKeysRef.current.clear();
    };
  }, [keyboardSyncEnabled, keyboardType, handleKeyPress, capsLock, numLock, scrollLock, fnLock, fnHold, winLock, arrowEnabled, keyboardMouseEnabled, mouseEnabled, toggleCapsLock, toggleNumLock, toggleScrollLock, handleFnFunction, flightMode, theme]);

  return null;
}

const MIN_KEYBOARD_BUTTONS = 10;
const READY_FRAME_THRESHOLD = 3;
const KEYBOARD_READY_TIMEOUT_MS = 15000;

function isKeyboardModelReady(css3DObject: CSS3DObject): boolean {
  const element = css3DObject.element as HTMLElement | undefined;
  if (!element) return false;

  const keyboard = element.querySelector('.keyboard');
  if (!keyboard) return false;

  const buttons = keyboard.querySelectorAll('button[data-key-name]');
  if (buttons.length < MIN_KEYBOARD_BUTTONS) return false;

  if (css3DObject.scale.x <= 0) return false;

  const sampleButton = keyboard.querySelector('[data-key-name="esc"], [data-key-name="a"], button') as HTMLElement | null;
  if (!sampleButton || sampleButton.offsetWidth <= 0 || sampleButton.offsetHeight <= 0) return false;

  return true;
}

function Keyboard3D({ css3DRendererRef, containerRef, onKeyboardReady }: { css3DRendererRef: React.MutableRefObject<CSS3DRenderer | null>, containerRef: React.MutableRefObject<HTMLDivElement | null>, onKeyboardReady?: () => void }) {
  const { scene, camera, size, gl } = useThree();
  const { handEnabled } = useHand();
  const { fullscreenEnabled } = useFullscreen();
  const { registerResetCallback, registerViewHandlers, notifyViewChanged } = useKeyboardView();
  const { keyboardType } = useKeyboardType();
  const css3DObjectRef = useRef<CSS3DObject | null>(null);
  const rootRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const isRotatingRef = useRef(false);
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const initialRotationRef = useRef({ x: 0, y: 0, z: 0 });
  const initialPositionRef = useRef({ x: 0, y: 0, z: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchCountRef = useRef(0);
  const userHasModifiedViewRef = useRef(false);
  const lastCameraPositionRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const pendingKeyboardReadyRef = useRef(false);
  const readyFrameCountRef = useRef(0);
  const onKeyboardReadyRef = useRef(onKeyboardReady);
  const orbitControlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const scheduleViewSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleViewSave = () => {
    if (scheduleViewSaveRef.current) {
      clearTimeout(scheduleViewSaveRef.current);
    }
    scheduleViewSaveRef.current = setTimeout(() => {
      notifyViewChanged();
    }, 300);
  };
  onKeyboardReadyRef.current = onKeyboardReady;

  // Get scale and camera position based on screen width and keyboard type
  // Separate settings for fullscreen and normal mode, and for each keyboard
  const getResponsiveSettings = () => {
    const screenWidth = window.innerWidth;

    // Keyboard-specific settings
    const keyboardSettings: Record<string, {
      fullscreen: Record<string, { scale: number; cameraX: number; cameraY: number; cameraZ: number; objectX: number; objectY: number; objectZ: number }>;
      normal: Record<string, { scale: number; cameraX: number; cameraY: number; cameraZ: number; objectX: number; objectY: number; objectZ: number }>;
    }> = {
      'asus-ux370uar': {
        fullscreen: {
          sm: { scale: 0.008, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 1.2, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.01, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: 1.5, objectY: 4, objectZ: 0 },
          lg: { scale: 0.014, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 2.5, objectY: 2.9, objectZ: 0 },
          xl: { scale: 0.021, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 2.5, objectY: 2.9, objectZ: 0 },
          '2xl': { scale: 0.025, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 2.5, objectY: 2.9, objectZ: 0 },
        },
        normal: {
          sm: { scale: 0.028, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 3, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.025, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 3, objectY: -1, objectZ: 0 },
          lg: { scale: 0.05, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 3, objectY: -1, objectZ: 0 },
          xl: { scale: 0.022, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 3, objectY: 2.9, objectZ: 0 },
          '2xl': { scale: 0.025, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 3, objectY: 2.9, objectZ: 0 },
        },
      },
      'dell-latitude-5300-2-in-1': {
        fullscreen: {
          sm: { scale: 0.008, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.01, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: 0, objectY: 4, objectZ: 0 },
          lg: { scale: 0.014, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          xl: { scale: 0.018, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 3.3, objectZ: 0 },
          '2xl': { scale: 0.02, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
        },
        normal: {
          sm: { scale: 0.028, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.025, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: 0, objectY: 1.5, objectZ: 0 },
          lg: { scale: 0.038, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 0, objectZ: 0 },
          xl: { scale: 0.018, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 3.3, objectZ: 0 },
          '2xl': { scale: 0.02, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
        },
      },
      'dell-latitude-e7270': {
        fullscreen: {
          sm: { scale: 0.008, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.01, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: 0, objectY: 4, objectZ: 0 },
          lg: { scale: 0.014, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          xl: { scale: 0.018, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 3.3, objectZ: 0 },
          '2xl': { scale: 0.02, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
        },
        normal: {
          sm: { scale: 0.028, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.025, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: 0, objectY: 1.5, objectZ: 0 },
          lg: { scale: 0.038, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 0, objectZ: 0 },
          xl: { scale: 0.018, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 3.3, objectZ: 0 },
          '2xl': { scale: 0.02, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
        },
      },
      'hp-elitebook-820-g4': {
        fullscreen: {
          sm: { scale: 0.008, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.009, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: 0, objectY: 4, objectZ: 0 },
          lg: { scale: 0.014, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          xl: { scale: 0.018, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 3.3, objectZ: 0 },
          '2xl': { scale: 0.02, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
        },
        normal: {
          sm: { scale: 0.028, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.025, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: 0, objectY: 1.5, objectZ: 0 },
          lg: { scale: 0.038, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 0, objectZ: 0 },
          xl: { scale: 0.018, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 3.3, objectZ: 0 },
          '2xl': { scale: 0.02, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
        },
      },
      'toshiba-portege-x30-e': {
        fullscreen: {
          sm: { scale: 0.006, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.008, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: 0, objectY: 5, objectZ: 0 },
          lg: { scale: 0.01, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 5, objectZ: 0 },
          xl: { scale: 0.013, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 5, objectZ: 0 },
          '2xl': { scale: 0.015, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 5, objectZ: 0 },
        },
        normal: {
          sm: { scale: 0.02, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.02, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: 0, objectY: 5, objectZ: 0 },
          lg: { scale: 0.028, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 5, objectZ: 0 },
          xl: { scale: 0.013, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 5, objectZ: 0 },
          '2xl': { scale: 0.015, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: 0, objectY: 5, objectZ: 0 },
        },
      },
      'pc': {
        fullscreen: {
          sm: { scale: 0.006, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: -1, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.008, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: -1.5, objectY: 4, objectZ: 0 },
          lg: { scale: 0.012, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: -2, objectY: 3, objectZ: 0 },
          xl: { scale: 0.016, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: -2.7, objectY: 3, objectZ: 0 },
          '2xl': { scale: 0.019, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: -3.4, objectY: 3, objectZ: 0 },
        },
        normal: {
          sm: { scale: 0.007, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: -1, objectY: 2.9, objectZ: 0 },
          md: { scale: 0.010, cameraX: 0, cameraZ: 17, cameraY: 4.5, objectX: -1.7, objectY: 4, objectZ: 0 },
          lg: { scale: 0.017, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: -3, objectY: 3, objectZ: 0 },
          xl: { scale: 0.014, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: -3, objectY: 3, objectZ: 0 },
          '2xl': { scale: 0.016, cameraX: 0, cameraY: 7, cameraZ: 20, objectX: -3, objectY: 3, objectZ: 0 },
        },
      },
    };

    // Get settings for current keyboard type, fallback to pc if not found
    const currentKeyboardSettings = keyboardSettings[keyboardType] || keyboardSettings['pc'];
    const modeSettings = fullscreenEnabled ? currentKeyboardSettings.fullscreen : currentKeyboardSettings.normal;

    // Determine screen size breakpoint
    let sizeKey: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    if (screenWidth < 640) {
      sizeKey = 'sm';
    } else if (screenWidth < 768) {
      sizeKey = 'md';
    } else if (screenWidth < 1024) {
      sizeKey = 'lg';
    } else if (screenWidth < 1280) {
      sizeKey = 'xl';
    } else {
      sizeKey = '2xl';
    }

    return modeSettings[sizeKey];
  };

  useEffect(() => {
    let cancelled = false;
    let settingsTimer: ReturnType<typeof setTimeout>;
    let readyTimeout: ReturnType<typeof setTimeout>;

    pendingKeyboardReadyRef.current = true;
    readyFrameCountRef.current = 0;

    readyTimeout = setTimeout(() => {
      if (!cancelled && pendingKeyboardReadyRef.current) {
        pendingKeyboardReadyRef.current = false;
        onKeyboardReadyRef.current?.();
      }
    }, KEYBOARD_READY_TIMEOUT_MS);

    const mountKeyboard = (attempt = 0) => {
      if (cancelled) return;

      if (!css3DRendererRef.current || !containerRef.current) {
        if (attempt < 20) {
          setTimeout(() => mountKeyboard(attempt + 1), 50);
        }
        return;
      }

      const keyboardElement = document.createElement('div');
      keyboardElement.style.width = '1200px';
      keyboardElement.style.height = '400px';
      keyboardElement.style.transformStyle = 'preserve-3d';
      keyboardElement.style.perspective = '1000px';

      const css3DObject = new CSS3DObject(keyboardElement);
      css3DObject.scale.set(0, 0, 0);
      css3DObject.position.set(0, 0, 0);

      const applyInitialSettings = () => {
        const settings = getResponsiveSettings();
        css3DObject.scale.set(settings.scale, settings.scale, settings.scale);
        css3DObject.position.set(settings.objectX, settings.objectY, settings.objectZ);
      };

      import('react-dom/client').then(({ createRoot }) => {
        if (cancelled) return;

        const root = createRoot(keyboardElement);
        if (keyboardType === 'asus-ux370uar') {
          root.render(<AsusUX370UAR />);
        } else if (keyboardType === 'dell-latitude-5300-2-in-1') {
          root.render(<DellLatitude53002In1 />);
        } else if (keyboardType === 'dell-latitude-e7270') {
          root.render(<DellLatitudeE7270 />);
        } else if (keyboardType === 'hp-elitebook-820-g4') {
          root.render(<HPEliteBook820G4 />);
        } else if (keyboardType === 'toshiba-portege-x30-e') {
          root.render(<ToshibaPortegeX30E />);
        } else if (keyboardType === 'pc') {
          root.render(<PC />);
        } else {
          root.render(<AsusUX370UAR />);
        }
        rootRef.current = root;

        css3DObject.rotation.x = -Math.PI / 8;
        scene.add(css3DObject);
        css3DObjectRef.current = css3DObject;

        settingsTimer = setTimeout(() => {
          if (cancelled) return;
          applyInitialSettings();
        }, 200);
      });
    };

    const timer = setTimeout(() => mountKeyboard(), 100);

    return () => {
      cancelled = true;
      pendingKeyboardReadyRef.current = false;
      readyFrameCountRef.current = 0;
      clearTimeout(timer);
      clearTimeout(settingsTimer);
      clearTimeout(readyTimeout);
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
      if (css3DObjectRef.current) {
        scene.remove(css3DObjectRef.current);
        css3DObjectRef.current = null;
      }
    };
  }, [scene, css3DRendererRef, containerRef, fullscreenEnabled, keyboardType]);

  // Track last applied settings to avoid unnecessary updates
  const lastAppliedSettingsRef = useRef<{ scale: number; cameraX: number; cameraY: number; cameraZ: number; objectX: number; objectY: number; objectZ: number; screenWidth: number } | null>(null);

  useFrame(() => {
    if (css3DRendererRef.current) {
      // Update CSS3DRenderer whenever the camera or scene changes
      // Sync with the WebGL renderer camera
      css3DRendererRef.current.render(scene, camera);
    }

    if (pendingKeyboardReadyRef.current && css3DObjectRef.current) {
      if (isKeyboardModelReady(css3DObjectRef.current)) {
        readyFrameCountRef.current += 1;
        if (readyFrameCountRef.current >= READY_FRAME_THRESHOLD) {
          pendingKeyboardReadyRef.current = false;
          readyFrameCountRef.current = 0;
          onKeyboardReadyRef.current?.();
        }
      } else {
        readyFrameCountRef.current = 0;
      }
    }

    // Detect if OrbitControls has changed the camera position (when hand mode is disabled)
    if (css3DObjectRef.current && camera && camera instanceof THREE.PerspectiveCamera) {
      if (!handEnabled && lastAppliedSettingsRef.current && !userHasModifiedViewRef.current) {
        const currentSettings = getResponsiveSettings();
        const cameraPos = camera.position;
        const expectedX = currentSettings.cameraX;
        const expectedY = currentSettings.cameraY;
        const expectedZ = currentSettings.cameraZ;
        
        // Check if camera position differs significantly from expected (OrbitControls was used)
        const threshold = 0.01;
        const positionChanged = 
          Math.abs(cameraPos.x - expectedX) > threshold ||
          Math.abs(cameraPos.y - expectedY) > threshold ||
          Math.abs(cameraPos.z - expectedZ) > threshold;
        
        if (positionChanged && lastCameraPositionRef.current) {
          // Camera position changed - OrbitControls was used
          userHasModifiedViewRef.current = true;
          scheduleViewSave();
        }
        
        lastCameraPositionRef.current = {
          x: cameraPos.x,
          y: cameraPos.y,
          z: cameraPos.z
        };
      }

      // Continuously check and update settings if they don't match (for initial fullscreen load)
      // Only update if user hasn't manually modified the view
      if (!userHasModifiedViewRef.current) {
        const currentSettings = getResponsiveSettings();
        const currentScreenWidth = window.innerWidth;

        // Check if settings need updating
        const needsUpdate = !lastAppliedSettingsRef.current ||
          lastAppliedSettingsRef.current.scale !== currentSettings.scale ||
          lastAppliedSettingsRef.current.cameraX !== currentSettings.cameraX ||
          lastAppliedSettingsRef.current.cameraY !== currentSettings.cameraY ||
          lastAppliedSettingsRef.current.cameraZ !== currentSettings.cameraZ ||
          lastAppliedSettingsRef.current.objectX !== currentSettings.objectX ||
          lastAppliedSettingsRef.current.objectY !== currentSettings.objectY ||
          lastAppliedSettingsRef.current.objectZ !== currentSettings.objectZ ||
          lastAppliedSettingsRef.current.screenWidth !== currentScreenWidth;

        if (needsUpdate) {
          css3DObjectRef.current.scale.set(currentSettings.scale, currentSettings.scale, currentSettings.scale);
          css3DObjectRef.current.position.set(currentSettings.objectX, currentSettings.objectY, currentSettings.objectZ);
          camera.position.x = currentSettings.cameraX;
          camera.position.z = currentSettings.cameraZ;
          camera.position.y = currentSettings.cameraY;
          camera.updateProjectionMatrix();

          // Update last applied settings
          lastAppliedSettingsRef.current = {
            scale: currentSettings.scale,
            cameraX: currentSettings.cameraX,
            cameraY: currentSettings.cameraY,
            cameraZ: currentSettings.cameraZ,
            objectX: currentSettings.objectX,
            objectY: currentSettings.objectY,
            objectZ: currentSettings.objectZ,
            screenWidth: currentScreenWidth
          };
          
          // Update last camera position
          lastCameraPositionRef.current = {
            x: currentSettings.cameraX,
            y: currentSettings.cameraY,
            z: currentSettings.cameraZ
          };
        }
      }
    }
  });

  useEffect(() => {
    if (css3DRendererRef.current) {
      css3DRendererRef.current.setSize(size.width, size.height);
    }
  }, [size, css3DRendererRef]);

  // Update scale and camera position based on screen width
  useEffect(() => {
    if (!css3DObjectRef.current) return;

    const updateResponsiveSettings = () => {
      // Don't update if user has manually modified the view
      if (userHasModifiedViewRef.current) return;

      const settings = getResponsiveSettings();
      const currentScreenWidth = window.innerWidth;

      if (css3DObjectRef.current) {
        css3DObjectRef.current.scale.set(settings.scale, settings.scale, settings.scale);
        css3DObjectRef.current.position.set(settings.objectX, settings.objectY, settings.objectZ);
      }

      if (camera && camera instanceof THREE.PerspectiveCamera) {
        camera.position.x = settings.cameraX;
        camera.position.z = settings.cameraZ;
        camera.position.y = settings.cameraY;
        camera.updateProjectionMatrix();

        // Update last applied settings
        lastAppliedSettingsRef.current = {
          scale: settings.scale,
          cameraX: settings.cameraX,
          cameraY: settings.cameraY,
          cameraZ: settings.cameraZ,
          objectX: settings.objectX,
          objectY: settings.objectY,
          objectZ: settings.objectZ,
          screenWidth: currentScreenWidth
        };
      }
    };

    // Initial update with small delay to ensure camera is initialized
    const timer = setTimeout(() => {
      updateResponsiveSettings();
    }, 100);

    // Update on window resize
    window.addEventListener('resize', updateResponsiveSettings);
    
    // Also update when fullscreen mode changes (with multiple delays to ensure window size has updated)
    // This is important because when entering fullscreen, the window size changes but might not be immediate
    const fullscreenTimer1 = setTimeout(() => {
      updateResponsiveSettings();
    }, 200);
    
    const fullscreenTimer2 = setTimeout(() => {
      updateResponsiveSettings();
    }, 500);
    
    const fullscreenTimer3 = setTimeout(() => {
      updateResponsiveSettings();
    }, 800);

    // Also listen for fullscreenchange event to catch browser fullscreen API changes
    const handleFullscreenChange = () => {
      // Wait a bit for window size to update
      setTimeout(() => {
        updateResponsiveSettings();
      }, 100);
      setTimeout(() => {
        updateResponsiveSettings();
      }, 300);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      clearTimeout(timer);
      clearTimeout(fullscreenTimer1);
      clearTimeout(fullscreenTimer2);
      clearTimeout(fullscreenTimer3);
      window.removeEventListener('resize', updateResponsiveSettings);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [size, camera, css3DObjectRef, fullscreenEnabled]);

  // Register reset callback — restores default camera, object transform, and orbit controls
  useEffect(() => {
    const resetView = () => {
      if (!css3DObjectRef.current || !camera || !(camera instanceof THREE.PerspectiveCamera)) return;

      userHasModifiedViewRef.current = false;
      isDraggingRef.current = false;
      isRotatingRef.current = false;
      touchStartRef.current = null;
      touchCountRef.current = 0;
      gl.domElement.style.cursor = handEnabled ? 'grab' : 'default';

      const settings = getResponsiveSettings();

      css3DObjectRef.current.scale.set(settings.scale, settings.scale, settings.scale);
      css3DObjectRef.current.position.set(settings.objectX, settings.objectY, settings.objectZ);
      css3DObjectRef.current.rotation.x = -Math.PI / 8;
      css3DObjectRef.current.rotation.y = 0;
      css3DObjectRef.current.rotation.z = 0;

      camera.position.set(settings.cameraX, settings.cameraY, settings.cameraZ);
      camera.updateProjectionMatrix();

      const controls = orbitControlsRef.current;
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.object.position.set(settings.cameraX, settings.cameraY, settings.cameraZ);
        controls.object.updateProjectionMatrix();
        controls.update();
        controls.saveState();
      }

      lastAppliedSettingsRef.current = {
        scale: settings.scale,
        cameraX: settings.cameraX,
        cameraY: settings.cameraY,
        cameraZ: settings.cameraZ,
        objectX: settings.objectX,
        objectY: settings.objectY,
        objectZ: settings.objectZ,
        screenWidth: window.innerWidth,
      };

      lastCameraPositionRef.current = {
        x: settings.cameraX,
        y: settings.cameraY,
        z: settings.cameraZ,
      };
    };

    const unregister = registerResetCallback(resetView);
    return unregister;
  }, [registerResetCallback, camera, css3DObjectRef, fullscreenEnabled, keyboardType, handEnabled, gl]);

  useEffect(() => {
    const getViewState = () => {
      if (
        !userHasModifiedViewRef.current ||
        !css3DObjectRef.current ||
        !camera ||
        !(camera instanceof THREE.PerspectiveCamera)
      ) {
        return null;
      }

      const object = css3DObjectRef.current;
      const controls = orbitControlsRef.current;

      return {
        scale: object.scale.x,
        cameraX: camera.position.x,
        cameraY: camera.position.y,
        cameraZ: camera.position.z,
        objectX: object.position.x,
        objectY: object.position.y,
        objectZ: object.position.z,
        rotationX: object.rotation.x,
        rotationY: object.rotation.y,
        rotationZ: object.rotation.z,
        targetX: controls?.target.x ?? 0,
        targetY: controls?.target.y ?? 0,
        targetZ: controls?.target.z ?? 0,
      };
    };

    const applyViewState = (state: {
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
    }) => {
      if (!css3DObjectRef.current || !camera || !(camera instanceof THREE.PerspectiveCamera)) return;

      userHasModifiedViewRef.current = true;

      css3DObjectRef.current.scale.set(state.scale, state.scale, state.scale);
      css3DObjectRef.current.position.set(state.objectX, state.objectY, state.objectZ);
      css3DObjectRef.current.rotation.set(state.rotationX, state.rotationY, state.rotationZ);

      camera.position.set(state.cameraX, state.cameraY, state.cameraZ);
      camera.updateProjectionMatrix();

      const controls = orbitControlsRef.current;
      if (controls) {
        controls.target.set(state.targetX, state.targetY, state.targetZ);
        controls.object.position.set(state.cameraX, state.cameraY, state.cameraZ);
        controls.object.updateProjectionMatrix();
        controls.update();
        controls.saveState();
      }

      lastAppliedSettingsRef.current = {
        scale: state.scale,
        cameraX: state.cameraX,
        cameraY: state.cameraY,
        cameraZ: state.cameraZ,
        objectX: state.objectX,
        objectY: state.objectY,
        objectZ: state.objectZ,
        screenWidth: window.innerWidth,
      };

      lastCameraPositionRef.current = {
        x: state.cameraX,
        y: state.cameraY,
        z: state.cameraZ,
      };
    };

    return registerViewHandlers({ getViewState, applyViewState });
  }, [camera, registerViewHandlers]);

  useEffect(() => {
    // Reset dragging/rotating states when handEnabled changes
    isDraggingRef.current = false;
    isRotatingRef.current = false;
    touchStartRef.current = null;
    touchCountRef.current = 0;

    // Reset cursor when hand mode is disabled
    if (!handEnabled) {
      gl.domElement.style.cursor = 'default';
      return;
    }

    if (!css3DObjectRef.current) return;

    // Set cursor to grab when hand mode is enabled
    gl.domElement.style.cursor = 'grab';

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        isDraggingRef.current = true;
        userHasModifiedViewRef.current = true; // Mark that user has modified the view
        lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
        if (css3DObjectRef.current) {
          initialPositionRef.current = {
            x: css3DObjectRef.current.position.x,
            y: css3DObjectRef.current.position.y,
            z: css3DObjectRef.current.position.z,
          };
        }
        gl.domElement.style.cursor = 'grabbing';
        e.preventDefault();
      } else if (e.button === 2) { // Right click
        isRotatingRef.current = true;
        userHasModifiedViewRef.current = true; // Mark that user has modified the view
        lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
        if (css3DObjectRef.current) {
          initialRotationRef.current = {
            x: css3DObjectRef.current.rotation.x,
            y: css3DObjectRef.current.rotation.y,
            z: css3DObjectRef.current.rotation.z,
          };
        }
        gl.domElement.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };

    // Helper function to convert screen movement to world movement
    const screenToWorldMovement = (deltaX: number, deltaY: number, camera: THREE.PerspectiveCamera, size: { width: number; height: number }): { x: number; y: number } => {
      // Get the distance from camera to object (approximate depth)
      const objectWorldPos = css3DObjectRef.current?.position || new THREE.Vector3(0, 0, 0);
      const cameraPos = camera.position;
      const distance = cameraPos.distanceTo(objectWorldPos);
      
      // Calculate world movement based on camera's field of view and distance
      // This makes the movement feel 1:1 with screen movement
      const fov = camera.fov * (Math.PI / 180);
      const heightAtDistance = 2 * Math.tan(fov / 2) * distance;
      const widthAtDistance = heightAtDistance * (size.width / size.height);
      
      // Convert screen pixels to world units
      const worldX = (deltaX / size.width) * widthAtDistance;
      const worldY = -(deltaY / size.height) * heightAtDistance; // Negative Y because screen Y is inverted
      
      return { x: worldX, y: worldY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!css3DObjectRef.current || !camera || !(camera instanceof THREE.PerspectiveCamera)) return;

      const deltaX = e.clientX - lastMousePositionRef.current.x;
      const deltaY = e.clientY - lastMousePositionRef.current.y;

      if (isDraggingRef.current) {
        // Convert screen movement to world movement
        const worldMovement = screenToWorldMovement(deltaX, deltaY, camera, size);
        
        // Apply movement in camera's right and up directions (screen space)
        camera.updateMatrixWorld();
        const cameraRight = new THREE.Vector3();
        const cameraUp = new THREE.Vector3();
        cameraRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
        cameraUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
        
        // Move the keyboard in screen space (right and up relative to camera)
        const moveVector = new THREE.Vector3()
          .addScaledVector(cameraRight, worldMovement.x)
          .addScaledVector(cameraUp, worldMovement.y);
        
        css3DObjectRef.current.position.x = initialPositionRef.current.x + moveVector.x;
        css3DObjectRef.current.position.y = initialPositionRef.current.y + moveVector.y;
        css3DObjectRef.current.position.z = initialPositionRef.current.z + moveVector.z;
        
        // Update last position for smooth continuous dragging
        lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
        initialPositionRef.current = {
          x: css3DObjectRef.current.position.x,
          y: css3DObjectRef.current.position.y,
          z: css3DObjectRef.current.position.z,
        };
      } else if (isRotatingRef.current) {
        // Rotate the keyboard - use screen movement directly for rotation
        const rotationSensitivity = 0.005; // Adjust for natural rotation feel
        css3DObjectRef.current.rotation.y = initialRotationRef.current.y + deltaX * rotationSensitivity;
        css3DObjectRef.current.rotation.x = initialRotationRef.current.x + deltaY * rotationSensitivity;
        // Update last position for smooth continuous rotation
        lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
        initialRotationRef.current = {
          x: css3DObjectRef.current.rotation.x,
          y: css3DObjectRef.current.rotation.y,
          z: css3DObjectRef.current.rotation.z,
        };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        if (isDraggingRef.current) {
          scheduleViewSave();
        }
        isDraggingRef.current = false;
        gl.domElement.style.cursor = 'grab';
      } else if (e.button === 2) {
        if (isRotatingRef.current) {
          scheduleViewSave();
        }
        isRotatingRef.current = false;
        gl.domElement.style.cursor = 'grab';
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (handEnabled) {
        e.preventDefault();
      }
    };

    const handleMouseLeave = () => {
      // Reset cursor when mouse leaves canvas
      if (handEnabled) {
        gl.domElement.style.cursor = 'grab';
      } else {
        gl.domElement.style.cursor = 'default';
      }
      isDraggingRef.current = false;
      isRotatingRef.current = false;
    };

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (!css3DObjectRef.current) return;
      
      touchCountRef.current = e.touches.length;
      
      if (e.touches.length === 1) {
        // Single touch - start dragging
        const touch = e.touches[0];
        isDraggingRef.current = true;
        isRotatingRef.current = false;
        userHasModifiedViewRef.current = true; // Mark that user has modified the view
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        lastMousePositionRef.current = { x: touch.clientX, y: touch.clientY };
        initialPositionRef.current = {
          x: css3DObjectRef.current.position.x,
          y: css3DObjectRef.current.position.y,
          z: css3DObjectRef.current.position.z,
        };
        e.preventDefault();
      } else if (e.touches.length === 2) {
        // Two touches - start rotating (or switch from dragging to rotating)
        const touch = e.touches[0];
        isRotatingRef.current = true;
        isDraggingRef.current = false;
        userHasModifiedViewRef.current = true; // Mark that user has modified the view
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        lastMousePositionRef.current = { x: touch.clientX, y: touch.clientY };
        initialRotationRef.current = {
          x: css3DObjectRef.current.rotation.x,
          y: css3DObjectRef.current.rotation.y,
          z: css3DObjectRef.current.rotation.z,
        };
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!css3DObjectRef.current || !camera || !(camera instanceof THREE.PerspectiveCamera)) return;
      
      touchCountRef.current = e.touches.length;
      
      if (e.touches.length === 0) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastMousePositionRef.current.x;
      const deltaY = touch.clientY - lastMousePositionRef.current.y;

      if (isDraggingRef.current && e.touches.length === 1) {
        // Convert screen movement to world movement
        const worldMovement = screenToWorldMovement(deltaX, deltaY, camera, size);
        
        // Apply movement in camera's right and up directions (screen space)
        camera.updateMatrixWorld();
        const cameraRight = new THREE.Vector3();
        const cameraUp = new THREE.Vector3();
        cameraRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
        cameraUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
        
        // Move the keyboard in screen space (right and up relative to camera)
        const moveVector = new THREE.Vector3()
          .addScaledVector(cameraRight, worldMovement.x)
          .addScaledVector(cameraUp, worldMovement.y);
        
        css3DObjectRef.current.position.x = initialPositionRef.current.x + moveVector.x;
        css3DObjectRef.current.position.y = initialPositionRef.current.y + moveVector.y;
        css3DObjectRef.current.position.z = initialPositionRef.current.z + moveVector.z;
        
        // Update last position for smooth continuous dragging
        lastMousePositionRef.current = { x: touch.clientX, y: touch.clientY };
        initialPositionRef.current = {
          x: css3DObjectRef.current.position.x,
          y: css3DObjectRef.current.position.y,
          z: css3DObjectRef.current.position.z,
        };
        e.preventDefault();
      } else if (isRotatingRef.current && e.touches.length === 2) {
        // Two touch rotation - use screen movement directly for rotation
        const rotationSensitivity = 0.005; // Adjust for natural rotation feel
        css3DObjectRef.current.rotation.y = initialRotationRef.current.y + deltaX * rotationSensitivity;
        css3DObjectRef.current.rotation.x = initialRotationRef.current.x + deltaY * rotationSensitivity;
        // Update last position for smooth continuous rotation
        lastMousePositionRef.current = { x: touch.clientX, y: touch.clientY };
        initialRotationRef.current = {
          x: css3DObjectRef.current.rotation.x,
          y: css3DObjectRef.current.rotation.y,
          z: css3DObjectRef.current.rotation.z,
        };
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        // All touches ended
        if (isDraggingRef.current || isRotatingRef.current) {
          scheduleViewSave();
        }
        isDraggingRef.current = false;
        isRotatingRef.current = false;
        touchStartRef.current = null;
        touchCountRef.current = 0;
      } else if (e.touches.length === 1 && isRotatingRef.current && css3DObjectRef.current) {
        // Switched from two touches to one - switch to dragging
        isRotatingRef.current = false;
        isDraggingRef.current = true;
        userHasModifiedViewRef.current = true; // Mark that user has modified the view
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        lastMousePositionRef.current = { x: touch.clientX, y: touch.clientY };
        // Update initial position to current position for smooth transition
        initialPositionRef.current = {
          x: css3DObjectRef.current.position.x,
          y: css3DObjectRef.current.position.y,
          z: css3DObjectRef.current.position.z,
        };
      }
    };

    const handleTouchCancel = () => {
      isDraggingRef.current = false;
      isRotatingRef.current = false;
      touchStartRef.current = null;
      touchCountRef.current = 0;
    };

    const canvas = gl.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
      // Reset cursor on cleanup
      gl.domElement.style.cursor = 'default';
    };
  }, [handEnabled, gl]);

  return (
    <>
      <KeyboardButtonHoverDetector css3DRendererRef={css3DRendererRef} css3DObjectRef={css3DObjectRef} />
      <KeyboardSyncHandler />
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={!handEnabled}
        enableZoom={true}
        enableRotate={!handEnabled}
        minDistance={0.1}
        maxDistance={Infinity}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.8}
        target={[0, 0, 0]}
        autoRotate={false}
        onEnd={scheduleViewSave}
      />
    </>
  );
}

export default function Keyboard() {
  const { handEnabled } = useHand();
  const { keyboardType } = useKeyboardType();
  const { fullscreenEnabled } = useFullscreen();
  const css3DRendererRef = useRef<CSS3DRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isKeyboardLoading, setIsKeyboardLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [fKeyToast, setFKeyToast] = useState<{ title: string; description: string } | null>(null);
  const fKeyToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ title: string; description: string }>).detail;
      setFKeyToast(detail);
      if (fKeyToastTimerRef.current) clearTimeout(fKeyToastTimerRef.current);
      fKeyToastTimerRef.current = setTimeout(() => setFKeyToast(null), 3000);
    };
    window.addEventListener(KEY_PRESS_TOAST_EVENT, handler);
    return () => {
      window.removeEventListener(KEY_PRESS_TOAST_EVENT, handler);
      if (fKeyToastTimerRef.current) clearTimeout(fKeyToastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setIsKeyboardLoading(true);
  }, [keyboardType, fullscreenEnabled]);

  const handleKeyboardReady = useCallback(() => {
    setHasLoadedOnce(true);
    setIsKeyboardLoading(false);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create container for CSS3D renderer
    const css3DContainer = document.createElement('div');
    css3DContainer.style.position = 'absolute';
    css3DContainer.style.top = '0';
    css3DContainer.style.left = '0';
    css3DContainer.style.width = '100%';
    css3DContainer.style.height = '100%';
    css3DContainer.style.pointerEvents = 'none';
    css3DContainer.style.zIndex = '0';
    containerRef.current.appendChild(css3DContainer);

    // Create CSS3D renderer
    const css3DRenderer = new CSS3DRenderer();
    const rect = containerRef.current.getBoundingClientRect();
    css3DRenderer.setSize(rect.width, rect.height);
    // Ensure the CSS3DRenderer domElement doesn't block pointer events
    css3DRenderer.domElement.style.pointerEvents = 'none';
    css3DRenderer.domElement.style.position = 'absolute';
    css3DRenderer.domElement.style.top = '0';
    css3DRenderer.domElement.style.left = '0';
    css3DContainer.appendChild(css3DRenderer.domElement);
    css3DRendererRef.current = css3DRenderer;

    // Handle resize
    const handleResize = () => {
      if (css3DRendererRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        css3DRendererRef.current.setSize(rect.width, rect.height);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (css3DRendererRef.current && css3DContainer) {
        css3DContainer.removeChild(css3DRendererRef.current.domElement);
      }
      if (css3DContainer && containerRef.current) {
        containerRef.current.removeChild(css3DContainer);
      }
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full bg-card/40 backdrop-blur-md rounded-xl overflow-hidden min-h-[100px] sm:min-h-[150px] md:min-h-[200px] relative transition-all duration-300 ease-in-out"
      style={{ cursor: handEnabled ? 'grab' : 'default' }}
    >
      <AnimatePresence>
        {isKeyboardLoading && (
          <KeyboardLoader
            key={keyboardType}
            keyboardType={keyboardType}
            isSwitching={hasLoadedOnce}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {fKeyToast && (
          <motion.div
            key={fKeyToast.title}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-start gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card/90 backdrop-blur-md shadow-xl w-max max-w-[min(24rem,calc(100%-2rem))] pointer-events-none"
          >
            <div className="flex items-center justify-center min-h-9 min-w-9 px-2.5 py-1.5 rounded-lg bg-primary/15 border border-primary/30 flex-shrink-0 self-start">
              <span className={`text-xs font-bold text-primary font-mono text-center leading-tight ${fKeyToast.title.includes(' + ') ? 'whitespace-normal' : 'whitespace-nowrap'}`}>
                {fKeyToast.title}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground leading-tight">
                {fKeyToast.title.includes(' + ')
                  ? 'Keyboard shortcut'
                  : fKeyToast.title === 'Esc'
                    ? 'Escape Key'
                    : `${fKeyToast.title} Key`}
              </span>
              <span className="text-xs text-muted-foreground leading-snug break-words">{fKeyToast.description}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Canvas
        style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, cursor: handEnabled ? 'grab' : 'default' }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={50} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, 10, -5]} intensity={0.5} />
        <Keyboard3D css3DRendererRef={css3DRendererRef} containerRef={containerRef} onKeyboardReady={handleKeyboardReady} />
      </Canvas>
    </motion.div>
  );
}
