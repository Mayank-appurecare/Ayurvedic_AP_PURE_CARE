import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { UserRepository } from '../repositories/UserRepository';
import { authService, OtpChallenge } from '../services/auth';
import { clearCatalog, setCatalog } from '../services/catalog/catalogStore';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  /**
   * Bearer token from the last successful OTP verification, or `null` when the
   * session is a guest / signed out. Attach as `Authorization: Bearer <token>`
   * when calling authenticated endpoints.
   */
  accessToken: string | null;

  // --- Phone + OTP login (current customer sign-in flow) ---
  /** Starts a verification for a 10-digit Indian national number. */
  requestOtp: (nationalNumber: string) => Promise<OtpChallenge>;
  /** Issues a fresh code for an existing challenge. */
  resendOtp: (challengeId: string) => Promise<OtpChallenge>;
  /** Verifies a code and, on success, persists the signed-in session. */
  verifyOtp: (challengeId: string, code: string) => Promise<User>;

  // --- Legacy mock flows, kept for the (currently unrouted) register screen ---
  login: (identifier: string, password: string) => Promise<void>;
  register: (params: {
    fullName: string;
    mobile: string;
    email: string;
    password: string;
  }) => Promise<void>;

  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = '@ojas_ayurveda/session_user';
// NOTE: AsyncStorage is NOT encrypted. It is used here because it is what the
// project already depends on; a signed-in token therefore sits in plain
// app-private storage. Move this to `expo-secure-store` (with a web fallback,
// since SecureStore has no web implementation) before shipping to production.
const TOKEN_KEY = '@ojas_ayurveda/session_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [rawUser, rawToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(TOKEN_KEY),
        ]);
        if (rawUser) setUser(JSON.parse(rawUser));
        if (rawToken) setAccessToken(rawToken);
      } catch {
        // Corrupt or unavailable storage: fall back to a signed-out session.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /**
   * Writes the whole session atomically-enough: user and token are always set
   * or cleared together, so a signed-out state can never leave a stale token
   * behind (and vice versa).
   */
  const persist = async (nextUser: User | null, nextToken: string | null = null) => {
    setUser(nextUser);
    setAccessToken(nextToken);

    await Promise.all([
      nextUser
        ? AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
        : AsyncStorage.removeItem(STORAGE_KEY),
      nextToken ? AsyncStorage.setItem(TOKEN_KEY, nextToken) : AsyncStorage.removeItem(TOKEN_KEY),
    ]);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      accessToken,
      requestOtp: (nationalNumber) => authService.requestOtp(nationalNumber),
      resendOtp: (challengeId) => authService.resendOtp(challengeId),
      verifyOtp: async (challengeId, code) => {
        const session = await authService.verifyOtp(challengeId, code);
        // Keep the Bearer token with the user — authenticated calls need it.
        await persist(session.user, session.accessToken);
        // The verify response also carries the catalog. Store it so
        // CategoryRepository can serve real categories without a second
        // request; screens keep reading through the repository unchanged.
        await setCatalog(session.catalog);
        return session.user;
      },
      // The three flows below issue no token and carry no catalog, so they also
      // drop any catalog left by a previous session — otherwise a guest would
      // keep browsing the last signed-in user's categories.
      login: async (identifier, password) => {
        const loggedInUser = await UserRepository.login(identifier, password);
        await persist(loggedInUser);
        await clearCatalog();
      },
      register: async (params) => {
        const newUser = await UserRepository.register(params);
        await persist(newUser);
        await clearCatalog();
      },
      continueAsGuest: async () => {
        const guest = await UserRepository.continueAsGuest();
        await persist(guest);
        await clearCatalog();
      },
      logout: async () => {
        await persist(null);
        await clearCatalog();
      },
    }),
    [user, isLoading, accessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
