import React from 'react';
import { Alert } from 'react-native';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useAuth } from '../../../context/AuthContext';
import { User } from '../../../types';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '9876543210',
    isGuest: false,
    ...overrides,
  };
}

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    user: makeUser(),
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth();
});

describe('ProfileScreen', () => {
  it("pre-fills the form with the signed-in user's info", async () => {
    await renderScreen(<ProfileScreen />);

    expect(await screen.findByText('J')).toBeTruthy();
    expect(await screen.findByDisplayValue('Jane Doe')).toBeTruthy();
    expect(await screen.findByDisplayValue('jane@example.com')).toBeTruthy();
    expect(await screen.findByDisplayValue('9876543210')).toBeTruthy();
  });

  it('falls back to empty fields and a "G" avatar when there is no signed-in user', async () => {
    mockAuth({ user: null });
    await renderScreen(<ProfileScreen />);

    expect(await screen.findByText('G')).toBeTruthy();
    expect((await screen.findByPlaceholderText('Enter your full name')).props.value).toBe('');
    expect((await screen.findByPlaceholderText('Enter your email')).props.value).toBe('');
    expect((await screen.findByPlaceholderText('Enter your mobile number')).props.value).toBe('');
  });

  it('lets the user edit each field', async () => {
    await renderScreen(<ProfileScreen />);

    fireEvent.changeText(await screen.findByPlaceholderText('Enter your full name'), 'Janet Doe');
    fireEvent.changeText(
      await screen.findByPlaceholderText('Enter your email'),
      'janet@example.com'
    );
    fireEvent.changeText(
      await screen.findByPlaceholderText('Enter your mobile number'),
      '9123456780'
    );

    expect(await screen.findByDisplayValue('Janet Doe')).toBeTruthy();
    expect(await screen.findByDisplayValue('janet@example.com')).toBeTruthy();
    expect(await screen.findByDisplayValue('9123456780')).toBeTruthy();
  });

  it('shows a saving state while the update is in flight, then confirms it saved', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderScreen(<ProfileScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Save Changes' }));

    // The button's label is swapped for a spinner while saving, so it no
    // longer exposes an accessible name matching "Save Changes".
    expect(screen.queryByRole('button', { name: 'Save Changes' })).toBeNull();

    await waitFor(
      () =>
        expect(alertSpy).toHaveBeenCalledWith(
          'Profile Updated',
          'Your changes have been saved for this session.'
        ),
      { timeout: 2000 }
    );

    expect(await screen.findByRole('button', { name: 'Save Changes' })).toBeTruthy();
    alertSpy.mockRestore();
  });

  it('navigates back when the back button is pressed', async () => {
    await renderScreen(<ProfileScreen />);
    fireEvent.press(await screen.findByLabelText('Go back'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
