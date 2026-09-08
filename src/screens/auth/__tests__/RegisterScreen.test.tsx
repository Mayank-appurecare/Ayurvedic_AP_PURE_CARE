import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { RegisterScreen } from '../RegisterScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useAuth } from '../../../context/AuthContext';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    register: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

async function acceptTerms() {
  fireEvent.press(await screen.findByLabelText('Accept terms and conditions'));
}

async function fillValidForm() {
  fireEvent.changeText(await screen.findByPlaceholderText('Your full name'), 'Jane Doe');
  fireEvent.changeText(await screen.findByPlaceholderText('10-digit mobile number'), '9876543210');
  fireEvent.changeText(await screen.findByPlaceholderText('you@example.com'), 'jane@example.com');
  fireEvent.changeText(await screen.findByPlaceholderText('At least 6 characters'), 'secret123');
  fireEvent.changeText(await screen.findByPlaceholderText('Re-enter your password'), 'secret123');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth();
});

describe('RegisterScreen', () => {
  it('disables Register until the terms checkbox is accepted', async () => {
    await renderScreen(<RegisterScreen />);
    expect(
      (await screen.findByRole('button', { name: 'Register' })).props.accessibilityState?.disabled
    ).toBeTruthy();

    await acceptTerms();
    expect(
      (await screen.findByRole('button', { name: 'Register' })).props.accessibilityState?.disabled
    ).toBeFalsy();
  });

  it('shows field validation errors and does not call register for an empty form', async () => {
    const register = jest.fn();
    mockAuth({ register });
    await renderScreen(<RegisterScreen />);

    await acceptTerms();
    fireEvent.press(await screen.findByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Enter your full name.')).toBeTruthy();
    expect(await screen.findByText('Enter a valid 10-digit mobile number.')).toBeTruthy();
    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
    expect(await screen.findByText('Password must be at least 6 characters.')).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });

  it('flags a password/confirm-password mismatch', async () => {
    await renderScreen(<RegisterScreen />);
    await acceptTerms();
    await fillValidForm();
    fireEvent.changeText(await screen.findByPlaceholderText('Re-enter your password'), 'different');
    fireEvent.press(await screen.findByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Passwords do not match.')).toBeTruthy();
  });

  it('registers with the trimmed form data and navigates to OTPVerification', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    mockAuth({ register });
    await renderScreen(<RegisterScreen />);

    await acceptTerms();
    await fillValidForm();
    fireEvent.press(await screen.findByRole('button', { name: 'Register' }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        fullName: 'Jane Doe',
        mobile: '9876543210',
        email: 'jane@example.com',
        password: 'secret123',
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('OTPVerification', {
      mode: 'register',
      mobile: '9876543210',
    });
  });

  it('shows an error message when registration fails', async () => {
    const register = jest.fn().mockRejectedValue(new Error('Mobile number already registered.'));
    mockAuth({ register });
    await renderScreen(<RegisterScreen />);

    await acceptTerms();
    await fillValidForm();
    fireEvent.press(await screen.findByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Mobile number already registered.')).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to Login when the login link is pressed', async () => {
    await renderScreen(<RegisterScreen />);
    fireEvent.press(await screen.findByLabelText('Go to login'));

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
