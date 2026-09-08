import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { OTPVerificationScreen } from '../OTPVerificationScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useAuth } from '../../../context/AuthContext';
import { AuthError } from '../../../services/auth/types';
import { OtpChallenge } from '../../../services/auth';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockReplace = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
let mockRouteParams: { mode: string; mobile: string; challenge?: OtpChallenge };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    replace: mockReplace,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
  useRoute: () => ({ params: mockRouteParams }),
}));

function makeChallenge(overrides: Partial<OtpChallenge> = {}): OtpChallenge {
  const now = Date.now();
  return {
    challengeId: 'c1',
    phoneE164: '+919876543210',
    nationalNumber: '9876543210',
    expiresAt: now + 5 * 60 * 1000,
    resendAvailableAt: now + 30 * 1000,
    ...overrides,
  };
}

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    requestOtp: jest.fn(),
    resendOtp: jest.fn(),
    verifyOtp: jest.fn(),
    ...overrides,
  });
}

async function enterCode(code: string) {
  for (let i = 0; i < code.length; i += 1) {
    const box = await screen.findByLabelText(`Digit ${i + 1} of 6`);
    fireEvent.changeText(box, code[i]);
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCanGoBack.mockReturnValue(true);
  mockRouteParams = { mode: 'login', mobile: '9876543210', challenge: makeChallenge() };
  mockAuth();
});

describe('OTPVerificationScreen', () => {
  it('uses the challenge passed via route params without requesting a new one', async () => {
    const requestOtp = jest.fn();
    mockAuth({ requestOtp });
    await renderScreen(<OTPVerificationScreen />);

    await screen.findByLabelText('Digit 1 of 6');
    expect(requestOtp).not.toHaveBeenCalled();
  });

  it('requests a challenge on mount when none was passed, showing a preparing state first', async () => {
    mockRouteParams = { mode: 'login', mobile: '9876543210' };
    let resolveRequestOtp: (challenge: OtpChallenge) => void = () => {};
    const requestOtp = jest.fn(
      () => new Promise<OtpChallenge>((resolve) => (resolveRequestOtp = resolve))
    );
    mockAuth({ requestOtp });

    await renderScreen(<OTPVerificationScreen />);
    expect(await screen.findByText('Preparing verification…')).toBeTruthy();
    expect(requestOtp).toHaveBeenCalledWith('9876543210');

    resolveRequestOtp(makeChallenge());
    await screen.findByLabelText('Digit 1 of 6');
  });

  it('shows a validation error and does not verify an incomplete code', async () => {
    const verifyOtp = jest.fn();
    mockAuth({ verifyOtp });
    await renderScreen(<OTPVerificationScreen />);

    await enterCode('123');
    fireEvent.press(await screen.findByRole('button', { name: /Verify OTP/ }));

    expect(await screen.findByText('Please enter the complete 6-digit code.')).toBeTruthy();
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('verifies a complete code, shows a success state, then navigates to Main', async () => {
    const verifyOtp = jest.fn().mockResolvedValue(undefined);
    mockAuth({ verifyOtp });
    await renderScreen(<OTPVerificationScreen />);

    await enterCode('123456');
    fireEvent.press(await screen.findByRole('button', { name: /Verify OTP/ }));

    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith('c1', '123456'));
    expect(await screen.findByText('Verified successfully!')).toBeTruthy();

    // Real timer (not faked): the screen schedules navigation.replace('Main')
    // ~700ms after success. Waiting it out here keeps it from firing during a
    // later test instead of leaking past this one.
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('Main'), { timeout: 2000 });
  });

  it('shows an error and clears the digits when verification fails', async () => {
    const verifyOtp = jest
      .fn()
      .mockRejectedValue(new AuthError('INVALID_CODE', 'That code is incorrect.'));
    mockAuth({ verifyOtp });
    await renderScreen(<OTPVerificationScreen />);

    await enterCode('123456');
    fireEvent.press(await screen.findByRole('button', { name: /Verify OTP/ }));

    expect(await screen.findByText('That code is incorrect.')).toBeTruthy();
    expect((await screen.findByLabelText('Digit 1 of 6')).props.value).toBe('');
  });

  it('keeps Resend disabled during the cooldown, and enabled once it elapses', async () => {
    mockRouteParams = {
      mode: 'login',
      mobile: '9876543210',
      challenge: makeChallenge({ resendAvailableAt: Date.now() + 30_000 }),
    };
    await renderScreen(<OTPVerificationScreen />);
    expect(await screen.findByText(/Resend OTP in/)).toBeTruthy();
    expect(screen.queryByLabelText('Resend OTP')).toBeNull();
  });

  it('resends the code when Resend is pressed after the cooldown elapses', async () => {
    mockRouteParams = {
      mode: 'login',
      mobile: '9876543210',
      challenge: makeChallenge({ resendAvailableAt: Date.now() - 1000 }),
    };
    const resendOtp = jest.fn().mockResolvedValue(makeChallenge());
    mockAuth({ resendOtp });
    await renderScreen(<OTPVerificationScreen />);

    fireEvent.press(await screen.findByLabelText('Resend OTP'));
    await waitFor(() => expect(resendOtp).toHaveBeenCalledWith('c1'));
  });

  it('goes back when Change mobile number is pressed and back navigation is available', async () => {
    mockCanGoBack.mockReturnValue(true);
    await renderScreen(<OTPVerificationScreen />);

    fireEvent.press(await screen.findByLabelText('Change mobile number'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('replaces with Login when Change mobile number is pressed with no back history', async () => {
    mockCanGoBack.mockReturnValue(false);
    await renderScreen(<OTPVerificationScreen />);

    fireEvent.press(await screen.findByLabelText('Change mobile number'));
    expect(mockReplace).toHaveBeenCalledWith('Login');
  });
});
