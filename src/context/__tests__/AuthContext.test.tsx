import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../AuthContext';
import { UserRepository } from '../../repositories/UserRepository';
import { authService } from '../../services/auth';
import { setCatalog, clearCatalog } from '../../services/catalog/catalogStore';
import { User } from '../../types';

jest.mock('../../repositories/UserRepository', () => ({
  UserRepository: {
    login: jest.fn(),
    register: jest.fn(),
    continueAsGuest: jest.fn(),
  },
}));

jest.mock('../../services/auth', () => ({
  authService: {
    requestOtp: jest.fn(),
    resendOtp: jest.fn(),
    verifyOtp: jest.fn(),
  },
}));

jest.mock('../../services/catalog/catalogStore', () => ({
  setCatalog: jest.fn(),
  clearCatalog: jest.fn(),
}));

const STORAGE_KEY = '@ojas_ayurveda/session_user';
const TOKEN_KEY = '@ojas_ayurveda/session_token';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const USER: User = {
  id: 'user-1',
  name: 'Mayank Sharma',
  email: 'mayank@example.com',
  phone: '+91 98765 43210',
  isGuest: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

async function renderReadyAuth() {
  const view = await renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

describe('AuthContext session restore on mount', () => {
  it('starts loading and settles to a signed-out state when nothing is stored', async () => {
    const resolvers: Array<(value: string | null) => void> = [];
    (AsyncStorage.getItem as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        })
    );

    const { result } = await renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvers.forEach((resolve) => resolve(null));
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('restores the user and access token when AsyncStorage has a stored session', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEY) return Promise.resolve(JSON.stringify(USER));
      if (key === TOKEN_KEY) return Promise.resolve('stored-token');
      return Promise.resolve(null);
    });

    const { result } = await renderReadyAuth();

    expect(result.current.user).toEqual(USER);
    expect(result.current.accessToken).toBe('stored-token');
  });

  it('still settles to a signed-out state if reading the stored session fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage unavailable'));

    const { result } = await renderReadyAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });
});

describe('AuthContext OTP flow', () => {
  it('requestOtp delegates to authService.requestOtp and resolves with its result', async () => {
    const challenge = {
      challengeId: 'challenge-1',
      phoneE164: '+919876543210',
      nationalNumber: '9876543210',
      expiresAt: 1000,
      resendAvailableAt: 500,
    };
    (authService.requestOtp as jest.Mock).mockResolvedValue(challenge);

    const { result } = await renderReadyAuth();

    let resolved;
    await act(async () => {
      resolved = await result.current.requestOtp('9876543210');
    });

    expect(authService.requestOtp).toHaveBeenCalledWith('9876543210');
    expect(resolved).toEqual(challenge);
  });

  it('resendOtp delegates to authService.resendOtp and resolves with its result', async () => {
    const challenge = {
      challengeId: 'challenge-1',
      phoneE164: '+919876543210',
      nationalNumber: '9876543210',
      expiresAt: 2000,
      resendAvailableAt: 1500,
    };
    (authService.resendOtp as jest.Mock).mockResolvedValue(challenge);

    const { result } = await renderReadyAuth();

    let resolved;
    await act(async () => {
      resolved = await result.current.resendOtp('challenge-1');
    });

    expect(authService.resendOtp).toHaveBeenCalledWith('challenge-1');
    expect(resolved).toEqual(challenge);
  });

  it('verifyOtp persists the user and token, stores the catalog, and resolves with the user', async () => {
    const catalog = { categories: [], products: [] };
    (authService.verifyOtp as jest.Mock).mockResolvedValue({
      user: USER,
      accessToken: 'tok-123',
      catalog,
    });

    const { result } = await renderReadyAuth();

    let resolvedUser;
    await act(async () => {
      resolvedUser = await result.current.verifyOtp('challenge-1', '123456');
    });

    expect(authService.verifyOtp).toHaveBeenCalledWith('challenge-1', '123456');
    expect(resolvedUser).toEqual(USER);
    expect(result.current.user).toEqual(USER);
    expect(result.current.accessToken).toBe('tok-123');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(USER));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(TOKEN_KEY, 'tok-123');
    expect(setCatalog).toHaveBeenCalledWith(catalog);
  });
});

describe('AuthContext legacy login flows', () => {
  it('login persists only the user, removes any stored token, and clears the catalog', async () => {
    (UserRepository.login as jest.Mock).mockResolvedValue(USER);

    const { result } = await renderReadyAuth();

    await act(() => result.current.login('9876543210', 'password1'));

    expect(UserRepository.login).toHaveBeenCalledWith('9876543210', 'password1');
    expect(result.current.user).toEqual(USER);
    expect(result.current.accessToken).toBeNull();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(USER));
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
    expect(clearCatalog).toHaveBeenCalled();
  });

  it('register persists only the user, removes any stored token, and clears the catalog', async () => {
    (UserRepository.register as jest.Mock).mockResolvedValue(USER);
    const params = {
      fullName: 'Mayank Sharma',
      mobile: '9876543210',
      email: 'mayank@example.com',
      password: 'password1',
    };

    const { result } = await renderReadyAuth();

    await act(() => result.current.register(params));

    expect(UserRepository.register).toHaveBeenCalledWith(params);
    expect(result.current.user).toEqual(USER);
    expect(result.current.accessToken).toBeNull();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(USER));
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
    expect(clearCatalog).toHaveBeenCalled();
  });

  it('continueAsGuest persists only the guest user, removes any stored token, and clears the catalog', async () => {
    const guest: User = { id: 'guest', name: 'Guest', email: '', phone: '', isGuest: true };
    (UserRepository.continueAsGuest as jest.Mock).mockResolvedValue(guest);

    const { result } = await renderReadyAuth();

    await act(() => result.current.continueAsGuest());

    expect(UserRepository.continueAsGuest).toHaveBeenCalled();
    expect(result.current.user).toEqual(guest);
    expect(result.current.accessToken).toBeNull();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(guest));
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
    expect(clearCatalog).toHaveBeenCalled();
  });
});

describe('AuthContext logout', () => {
  it('clears the user and token, removes both AsyncStorage keys, and clears the catalog', async () => {
    (authService.verifyOtp as jest.Mock).mockResolvedValue({
      user: USER,
      accessToken: 'tok-123',
      catalog: null,
    });

    const { result } = await renderReadyAuth();
    await act(async () => {
      await result.current.verifyOtp('challenge-1', '123456');
    });
    expect(result.current.user).toEqual(USER);

    await act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
    expect(clearCatalog).toHaveBeenCalled();
  });
});

describe('useAuth outside a provider', () => {
  it('throws when used outside of an AuthProvider', async () => {
    await expect(renderHook(() => useAuth())).rejects.toThrow(
      'useAuth must be used within AuthProvider'
    );
  });
});
