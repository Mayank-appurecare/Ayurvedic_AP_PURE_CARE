import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useAuth } from '../../../context/AuthContext';
import { AuthError } from '../../../services/auth/types';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    requestOtp: jest.fn(),
    ...overrides,
  });
}

async function typeMobile(text: string) {
  const input = await screen.findByLabelText('Mobile number');
  fireEvent.changeText(input, text);
  return screen.findByLabelText('Mobile number');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth();
});

describe('LoginScreen', () => {
  it('strips non-digits and caps input at 10 digits as the user types', async () => {
    await renderScreen(<LoginScreen />);
    const input = await typeMobile('abc98765432109xyz');
    expect(input.props.value).toBe('98765 43210');
  });

  it('shows a validation error and does not call requestOtp for an incomplete number', async () => {
    const requestOtp = jest.fn();
    mockAuth({ requestOtp });
    await renderScreen(<LoginScreen />);

    await typeMobile('987');
    fireEvent.press(await screen.findByRole('button', { name: 'Send OTP' }));

    expect(await screen.findByText(/Enter all 10 digits/)).toBeTruthy();
    expect(requestOtp).not.toHaveBeenCalled();
  });

  it('requests an OTP and navigates to OTPVerification on success', async () => {
    const challenge = { id: 'c1' };
    const requestOtp = jest.fn().mockResolvedValue(challenge);
    mockAuth({ requestOtp });
    await renderScreen(<LoginScreen />);

    await typeMobile('9876543210');
    fireEvent.press(await screen.findByRole('button', { name: 'Send OTP' }));

    await waitFor(() => expect(requestOtp).toHaveBeenCalledWith('9876543210'));
    expect(mockNavigate).toHaveBeenCalledWith('OTPVerification', {
      mode: 'login',
      mobile: '9876543210',
      challenge,
    });
  });

  it('shows the AuthError message when requestOtp rejects with a known error', async () => {
    const requestOtp = jest
      .fn()
      .mockRejectedValue(new AuthError('INVALID_PHONE', 'This number looks invalid.'));
    mockAuth({ requestOtp });
    await renderScreen(<LoginScreen />);

    await typeMobile('9876543210');
    fireEvent.press(await screen.findByRole('button', { name: 'Send OTP' }));

    expect(await screen.findByText('This number looks invalid.')).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows a generic fallback message for an unknown error', async () => {
    const requestOtp = jest.fn().mockRejectedValue(new Error('boom'));
    mockAuth({ requestOtp });
    await renderScreen(<LoginScreen />);

    await typeMobile('9876543210');
    fireEvent.press(await screen.findByRole('button', { name: 'Send OTP' }));

    expect(await screen.findByText(/Could not start verification/)).toBeTruthy();
  });

  it('shows a mock notice instead of navigating for social login buttons', async () => {
    await renderScreen(<LoginScreen />);
    fireEvent.press(await screen.findByRole('button', { name: /Google/ }));

    expect(await screen.findByText('Social login is a mock UI for this demo.')).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
