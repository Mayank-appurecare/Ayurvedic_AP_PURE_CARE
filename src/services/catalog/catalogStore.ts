// Holds the catalog the backend returns alongside the auth token.
//
// WHY A MODULE STORE AND NOT CONTEXT: repositories are plain async functions,
// not React components, so they cannot read a context. `AuthContext` writes
// here on sign-in/sign-out and `CategoryRepository` reads from here — no
// duplicate network request, and no screen has to be rewired.
//
// The value is mirrored into AsyncStorage so a reload does not silently fall
// back to mock categories while the user is still signed in.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthCatalog } from '../auth/types';

const STORAGE_KEY = '@ojas_ayurveda/session_catalog';

let cached: AuthCatalog | null = null;
let hydrated = false;

/** Reads the persisted catalog once per app start. Never throws. */
async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) cached = JSON.parse(raw) as AuthCatalog;
  } catch {
    // Corrupt or unavailable storage: fall back to "no catalog" (mock data).
    cached = null;
  }
}

/**
 * Returns the API catalog, or `null` when there is none — which is the normal
 * state for a guest and before the first successful verification.
 */
export async function getCatalog(): Promise<AuthCatalog | null> {
  await hydrate();
  return cached;
}

/** Stores the catalog from a successful verification. */
export async function setCatalog(catalog: AuthCatalog | null): Promise<void> {
  hydrated = true;
  cached = catalog;
  try {
    if (catalog) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Keep the in-memory value even if persistence fails.
  }
}

/** Drops the catalog on sign-out so a guest never sees the last user's data. */
export async function clearCatalog(): Promise<void> {
  await setCatalog(null);
}
