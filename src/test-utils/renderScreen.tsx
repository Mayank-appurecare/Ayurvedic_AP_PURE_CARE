import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeContext';

const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export function renderScreen(ui: React.ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>
  );
}
