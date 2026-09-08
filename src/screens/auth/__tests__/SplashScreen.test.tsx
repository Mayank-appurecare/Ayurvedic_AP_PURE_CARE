import React from 'react';
import { waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from '../SplashScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useAuth } from '../../../context/AuthContext';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ replace: mockReplace }),
}));

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    user: null,
    isLoading: false,
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SplashScreen', () => {
  it('navigates straight to Main when a session is already restored', async () => {
    mockAuth({
      user: {
        id: 'u1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
        isGuest: false,
      },
    });
    await renderScreen(<SplashScreen />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('Main'), { timeout: 3000 });
  }, 10000);

  it('navigates to Welcome when there is no session but onboarding was already seen', async () => {
    mockAuth({ user: null });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    await renderScreen(<SplashScreen />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('Welcome'), { timeout: 3000 });
  }, 10000);

  it('navigates to Onboarding on a fresh install with no session and no onboarding flag', async () => {
    mockAuth({ user: null });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await renderScreen(<SplashScreen />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('Onboarding'), { timeout: 3000 });
  }, 10000);
});
