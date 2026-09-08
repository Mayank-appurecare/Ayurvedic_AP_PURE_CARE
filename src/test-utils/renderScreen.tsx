import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeContext';

const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Renders a screen inside the providers every screen needs.
 *
 * The providers are passed as RNTL's `wrapper` rather than wrapped around `ui`
 * inline, because that is what makes the returned `rerender` keep them — an
 * inline wrapper would be replaced by the bare element on re-render, and the
 * screen would lose its theme.
 */
export function renderScreen(ui: React.ReactElement) {
  return render(ui, { wrapper: Providers });
}
