// AP Pure Care design tokens — natural, premium, minimal Ayurvedic palette.
export const colors = {
  // Brand
  primary: '#2F5233', // deep natural green
  primaryDark: '#1F3B23',
  primaryLight: '#4C7A52',
  primarySurface: '#E7F0E4', // pale green surface for tags/chips

  // Accents
  accentGold: '#C68A3A', // turmeric/earthy gold for offers & ratings highlight
  accentTerracotta: '#B5603F',
  accentSand: '#E4D5B7',

  // Neutrals / backgrounds
  background: '#FBF8F2', // soft cream
  surface: '#FFFFFF',
  surfaceMuted: '#F3EEE3',
  border: '#E7E1D3',
  divider: '#EDE8DC',

  // Text
  textPrimary: '#1E2B1F', // dark green-black
  textSecondary: '#5B6B5C',
  textMuted: '#8B9A8C',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Semantic
  success: '#3E8E5A',
  successSurface: '#E5F3EA',
  warning: '#C68A3A',
  warningSurface: '#FBF0DE',
  danger: '#B3452C',
  dangerSurface: '#FBEAE4',
  info: '#3B6FA0',
  infoSurface: '#E7EFF7',

  // Product / pricing
  mrpStrike: '#9AA79B',
  discount: '#B3452C',
  star: '#D9A441',
  starEmpty: '#E4DFD1',

  // Overlays
  overlay: 'rgba(20, 30, 21, 0.55)',
  overlayLight: 'rgba(20, 30, 21, 0.08)',
  shadow: '#1E2B1F',

  // Admin
  adminBg: '#F5F6F4',
  adminSidebar: '#1F3B23',
  adminAccent: '#2F5233',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export type ColorKey = keyof typeof colors;
