import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { WelcomeScreen } from '../WelcomeScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/auth';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../../../services/auth', () => ({
  authService: { checkReachable: jest.fn() },
}));

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, replace: mockReplace }),
}));

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    continueAsGuest: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth();
  (authService.checkReachable as jest.Mock).mockResolvedValue(true);
});

describe('WelcomeScreen', () => {
  it('shows no API notice when the backend is reachable', async () => {
    await renderScreen(<WelcomeScreen />);
    await waitFor(() => expect(authService.checkReachable).toHaveBeenCalled());

    expect(screen.queryByText(/Can't reach the server/)).toBeNull();
  });

  it('shows an API-unreachable notice when the backend cannot be reached', async () => {
    (authService.checkReachable as jest.Mock).mockResolvedValue(false);
    await renderScreen(<WelcomeScreen />);

    expect(await screen.findByText(/Can't reach the server/)).toBeTruthy();
  });

  it('navigates to Login when the Login button is pressed', async () => {
    await renderScreen(<WelcomeScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'Login' }));

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('continues as a guest and replaces with Main', async () => {
    const continueAsGuest = jest.fn().mockResolvedValue(undefined);
    mockAuth({ continueAsGuest });
    await renderScreen(<WelcomeScreen />);

    fireEvent.press(await screen.findByLabelText('Continue as guest'));

    await waitFor(() => expect(continueAsGuest).toHaveBeenCalledTimes(1));
    expect(mockReplace).toHaveBeenCalledWith('Main');
  });
});
