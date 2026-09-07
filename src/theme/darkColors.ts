// Dark-mode counterpart of colors.ts — same keys, same AP Pure Care identity
// (deep green + warm gold on a dark ground instead of green-on-cream), so any
// component that switches from `colors` to the active theme's colors keeps
// working without further changes.
import { colors as light } from './colors';

export const darkColors: typeof light = {
  // Brand
  primary: '#5A9268', // lighter, higher-contrast green for a dark ground
  primaryDark: '#3A6245',
  primaryLight: '#7FB98C',
  primarySurface: '#1C2E20', // dark green surface for tags/chips

  // Accents
  accentGold: '#DDAE54',
  accentTerracotta: '#D18868',
  accentSand: '#3B3524',

  // Neutrals / backgrounds
  background: '#141C12', // deep natural charcoal-green
  surface: '#1C2519',
  surfaceMuted: '#232E1F',
  border: '#33402E',
  divider: '#2A3526',

  // Text
  textPrimary: '#F1EFE2', // warm off-white
  textSecondary: '#B9C2AF',
  textMuted: '#7E8A76',
  textInverse: '#1E2B1F',
  textOnPrimary: '#FFFFFF',

  // Semantic
  success: '#5FBE81',
  successSurface: '#1D3324',
  warning: '#DDAE54',
  warningSurface: '#3A2F17',
  danger: '#E17F60',
  dangerSurface: '#3A2018',
  info: '#6FA0D8',
  infoSurface: '#1B2A38',

  // Product / pricing
  mrpStrike: '#77836F',
  discount: '#E17F60',
  star: '#E3B657',
  starEmpty: '#3A4535',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(255, 255, 255, 0.06)',
  shadow: '#000000',

  // Admin (kept for type parity; customer app no longer routes to admin)
  adminBg: '#141C12',
  adminSidebar: '#1F3B23',
  adminAccent: '#5A9268',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};
