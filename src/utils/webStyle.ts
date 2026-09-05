import { Platform } from 'react-native';

/**
 * Spreads style properties that only react-native-web understands (CSS
 * properties with no React Native equivalent, e.g. `outlineStyle`).
 *
 * On native it yields nothing, so the property is never handed to the native
 * style system. Returns `any` so the result can be spread into a
 * `StyleSheet.create` entry without fighting React Native's style types.
 */
export function webOnly(style: Record<string, string | number>): any {
  return Platform.OS === 'web' ? style : {};
}
