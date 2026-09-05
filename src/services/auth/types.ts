// Frontend contract for phone + OTP authentication.
//
// This file is the seam between the UI and whatever actually sends and checks
// one-time passcodes. Screens and contexts depend ONLY on these types, never on
// a concrete implementation, so the mock development layer can be replaced by a
// real API client without touching a single screen.

import { User } from '../../types';

/** Number of digits in a one-time passcode. Drives the OTP input UI. */
export const OTP_LENGTH = 6;

export type AuthErrorCode =
  | 'INVALID_PHONE'
  | 'INVALID_CODE'
  | 'CODE_EXPIRED'
  | 'TOO_MANY_ATTEMPTS'
  | 'RESEND_TOO_SOON'
  | 'CHALLENGE_NOT_FOUND'
  | 'NETWORK'
  | 'UNKNOWN';

/**
 * Errors an `OtpAuthService` is allowed to reject with. The `code` lets screens
 * react structurally (clear the input, restart the flow, …) while `message` is
 * already written for a customer to read.
 */
export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    // Keeps `instanceof` working when the class is down-compiled.
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError || (error as AuthError | null)?.name === 'AuthError';
}

/**
 * A pending verification. Returned by `requestOtp`/`resendOtp` and handed back
 * to `verifyOtp`. Everything the OTP screen needs to render itself lives here,
 * so the screen never has to guess at timings.
 */
export interface OtpChallenge {
  /** Opaque server-side handle for this verification attempt. */
  challengeId: string;
  /** E.164 number the code was sent to, e.g. `+919876543210`. */
  phoneE164: string;
  /** Bare 10-digit national number, used for display/masking. */
  nationalNumber: string;
  /** Epoch ms after which the code stops being accepted. */
  expiresAt: number;
  /** Epoch ms before which "Resend OTP" must stay disabled. */
  resendAvailableAt: number;
  /**
   * DEVELOPMENT ONLY.
   *
   * The mock layer puts the generated code here so the flow is testable with no
   * SMS provider wired up, and the UI shows it inside an explicit "development
   * mode" panel. A real backend-backed implementation MUST leave this
   * `undefined` — a production server never returns the passcode to the client.
   */
  devCode?: string;
}

// ---------------------------------------------------------------------------
//  Catalog returned alongside the token
// ---------------------------------------------------------------------------
// The verify endpoint returns the whole catalog in the same response as the
// token, so these mirror the API's wire shape exactly. They are raw API types —
// the adapter in `src/services/catalog` maps them to the app's UI models.

/** A child of an API category (`categories[].subService[]`). */
export interface ApiSubService {
  id: number;
  name: string;
  description: string | null;
}

/** A top-level API category (`categories[]`). */
export interface ApiCategory {
  id: number;
  name: string;
  description: string | null;
  /** Absent for categories with no children (e.g. "Ear Care", "Eye Care"). */
  subService?: ApiSubService[];
}

/**
 * An entry of `productList[]`, mirroring the API's wire shape.
 *
 * NOTE: `categoryId` points at the MOST SPECIFIC node — usually a `subService`
 * id, not a top-level category id.
 *
 * The API sends NO image, rating, review count or brand. Those are absent here
 * on purpose: the adapter uses the UI's empty states rather than inventing
 * values for them.
 */
export interface ApiProduct {
  id: number;
  name: string;
  categoryId: number;
  sku: string | null;
  description: string | null;
  classicalReference: string | null;
  composition: string | null;
  dosageForm: string | null;
  dosha: string | null;
  formulationClass: string | null;
  packSize: string | null;
  ayushLicenceNo: string | null;
  /** Rupees. See `productAdapter` for how this relates to `discountPercentage`. */
  price: number;
  discountPercentage: number;
  stockQuantity: number;
  prescriptionRequired: boolean;
  scheduleE1: boolean;
  containsHeavyMetals: boolean;
}

/** Catalog payload carried by a successful verify response. */
export interface AuthCatalog {
  categories: ApiCategory[];
  products: ApiProduct[];
}

/** Result of a successful verification. */
export interface AuthSession {
  user: User;
  /**
   * Categories and products the backend returned with the token, or `null` when
   * the response carried none (and always `null` for the mock).
   */
  catalog: AuthCatalog | null;
  /**
   * Bearer token from the backend, taken from `data.token` on a successful
   * verify (the API also reports `data.tokenType: "Bearer"`). `null` for the
   * mock layer, which issues no token.
   *
   * Persisted by `AuthContext` and exposed as `useAuth().accessToken` for
   * `Authorization: Bearer <token>` headers.
   */
  accessToken: string | null;
}

/**
 * The interface a real API client must implement to replace the mock.
 * See `src/services/auth/index.ts` for the single swap point.
 */
export interface OtpAuthService {
  /**
   * `true` for the development mock. The UI keys its "no SMS was sent" notice
   * off this flag, so a real implementation must report `false`.
   */
  readonly isMock: boolean;

  /**
   * Starts a verification for a 10-digit Indian national number.
   * Rejects with `AuthError('INVALID_PHONE')` if the number is not valid.
   */
  requestOtp(nationalNumber: string): Promise<OtpChallenge>;

  /**
   * Issues a fresh code for an existing challenge.
   * Rejects with `AuthError('RESEND_TOO_SOON')` while the cooldown is active.
   */
  resendOtp(challengeId: string): Promise<OtpChallenge>;

  /**
   * Checks a code and, on success, resolves with the authenticated session.
   * Rejects with `AuthError` using `INVALID_CODE`, `CODE_EXPIRED` or
   * `TOO_MANY_ATTEMPTS`.
   */
  verifyOtp(challengeId: string, code: string): Promise<AuthSession>;

  /**
   * Side-effect-free check that the auth backend is reachable. Sends NO OTP.
   * Resolves `true` when the API answers, `false` when it cannot be reached.
   * Never rejects — callers use it for an advisory notice, not as a gate.
   */
  checkReachable(): Promise<boolean>;
}
