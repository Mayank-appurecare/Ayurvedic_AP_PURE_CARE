import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as lightColors } from './colors';
import { darkColors } from './darkColors';

export type AppColors = typeof lightColors;

interface ThemeContextValue {
  colors: AppColors;
  isDark: boolean;
  isThemeReady: boolean;
  toggleTheme: () => void;
  setIsDark: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = '@ojas_ayurveda/theme_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDarkState] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'dark') setIsDarkState(true);
      } catch {
        // Corrupt or unavailable storage: keep the light-theme default.
      } finally {
        setIsThemeReady(true);
      }
    })();
  }, []);

  const setIsDark = (value: boolean) => {
    setIsDarkState(value);
    AsyncStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light').catch(() => {});
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      isThemeReady,
      toggleTheme: () => setIsDark(!isDark),
      setIsDark,
    }),
    [isDark, isThemeReady]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
