import { Dimensions, PixelRatio } from 'react-native';

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#1E2B1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E2B1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1E2B1F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
};

// --- Responsive helpers -----------------------------------------------
// Base design width referenced from the roadmap mock (a common mid-size phone).
const BASE_WIDTH = 375;

export function getWindowWidth() {
  return Dimensions.get('window').width;
}

/** Scales a size proportionally to screen width, clamped to avoid extremes on tablets/small phones. */
export function scale(size: number, min?: number, max?: number) {
  const width = getWindowWidth();
  const ratio = width / BASE_WIDTH;
  const clampedRatio = Math.min(Math.max(ratio, 0.85), 1.25);
  const value = size * clampedRatio;
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return PixelRatio.roundToNearestPixel(value);
}

export function isTablet() {
  const { width, height } = Dimensions.get('window');
  const smallest = Math.min(width, height);
  return smallest >= 600;
}

export function isSmallDevice() {
  return getWindowWidth() <= 360;
}

/** Returns number of grid columns for product grids based on width breakpoints. */
export function gridColumns() {
  const width = getWindowWidth();
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  if (width >= 480) return 3;
  return 2;
}

/**
 * Columns for the CATEGORY grid.
 *
 * Takes the width as an argument rather than reading `Dimensions` itself, so
 * the caller can drive it from `useWindowDimensions()` and actually re-render
 * when the window resizes — `Dimensions.get()` is a one-shot read and leaves a
 * desktop column count stuck in place after a resize down to phone width.
 *
 * Phones get exactly 3 across; wider screens add columns so cards stay a
 * readable size instead of stretching.
 */
export function categoryGridColumns(width: number) {
  if (width >= 1280) return 7;
  if (width >= 1024) return 6;
  if (width >= 768) return 5;
  if (width >= 600) return 4;
  return 3;
}

export const breakpoints = {
  xs: 320,
  sm: 360,
  md: 414,
  lg: 480,
  tablet: 768,
  tabletLg: 820,
  desktop: 1024,
};
