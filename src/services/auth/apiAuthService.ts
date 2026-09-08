// Real OTP authentication backed by the project API.
//
//   POST /api/auth/otp/request  { phoneNumber }        -> { data, message, status }
//   POST /api/auth/otp/verify   { phoneNumber, otp }   -> { data, message, status }
//
// The API envelope uses `status: "00"` for success and a non-"00" code for
// failure, with `message` already written for a human to read.
//
// The API is keyed by phone number rather than by a server-issued challenge id,
// so `challengeId` here IS the E.164 phone number. That keeps the
// `OtpAuthService` contract intact without inventing state the server does not
// track.

import { User } from '../../types';
import { toE164 } from '../../utils/phone';
import {
  ApiCategory,
  ApiProduct,
  AuthCatalog,
  AuthError,
  AuthErrorCode,
  AuthSession,
  OtpAuthService,
  OtpChallenge,
} from './types';

/**
 * Base URL of the API. Override without touching code by setting
 * `EXPO_PUBLIC_API_BASE_URL` (Expo inlines `EXPO_PUBLIC_*` at build time) —
 * useful because the ngrok development URL changes between sessions.
 */
const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://bartender-sloppy-sandstone.ngrok-free.dev'
).replace(/\/+$/, '');

const REQUEST_TIMEOUT_MS = 20000;
/** Shorter budget: this one runs on screen load and must never delay the UI. */
const REACHABILITY_TIMEOUT_MS = 8000;

/** API status code that means "succeeded". Anything else is a failure. */
const STATUS_OK = '00';

// The server does not return code lifetime or a resend cooldown, so the UI
// timings are client-side policy. Adjust here if the backend gains real values.
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

interface ApiEnvelope<T = unknown> {
  data: T | null;
  message?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
//  Request / response logging
// ---------------------------------------------------------------------------
// Every log below is gated on `__DEV__`, so a release build writes nothing —
// these payloads contain phone numbers and (eventually) session tokens, which
// must never reach production logs or a crash reporter.
//
// Even in development, credential-shaped fields are truncated to a short
// preview rather than printed in full.

const LOG_PREFIX = '[auth-api]';

const SENSITIVE_KEYS = new Set([
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'jwt',
  'idtoken',
  'id_token',
  'password',
  'secret',
]);

/** `eyJhbGciOiJI…` (len 214) — enough to tell tokens apart without leaking one. */
function previewSecret(value: unknown): string {
  if (typeof value !== 'string') return `<${typeof value}>`;
  if (!value) return '<empty>';
  return `${value.slice(0, 12)}… (len ${value.length})`;
}

/** Deep copy with credential-shaped values replaced by a short preview. */
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? previewSecret(child) : redact(child);
    }
    return out;
  }
  return value;
}

let requestSeq = 0;

function logRequest(id: number, method: string, url: string, body?: unknown): void {
  if (!__DEV__) return;
  if (body === undefined) {
    console.log(`${LOG_PREFIX} #${id} → ${method} ${url}`);
  } else {
    console.log(`${LOG_PREFIX} #${id} → ${method} ${url}`, JSON.stringify(redact(body)));
  }
}

function logResponse(
  id: number,
  method: string,
  url: string,
  httpStatus: number,
  elapsedMs: number,
  parsed: ApiEnvelope | null,
  raw: string
): void {
  if (!__DEV__) return;
  const ok = httpStatus >= 200 && httpStatus < 300 && parsed?.status === STATUS_OK;
  const head = `${LOG_PREFIX} #${id} ← ${ok ? 'OK' : 'FAIL'} ${httpStatus} ${method} ${url} (${elapsedMs}ms)`;
  if (parsed) {
    console.log(head, JSON.stringify(redact(parsed)));
  } else {
    // Unparseable body: show a bounded slice so an HTML error page is obvious.
    console.log(`${head} <non-JSON body>`, raw.slice(0, 300));
  }
}

function logFailure(
  id: number,
  method: string,
  url: string,
  elapsedMs: number,
  reason: string
): void {
  if (!__DEV__) return;
  console.log(`${LOG_PREFIX} #${id} ✕ ${method} ${url} (${elapsedMs}ms) ${reason}`);
}

/** The reachability probe answers with no body, so it gets its own one-liner. */
function logReachability(
  id: number,
  url: string,
  httpStatus: number,
  elapsedMs: number,
  ok: boolean
): void {
  if (!__DEV__) return;
  console.log(
    `${LOG_PREFIX} #${id} ← ${ok ? 'REACHABLE' : 'UNREACHABLE'} ${httpStatus} OPTIONS ${url} (${elapsedMs}ms)`
  );
}

async function postJson<T>(path: string, body: unknown): Promise<ApiEnvelope<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = `${API_BASE_URL}${path}`;
  const id = (requestSeq += 1);
  const startedAt = Date.now();

  logRequest(id, 'POST', url, body);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Skips the ngrok free-tier HTML interstitial, which would otherwise
        // come back instead of JSON.
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    // fetch only rejects for transport-level problems: no network, DNS failure,
    // TLS error, timeout — and, in a browser, a blocked CORS response.
    const aborted = (error as Error | null)?.name === 'AbortError';
    logFailure(
      id,
      'POST',
      url,
      Date.now() - startedAt,
      aborted
        ? 'aborted after timeout'
        : `transport error: ${(error as Error | null)?.message ?? 'unknown'} (offline, DNS/TLS, tunnel down, or blocked by CORS)`
    );
    throw new AuthError(
      'NETWORK',
      aborted
        ? 'The server took too long to respond. Please check your connection and try again.'
        : 'Could not reach the server. Please check your connection and try again.'
    );
  } finally {
    clearTimeout(timeout);
  }

  let raw: string;
  try {
    raw = await response.text();
  } catch (error) {
    logFailure(
      id,
      'POST',
      url,
      Date.now() - startedAt,
      `could not read body: ${(error as Error | null)?.message ?? 'unknown'}`
    );
    throw new AuthError(
      'NETWORK',
      'Received an unexpected response from the server. Please try again.'
    );
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = JSON.parse(raw) as ApiEnvelope<T>;
  } catch {
    envelope = null;
  }

  logResponse(id, 'POST', url, response.status, Date.now() - startedAt, envelope, raw);

  if (!envelope) {
    // A non-JSON body means we reached something other than the API (a proxy
    // error page, the ngrok warning, a tunnel that is offline).
    throw new AuthError(
      'NETWORK',
      'Received an unexpected response from the server. Please try again.'
    );
  }

  if (!response.ok || envelope.status !== STATUS_OK) {
    throw new AuthError(
      mapErrorCode(response.status, envelope.message),
      errorMessage(response.status, envelope.message)
    );
  }

  return envelope;
}

function mapErrorCode(httpStatus: number, message?: string): AuthErrorCode {
  const text = (message ?? '').toLowerCase();
  if (text.includes('expired')) return 'CODE_EXPIRED';
  if (text.includes('invalid') && text.includes('otp')) return 'INVALID_CODE';
  if (text.includes('phone') || text.includes('number')) return 'INVALID_PHONE';
  if (httpStatus === 401 || httpStatus === 403) return 'INVALID_CODE';
  if (httpStatus === 429) return 'TOO_MANY_ATTEMPTS';
  if (httpStatus === 400 || httpStatus === 422) return 'INVALID_PHONE';
  if (httpStatus >= 500) return 'NETWORK';
  return 'UNKNOWN';
}

function errorMessage(httpStatus: number, message?: string): string {
  if (message && message.trim()) return message.trim();
  if (httpStatus === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (httpStatus >= 500) return 'The server is having trouble right now. Please try again shortly.';
  return 'Something went wrong. Please try again.';
}

function buildChallenge(nationalNumber: string): OtpChallenge {
  const now = Date.now();
  return {
    // The API identifies a verification by phone number, so that is the handle.
    challengeId: toE164(nationalNumber),
    phoneE164: toE164(nationalNumber),
    nationalNumber,
    expiresAt: now + OTP_TTL_MS,
    resendAvailableAt: now + RESEND_COOLDOWN_MS,
    // Never set against a real backend — this is what keeps the development
    // panel hidden on the OTP screen.
    devCode: undefined,
  };
}

/**
 * Builds the signed-in user from whatever the verify response carries. The
 * endpoint currently returns `data: null`, so the phone number is the only
 * reliable identity; richer fields are picked up automatically if the backend
 * starts returning them.
 */
function buildUser(data: unknown, phoneE164: string): User {
  const payload = (data ?? {}) as Record<string, unknown>;
  const nested = (payload.user ?? payload.customer ?? {}) as Record<string, unknown>;
  const pick = (key: string): string | undefined => {
    const value = payload[key] ?? nested[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  };

  return {
    id: pick('id') ?? pick('userId') ?? phoneE164,
    name: pick('name') ?? pick('fullName') ?? 'AP Pure Care Customer',
    email: pick('email') ?? '',
    phone: pick('phoneNumber') ?? pick('phone') ?? phoneE164,
    isGuest: false,
  };
}

/**
 * Pulls `categories` / `productList` out of the verify response.
 *
 * Every field is validated before use: this is untrusted wire data, and a
 * malformed entry must be dropped rather than crash a screen that renders it.
 * Names are passed through verbatim — the API is the source of truth for them.
 */
function extractCatalog(data: unknown): AuthCatalog | null {
  const payload = (data ?? {}) as Record<string, unknown>;

  const rawCategories = Array.isArray(payload.categories) ? payload.categories : null;
  const rawProducts = Array.isArray(payload.productList) ? payload.productList : null;
  if (!rawCategories && !rawProducts) return null;

  const isNamedNode = (
    value: unknown
  ): value is { id: number; name: string; description?: unknown } => {
    if (!value || typeof value !== 'object') return false;
    const node = value as Record<string, unknown>;
    return (
      typeof node.id === 'number' && typeof node.name === 'string' && node.name.trim().length > 0
    );
  };

  const categories: ApiCategory[] = (rawCategories ?? []).filter(isNamedNode).map((node) => {
    const raw = node as unknown as Record<string, unknown>;
    const subService = Array.isArray(raw.subService)
      ? raw.subService.filter(isNamedNode).map((child) => ({
          id: child.id,
          name: child.name,
          description: typeof child.description === 'string' ? child.description : null,
        }))
      : undefined;

    return {
      id: node.id,
      name: node.name,
      description: typeof raw.description === 'string' ? raw.description : null,
      ...(subService && subService.length ? { subService } : {}),
    };
  });

  // Optional string/number/boolean readers: the API sends `null` for several
  // fields, so each is normalised rather than trusted.
  const str = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null;
  const num = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const bool = (value: unknown): boolean => value === true;

  const products: ApiProduct[] = (rawProducts ?? [])
    .filter((value): value is Record<string, unknown> => {
      if (!value || typeof value !== 'object') return false;
      const node = value as Record<string, unknown>;
      return (
        typeof node.id === 'number' && typeof node.name === 'string' && node.name.trim().length > 0
      );
    })
    .map((node) => ({
      id: node.id as number,
      name: (node.name as string).trim(),
      categoryId: num(node.categoryId),
      sku: str(node.sku),
      description: str(node.description),
      classicalReference: str(node.classicalReference),
      composition: str(node.composition),
      dosageForm: str(node.dosageForm),
      dosha: str(node.dosha),
      formulationClass: str(node.formulationClass),
      packSize: str(node.packSize),
      ayushLicenceNo: str(node.ayushLicenceNo),
      price: num(node.price),
      discountPercentage: num(node.discountPercentage),
      stockQuantity: num(node.stockQuantity),
      prescriptionRequired: bool(node.prescriptionRequired),
      scheduleE1: bool(node.scheduleE1),
      containsHeavyMetals: bool(node.containsHeavyMetals),
    }));

  return { categories, products };
}

function extractToken(data: unknown): string | null {
  const payload = (data ?? {}) as Record<string, unknown>;
  for (const key of ['token', 'accessToken', 'access_token', 'jwt', 'idToken']) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export const apiAuthService: OtpAuthService = {
  isMock: false,

  /**
   * Reachability probe used by the welcome screen.
   *
   * Uses OPTIONS, which the API answers with 200 and which does NOT create a
   * verification or send an SMS — deliberately chosen so opening the app never
   * costs the user an OTP.
   */
  async checkReachable(): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REACHABILITY_TIMEOUT_MS);
    const url = `${API_BASE_URL}/api/auth/otp/request`;
    const id = (requestSeq += 1);
    const startedAt = Date.now();

    logRequest(id, 'OPTIONS', url);

    try {
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        signal: controller.signal,
      });
      logReachability(id, url, response.status, Date.now() - startedAt, response.ok);
      return response.ok;
    } catch (error) {
      // Offline, DNS/TLS failure, tunnel down, timeout, or a browser CORS block.
      logFailure(
        id,
        'OPTIONS',
        url,
        Date.now() - startedAt,
        `unreachable: ${(error as Error | null)?.message ?? 'unknown'}`
      );
      return false;
    } finally {
      clearTimeout(timeout);
    }
  },

  async requestOtp(nationalNumber: string): Promise<OtpChallenge> {
    await postJson('/api/auth/otp/request', { phoneNumber: toE164(nationalNumber) });
    return buildChallenge(nationalNumber);
  },

  async resendOtp(challengeId: string): Promise<OtpChallenge> {
    // `challengeId` is the E.164 number; a resend is simply another request.
    const nationalNumber = challengeId.replace(/^\+91/, '');
    await postJson('/api/auth/otp/request', { phoneNumber: challengeId });
    return buildChallenge(nationalNumber);
  },

  async verifyOtp(challengeId: string, code: string): Promise<AuthSession> {
    const envelope = await postJson('/api/auth/otp/verify', {
      phoneNumber: challengeId,
      otp: code,
    });

    return {
      user: buildUser(envelope.data, challengeId),
      accessToken: extractToken(envelope.data),
      catalog: extractCatalog(envelope.data),
    };
  },
};
