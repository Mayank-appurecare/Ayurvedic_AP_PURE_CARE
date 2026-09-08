import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AccountScreen } from '../AccountScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useAuth } from '../../../context/AuthContext';
import { User } from '../../../types';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, reset: mockReset }),
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
    user: null,
    logout: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth();
});

describe('AccountScreen', () => {
  it('shows the guest state and navigates to Login when the login button is pressed', async () => {
    await renderScreen(<AccountScreen />);

    expect(await screen.findByText('Guest User')).toBeTruthy();
    expect(await screen.findByText('Login to unlock all features')).toBeTruthy();

    fireEvent.press(await screen.findByRole('button', { name: 'Login' }));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it("shows the signed-in user's profile info and hides the Login button", async () => {
    mockAuth({ user: makeUser() });
    await renderScreen(<AccountScreen />);

    expect(await screen.findByText('Jane Doe')).toBeTruthy();
    expect(await screen.findByText('jane@example.com')).toBeTruthy();
    expect(await screen.findByText('9876543210')).toBeTruthy();
    expect(await screen.findByText('JD')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Login' })).toBeNull();
  });

  it('shows a single-letter initial for a one-word name', async () => {
    mockAuth({ user: makeUser({ name: 'Cher' }) });
    await renderScreen(<AccountScreen />);

    expect(await screen.findByText('C')).toBeTruthy();
  });

  it.each([
    ['My Profile', 'AccountProfile'],
    ['My Orders', 'MyOrders'],
    ['Wishlist', 'Wishlist'],
    ['Addresses', 'Addresses'],
    ['My Reviews', 'MyReviews'],
    ['Offers & Coupons', 'Offers'],
    ['Notifications', 'Notifications'],
    ['Settings', 'Settings'],
    ['Help & Support', 'HelpSupport'],
  ])('navigates to %s -> %s when the row is pressed', async (label, routeName) => {
    mockAuth({ user: makeUser() });
    await renderScreen(<AccountScreen />);

    fireEvent.press(await screen.findByRole('button', { name: label }));
    expect(mockNavigate).toHaveBeenCalledWith(routeName);
  });

  it('opens a confirmation dialog before logging out, and cancelling leaves the session intact', async () => {
    const logout = jest.fn();
    mockAuth({ user: makeUser(), logout });
    await renderScreen(<AccountScreen />);

    fireEvent.press(await screen.findByRole('button', { name: 'Logout' }));
    expect(
      await screen.findByText('Are you sure you want to logout of your account?')
    ).toBeTruthy();

    fireEvent.press(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(screen.queryByText('Are you sure you want to logout of your account?')).toBeNull()
    );
    expect(logout).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('logs out after confirming, and resets navigation to Welcome', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    mockAuth({ user: makeUser(), logout });
    await renderScreen(<AccountScreen />);

    fireEvent.press(await screen.findByRole('button', { name: 'Logout' }));
    await screen.findByText('Are you sure you want to logout of your account?');

    const confirmButtons = await screen.findAllByRole('button', { name: 'Logout' });
    fireEvent.press(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Welcome' }] });
  });
});
