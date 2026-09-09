// Direct tests for the in-memory OTP mock. No React, no network — just calling
// the exported `OtpAuthService` and letting its real (short) latencies elapse.
//
// IMPORTANT: this module uses REAL timers internally (`setTimeout` via its own
// `sleep()` helper), so `jest.useFakeTimers()` is deliberately NOT used here —
// it caused severe cross-test interference elsewhere in this codebase. Instead,
// clock-dependent behaviour (OTP expiry, resend cooldown) is exercised by
// spying on `Date.now()` alone, which does not touch `setTimeout` scheduling.

import { mockAuthService } from '../mockAuthService';
import { AuthError, AuthErrorCode, OTP_LENGTH } from '../types';

afterEach(() => {
  jest.restoreAllMocks();
});

const VALID_NATIONAL_NUMBER = '9876543210';
const VALID_E164 = '+919876543210';

/**
 * Awaits `promise` (already in flight) and asserts it rejects with an
 * `AuthError` carrying the given `code`, and, when provided, a message
 * matching `messagePattern`. Reused across assertions on the same promise —
 * an already-settled promise can be awaited more than once with no extra
 * latency or side effects.
 */
async function expectAuthError(
  promise: Promise<unknown>,
  code: AuthErrorCode,
  messagePattern?: RegExp
): Promise<void> {
  await expect(promise).rejects.toThrow(AuthError);
  await expect(promise).rejects.toMatchObject({ code });
  if (messagePattern) {
    await expect(promise).rejects.toThrow(messagePattern);
  }
}

describe('mockAuthService.isMock', () => {
  it('is true', () => {
    expect(mockAuthService.isMock).toBe(true);
  });
});

describe('mockAuthService.checkReachable', () => {
  it('always resolves true', async () => {
    await expect(mockAuthService.checkReachable()).resolves.toBe(true);
  });
});

describe('mockAuthService.requestOtp', () => {
  it('rejects with AuthError(INVALID_PHONE) for an invalid number', async () => {
    await expectAuthError(mockAuthService.requestOtp('123'), 'INVALID_PHONE');
  }, 10000);

  it('resolves an OtpChallenge for a valid number', async () => {
    const before = Date.now();
    const challenge = await mockAuthService.requestOtp(VALID_NATIONAL_NUMBER);

    expect(challenge.devCode).toMatch(new RegExp(`^\\d{${OTP_LENGTH}}$`));
    expect(challenge.phoneE164).toBe(VALID_E164);
    expect(challenge.nationalNumber).toBe(VALID_NATIONAL_NUMBER);
    expect(challenge.expiresAt).toBeGreaterThan(before);
    expect(challenge.resendAvailableAt).toBeGreaterThan(before);
  }, 10000);
});

describe('mockAuthService.resendOtp', () => {
  it('rejects with AuthError(CHALLENGE_NOT_FOUND) for an unknown challengeId', async () => {
    await expectAuthError(mockAuthService.resendOtp('no-such-challenge-id'), 'CHALLENGE_NOT_FOUND');
  }, 10000);

  it('rejects with AuthError(RESEND_TOO_SOON) immediately after requestOtp', async () => {
    const challenge = await mockAuthService.requestOtp(VALID_NATIONAL_NUMBER);
    await expectAuthError(mockAuthService.resendOtp(challenge.challengeId), 'RESEND_TOO_SOON');
  }, 10000);

  it('issues a different code once the cooldown has elapsed, keeping the challenge usable', async () => {
    const challenge = await mockAuthService.requestOtp(VALID_NATIONAL_NUMBER);

    // Jump the clock just past `resendAvailableAt` — this only changes what
    // `Date.now()` reports, it does not touch `setTimeout` scheduling.
    jest.spyOn(Date, 'now').mockReturnValue(challenge.resendAvailableAt + 1);

    const resent = await mockAuthService.resendOtp(challenge.challengeId);
    expect(resent.challengeId).toBe(challenge.challengeId);
    expect(resent.devCode).toBeDefined();
    expect(resent.devCode).not.toBe(challenge.devCode);

    // The same challenge handle must still verify, now with the new code.
    const session = await mockAuthService.verifyOtp(
      challenge.challengeId,
      resent.devCode as string
    );
    expect(session.user.phone).toBe(VALID_E164);
  }, 10000);
});

describe('mockAuthService.verifyOtp', () => {
  it('resolves an AuthSession for the exact devCode of a fresh challenge', async () => {
    const challenge = await mockAuthService.requestOtp(VALID_NATIONAL_NUMBER);
    const session = await mockAuthService.verifyOtp(
      challenge.challengeId,
      challenge.devCode as string
    );

    expect(session.user.phone).toBe(VALID_E164);
    expect(session.accessToken).toBeNull();
    expect(session.catalog).toBeNull();
  }, 10000);

  it(
    'rejects a wrong code with AuthError(INVALID_CODE) reporting attempts left, ' +
      'then TOO_MANY_ATTEMPTS on the 5th wrong attempt, ' +
      'then CHALLENGE_NOT_FOUND once the record is gone',
    async () => {
      const challenge = await mockAuthService.requestOtp(VALID_NATIONAL_NUMBER);
      const wrongCode = challenge.devCode === '000000' ? '111111' : '000000';

      await expectAuthError(
        mockAuthService.verifyOtp(challenge.challengeId, wrongCode),
        'INVALID_CODE',
        /4 attempts left/i
      );
      await expectAuthError(
        mockAuthService.verifyOtp(challenge.challengeId, wrongCode),
        'INVALID_CODE',
        /3 attempts left/i
      );
      await expectAuthError(
        mockAuthService.verifyOtp(challenge.challengeId, wrongCode),
        'INVALID_CODE',
        /2 attempts left/i
      );
      await expectAuthError(
        mockAuthService.verifyOtp(challenge.challengeId, wrongCode),
        'INVALID_CODE',
        /1 attempt left/i
      );
      // 5th wrong attempt: attempts are exhausted, the record is deleted.
      await expectAuthError(
        mockAuthService.verifyOtp(challenge.challengeId, wrongCode),
        'TOO_MANY_ATTEMPTS'
      );
      // 6th (or any further) attempt: no record left to check attempts against.
      await expectAuthError(
        mockAuthService.verifyOtp(challenge.challengeId, wrongCode),
        'CHALLENGE_NOT_FOUND'
      );
    },
    20000
  );

  it('rejects an expired code with AuthError(CODE_EXPIRED)', async () => {
    const challenge = await mockAuthService.requestOtp(VALID_NATIONAL_NUMBER);

    // Jump the clock just past `expiresAt`.
    jest.spyOn(Date, 'now').mockReturnValue(challenge.expiresAt + 1);

    await expectAuthError(
      mockAuthService.verifyOtp(challenge.challengeId, challenge.devCode as string),
      'CODE_EXPIRED'
    );
  }, 10000);
});
