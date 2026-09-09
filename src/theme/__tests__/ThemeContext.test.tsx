import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../ThemeContext';
import { colors as lightColors } from '../colors';
import { darkColors } from '../darkColors';

const STORAGE_KEY = '@ojas_ayurveda/theme_preference';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

async function renderReadyTheme() {
  const view = await renderHook(() => useTheme(), { wrapper });
  await waitFor(() => expect(view.result.current.isThemeReady).toBe(true));
  return view;
}

describe('ThemeContext startup', () => {
  it('starts not ready and defaults to light while the stored preference loads', async () => {
    const resolvers: ((value: string | null) => void)[] = [];
    (AsyncStorage.getItem as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        })
    );

    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current.isThemeReady).toBe(false);
    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toBe(lightColors);

    await act(async () => {
      resolvers.forEach((resolve) => resolve(null));
    });
    await waitFor(() => expect(result.current.isThemeReady).toBe(true));

    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toBe(lightColors);
  });

  it('becomes ready in light mode when nothing is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const { result } = await renderReadyTheme();

    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toBe(lightColors);
  });

  it('restores dark mode when "dark" was stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    const { result } = await renderReadyTheme();

    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toBe(darkColors);
  });

  it('stays in light mode for any stored value other than "dark"', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('light');
    const { result } = await renderReadyTheme();

    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toBe(lightColors);
  });

  it('still becomes ready even if reading the stored preference fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage unavailable'));
    const { result } = await renderReadyTheme();

    expect(result.current.isDark).toBe(false);
  });
});

describe('ThemeContext setIsDark / toggleTheme', () => {
  it('setIsDark(true) switches to dark colors and persists "dark"', async () => {
    const { result } = await renderReadyTheme();

    await act(() => result.current.setIsDark(true));

    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toBe(darkColors);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'dark');
  });

  it('setIsDark(false) switches to light colors and persists "light"', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    const { result } = await renderReadyTheme();
    expect(result.current.isDark).toBe(true);

    await act(() => result.current.setIsDark(false));

    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toBe(lightColors);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'light');
  });

  it('toggleTheme flips from light to dark and persists it', async () => {
    const { result } = await renderReadyTheme();

    await act(() => result.current.toggleTheme());

    expect(result.current.isDark).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'dark');
  });

  it('toggleTheme flips from dark back to light and persists it', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    const { result } = await renderReadyTheme();

    await act(() => result.current.toggleTheme());

    expect(result.current.isDark).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'light');
  });

  it('does not throw when persisting the preference fails', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('disk full'));
    const { result } = await renderReadyTheme();

    await act(() => result.current.setIsDark(true));

    expect(result.current.isDark).toBe(true);
  });
});

describe('useTheme outside a provider', () => {
  it('throws when used outside of a ThemeProvider', async () => {
    await expect(renderHook(() => useTheme())).rejects.toThrow(
      'useTheme must be used within ThemeProvider'
    );
  });
});
