// Holds the catalog the backend returns alongside the auth token.
//
// WHY A MODULE STORE AND NOT CONTEXT: repositories are plain async functions,
// not React components, so they cannot read a context. `AuthContext` writes
// here on sign-in/sign-out and the repositories read from here — no duplicate
// network request, and no screen has to be rewired.
//
// The value is mirrored into AsyncStorage so a reload does not silently drop
// back to the bundled catalog while the user is still signed in.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthCatalog } from '../auth/types';
import { FALLBACK_CATALOG } from '../../data/fallbackCatalog';

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
    // Corrupt or unavailable storage: fall back to the bundled catalog.
    cached = null;
  }
}

/**
 * The catalog the app should display.
 *
 * Returns the payload from the last successful verification when there is one,
 * and the bundled `FALLBACK_CATALOG` otherwise — which is the normal state for
 * a guest and before the first sign-in. Because both cases return the same
 * shape, every screen runs one code path and a guest sees the same categories,
 * concerns, counts and products as a signed-in user.
 *
 * Never `null`, so callers never need a "no catalog" branch.
 */
export async function getCatalog(): Promise<AuthCatalog> {
  await hydrate();
  return cached ?? FALLBACK_CATALOG;
}

/** `true` when the catalog came from the API rather than the bundled copy. */
export async function hasApiCatalog(): Promise<boolean> {
  await hydrate();
  return cached !== null;
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

/**
 * Drops the API catalog on sign-out, so the app returns to the bundled one
 * instead of keeping the last user's payload.
 */
export async function clearCatalog(): Promise<void> {
  await setCatalog(null);
}
