// Indian mobile number helpers.
// The customer app currently supports a single country (India, +91), so these
// helpers deliberately encode that assumption in one place. If more countries
// are added later, this module is the only thing that needs to grow.

export const COUNTRY_DIAL_CODE = '+91';
export const NATIONAL_NUMBER_LENGTH = 10;

// TRAI numbering plan: mobile numbers are 10 digits starting with 6, 7, 8 or 9.
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

/**
 * Normalises anything the user types (or pastes) into a bare 10-digit national
 * number: strips spaces/dashes/brackets, drops a pasted `+91`/`0` prefix,
 * enforces a 6-9 leading digit and caps the length.
 *
 * Only the FIRST digit is restricted to 6-9. Digits 0-5 are untouched anywhere
 * else, so `7000012345` and `6123054789` survive intact.
 */
export function sanitizeMobileInput(raw: string): string {
  let digits = raw.replace(/\D/g, '');

  // Drop a pasted country code / trunk prefix first, so `+91 9876543210`
  // normalises to `9876543210` before the leading-digit rule is applied.
  if (digits.length > NATIONAL_NUMBER_LENGTH) {
    if (digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0')) {
      digits = digits.replace(/^0+/, '');
    }
  }

  // An Indian mobile number always starts with 6, 7, 8 or 9, so a leading 0-5
  // can never be a valid first digit. Dropping the whole leading run makes
  // pressing 0-5 into an empty field a no-op, and makes pasting behave exactly
  // like typing the same characters one at a time.
  digits = digits.replace(/^[0-5]+/, '');

  return digits.slice(0, NATIONAL_NUMBER_LENGTH);
}

export function isValidIndianMobile(nationalNumber: string): boolean {
  return INDIAN_MOBILE_PATTERN.test(nationalNumber);
}

/**
 * Returns a user-facing validation message, or `undefined` when the number is
 * valid. Messages are specific so the user knows what to fix.
 */
export function validateIndianMobile(nationalNumber: string): string | undefined {
  if (!nationalNumber) return 'Please enter your mobile number.';
  if (!/^[6-9]/.test(nationalNumber)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
  if (nationalNumber.length < NATIONAL_NUMBER_LENGTH) {
    return `Enter all ${NATIONAL_NUMBER_LENGTH} digits of your mobile number.`;
  }
  if (!isValidIndianMobile(nationalNumber)) return 'Please enter a valid Indian mobile number.';
  return undefined;
}

/** `9876543210` -> `98765 43210` */
export function formatIndianMobile(nationalNumber: string): string {
  if (nationalNumber.length <= 5) return nationalNumber;
  return `${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;
}

/** `9876543210` -> `+919876543210` (E.164, the format an SMS API expects). */
export function toE164(nationalNumber: string): string {
  return `${COUNTRY_DIAL_CODE}${nationalNumber}`;
}

/**
 * `9876543210` -> `+91 98XXX XX210`
 * Keeps the first two and last three digits so the user can still recognise
 * which of their numbers the code went to.
 */
export function maskIndianMobile(nationalNumber: string): string {
  if (nationalNumber.length !== NATIONAL_NUMBER_LENGTH) {
    return `${COUNTRY_DIAL_CODE} ${formatIndianMobile(nationalNumber)}`.trim();
  }
  const masked = `${nationalNumber.slice(0, 2)}XXXXX${nationalNumber.slice(7)}`;
  return `${COUNTRY_DIAL_CODE} ${formatIndianMobile(masked)}`;
}
