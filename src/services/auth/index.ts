// The single place where the app resolves its OTP authentication implementation.
//
// ---------------------------------------------------------------------------
//  ACTIVE: the real API (`apiAuthService`)
// ---------------------------------------------------------------------------
//  Endpoints:
//    POST /api/auth/otp/request  { phoneNumber }       — Send OTP
//    POST /api/auth/otp/verify   { phoneNumber, otp }  — Verify OTP
//
//  Base URL lives in `apiAuthService.ts` and can be overridden without editing
//  code by setting `EXPO_PUBLIC_API_BASE_URL` (handy because the ngrok
//  development URL changes between sessions).
//
//  `mockAuthService` is kept on disk as an offline fallback: swap the
//  assignment below to develop the UI with no backend running. The mock is the
//  only implementation that surfaces the code in the UI (`challenge.devCode`);
//  the real service leaves it undefined, which hides that development panel.
//
//  Nothing else in the app needs to change to switch between them. `AuthContext`,
//  `LoginScreen` and `OTPVerificationScreen` depend only on the exported value
//  and the types below, never on a concrete implementation.
// ---------------------------------------------------------------------------

import { apiAuthService } from './apiAuthService';
import { OtpAuthService } from './types';
// Offline fallback — see the note above.
// import { mockAuthService } from './mockAuthService';

/** Active OTP auth implementation. */
export const authService: OtpAuthService = apiAuthService;

export * from './types';
