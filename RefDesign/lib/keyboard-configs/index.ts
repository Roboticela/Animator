/**
 * Keyboard button configuration exports
 * 
 * This file exports all keyboard button configurations for use in Keyboard.tsx
 * Each configuration maps button IDs to their primary and secondary key codes.
 * Secondary keys are left empty if they are icons/function keys (to be filled manually).
 */

export { toshibaPortegeX30EConfig } from './toshiba-portege-x30-e';
export { asusUX370UARConfig } from './asus-ux370uar';
export { dellLatitude53002In1Config } from './dell-latitude-5300-2-in-1';
export { dellLatitudeE7270Config } from './dell-latitude-e7270';
export { hpEliteBook820G4Config } from './hp-elitebook-820-g4';
export { pcConfig } from './pc';

import type { KeyboardButtonConfig } from '../keyboard-button-types';
import { toshibaPortegeX30EConfig } from './toshiba-portege-x30-e';
import { asusUX370UARConfig } from './asus-ux370uar';
import { dellLatitude53002In1Config } from './dell-latitude-5300-2-in-1';
import { dellLatitudeE7270Config } from './dell-latitude-e7270';
import { hpEliteBook820G4Config } from './hp-elitebook-820-g4';
import { pcConfig } from './pc';

/**
 * Map of keyboard types to their button configurations
 */
export const keyboardConfigs: Record<string, KeyboardButtonConfig> = {
  'toshiba-portege-x30-e': toshibaPortegeX30EConfig,
  'asus-ux370uar': asusUX370UARConfig,
  'dell-latitude-5300-2-in-1': dellLatitude53002In1Config,
  'dell-latitude-e7270': dellLatitudeE7270Config,
  'hp-elitebook-820-g4': hpEliteBook820G4Config,
  'pc': pcConfig,
};

/**
 * Get keyboard button configuration by keyboard type
 */
export function getKeyboardConfig(keyboardType: string): KeyboardButtonConfig | undefined {
  return keyboardConfigs[keyboardType];
}

