// =====================================================================
//  DEVELOPMENT MOCK — THIS IS NOT AUTHENTICATION.
// =====================================================================
//  No SMS is sent, no network request is made, no token is issued and
//  nothing here is a security control. It exists so the phone -> OTP ->
//  home UI flow can be built and tested before an OTP provider is chosen.
//
//  The generated code is random per challenge (never a fixed value like
//  "123456") and is handed back to the caller in `challenge.devCode`, which
//  the OTP screen renders inside an explicit "development mode" panel. That
//  keeps the flow honest: the UI states plainly that no SMS was sent, rather
//  than imitating a real delivery.
//
//  State lives in a module-level Map, so it resets on every reload. That is
//  intentional — persisting verification state would make this look more like
//  a real service than it is.
//
//  DELETE THIS FILE once a real `OtpAuthService` implementation exists.
// =====================================================================

import { isValidIndianMobile, toE164 } from '../../utils/phone';
import { AuthError, AuthSession, OTP_LENGTH, OtpAuthService, OtpChallenge } from './types';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

/** Fake network latency, so loading states are actually visible while developing. */
const REQUEST_LATENCY_MS = 700;
const VERIFY_LATENCY_MS = 600;

interface MockChallengeRecord {
  code: string;
  nationalNumber: string;
  expiresAt: number;
  resendAvailableAt: number;
  attemptsUsed: number;
}

const challenges = new Map<string, MockChallengeRecord>();

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function generateCode(): string {
  let code = '';
  for (let i = 0; i < OTP_LENGTH; i += 1) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

function generateChallengeId(): string {
  return `mock-otp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toPublicChallenge(challengeId: string, record: MockChallengeRecord): OtpChallenge {
  return {
    challengeId,
    phoneE164: toE164(record.nationalNumber),
    nationalNumber: record.nationalNumber,
    expiresAt: record.expiresAt,
    resendAvailableAt: record.resendAvailableAt,
    // Development-only field. A real service leaves this undefined.
    devCode: record.code,
  };
}

function issueCode(nationalNumber: string): MockChallengeRecord {
  const now = Date.now();
  return {
    code: generateCode(),
    nationalNumber,
    expiresAt: now + OTP_TTL_MS,
    resendAvailableAt: now + RESEND_COOLDOWN_MS,
    attemptsUsed: 0,
  };
}

/**
 * Stand-in customer profile. Mirrors the shape the mock `UserRepository`
 * already returns so profile/orders/account screens render exactly as before.
 */
function buildMockUser(nationalNumber: string) {
  return {
    id: `user-${nationalNumber}`,
    name: 'Mayank Sharma',
    email: 'mayank@example.com',
    phone: toE164(nationalNumber),
    isGuest: false,
  };
}

export const mockAuthService: OtpAuthService = {
  isMock: true,

  /** Nothing to reach — the mock is always "up". */
  async checkReachable(): Promise<boolean> {
    return true;
  },

  async requestOtp(nationalNumber: string): Promise<OtpChallenge> {
    await sleep(REQUEST_LATENCY_MS);

    if (!isValidIndianMobile(nationalNumber)) {
      throw new AuthError('INVALID_PHONE', 'Please enter a valid 10-digit Indian mobile number.');
    }

    const challengeId = generateChallengeId();
    const record = issueCode(nationalNumber);
    challenges.set(challengeId, record);
    return toPublicChallenge(challengeId, record);
  },

  async resendOtp(challengeId: string): Promise<OtpChallenge> {
    await sleep(REQUEST_LATENCY_MS);

    const existing = challenges.get(challengeId);
    if (!existing) {
      throw new AuthError('CHALLENGE_NOT_FOUND', 'This verification has expired. Please start again.');
    }
    if (Date.now() < existing.resendAvailableAt) {
      throw new AuthError('RESEND_TOO_SOON', 'Please wait for the timer to finish before requesting a new code.');
    }

    // A resend replaces the code but keeps the same challenge handle.
    const record = issueCode(existing.nationalNumber);
    challenges.set(challengeId, record);
    return toPublicChallenge(challengeId, record);
  },

  async verifyOtp(challengeId: string, code: string): Promise<AuthSession> {
    await sleep(VERIFY_LATENCY_MS);

    const record = challenges.get(challengeId);
    if (!record) {
      throw new AuthError('CHALLENGE_NOT_FOUND', 'This verification has expired. Please start again.');
    }
    if (Date.now() > record.expiresAt) {
      challenges.delete(challengeId);
      throw new AuthError('CODE_EXPIRED', 'This code has expired. Tap "Resend OTP" to get a new one.');
    }
    if (record.attemptsUsed >= MAX_VERIFY_ATTEMPTS) {
      challenges.delete(challengeId);
      throw new AuthError('TOO_MANY_ATTEMPTS', 'Too many incorrect attempts. Please request a new code.');
    }

    if (code !== record.code) {
      record.attemptsUsed += 1;
      const attemptsLeft = MAX_VERIFY_ATTEMPTS - record.attemptsUsed;
      if (attemptsLeft <= 0) {
        challenges.delete(challengeId);
        throw new AuthError('TOO_MANY_ATTEMPTS', 'Too many incorrect attempts. Please request a new code.');
      }
      throw new AuthError(
        'INVALID_CODE',
        `That code is incorrect. ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`
      );
    }

    challenges.delete(challengeId);
    return {
      user: buildMockUser(record.nationalNumber),
      // No real token is issued in development.
      accessToken: null,
      // No catalog either, so the app keeps using its bundled mock categories.
      catalog: null,
    };
  },
};
