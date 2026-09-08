import {
  formatIndianMobile,
  isValidIndianMobile,
  maskIndianMobile,
  sanitizeMobileInput,
  toE164,
  validateIndianMobile,
} from '../phone';

// `sanitizeMobileInput` is the single gate every keystroke, paste and autofill
// passes through, so its rules are asserted case by case rather than in bulk.
describe('sanitizeMobileInput', () => {
  it('keeps a valid 10-digit number untouched', () => {
    expect(sanitizeMobileInput('9876543210')).toBe('9876543210');
  });

  it('strips everything that is not a digit', () => {
    expect(sanitizeMobileInput('98a76-54 32(10)')).toBe('9876543210');
    expect(sanitizeMobileInput('98.76.54.32.10')).toBe('9876543210');
    expect(sanitizeMobileInput('abcdef')).toBe('');
  });

  // Only the FIRST digit is restricted. This is the rule that regressed most
  // easily, because a naive implementation strips 0-5 everywhere.
  describe('leading-digit rule', () => {
    it.each(['6', '7', '8', '9'])('accepts %s as a first digit', (digit) => {
      expect(sanitizeMobileInput(digit)).toBe(digit);
    });

    it.each(['0', '1', '2', '3', '4', '5'])(
      'produces nothing when %s is typed into an empty field',
      (digit) => {
        expect(sanitizeMobileInput(digit)).toBe('');
      }
    );

    it('allows 0-5 anywhere after the first digit', () => {
      expect(sanitizeMobileInput('7000012345')).toBe('7000012345');
      expect(sanitizeMobileInput('6123054789')).toBe('6123054789');
    });

    it('drops a whole leading run of invalid digits, not just one', () => {
      // Typing 1,2,3 then 9 must behave like typing 9 on its own.
      expect(sanitizeMobileInput('1239876543')).toBe('9876543');
      expect(sanitizeMobileInput('0000009876')).toBe('9876');
    });
  });

  describe('pasted numbers', () => {
    it('drops a +91 country code', () => {
      expect(sanitizeMobileInput('+919876543210')).toBe('9876543210');
      expect(sanitizeMobileInput('+91 98765 43210')).toBe('9876543210');
    });

    it('drops a leading 0 trunk prefix', () => {
      expect(sanitizeMobileInput('09876543210')).toBe('9876543210');
    });

    it('caps the result at 10 digits', () => {
      expect(sanitizeMobileInput('98765432109999')).toBe('9876543210');
      expect(sanitizeMobileInput('+91987654321055')).toBe('9876543210');
    });

    // The prefix rules only fire above 10 digits, so a number that merely
    // starts with 91 is not mistaken for a country code.
    it('does not treat a 10-digit number starting with 91 as a country code', () => {
      expect(sanitizeMobileInput('9188888888')).toBe('9188888888');
    });
  });

  it('treats a paste exactly like typing the same characters', () => {
    const pasted = sanitizeMobileInput('+91 98765 43210');
    const typed = '+919876543210'
      .split('')
      .reduce((acc, char) => sanitizeMobileInput(acc + char), '');
    expect(pasted).toBe(typed);
  });
});

describe('isValidIndianMobile', () => {
  it.each(['6000000000', '7123456789', '8888888888', '9876543210'])('accepts %s', (n) => {
    expect(isValidIndianMobile(n)).toBe(true);
  });

  it.each([
    ['', 'empty'],
    ['987654321', 'only 9 digits'],
    ['98765432101', '11 digits'],
    ['1234567890', 'starts with 1'],
    ['5123456789', 'starts with 5'],
  ])('rejects %s (%s)', (n) => {
    expect(isValidIndianMobile(n)).toBe(false);
  });
});

describe('validateIndianMobile', () => {
  it('returns undefined for a valid number', () => {
    expect(validateIndianMobile('9876543210')).toBeUndefined();
  });

  it('asks for a number when the field is empty', () => {
    expect(validateIndianMobile('')).toMatch(/enter your mobile number/i);
  });

  it('explains the leading-digit rule before complaining about length', () => {
    // A short AND wrongly-prefixed number should report the prefix problem,
    // which is the one the user has to fix first.
    expect(validateIndianMobile('12')).toMatch(/start with 6, 7, 8 or 9/i);
  });

  it('asks for the remaining digits when the number is too short', () => {
    expect(validateIndianMobile('98765')).toMatch(/all 10 digits/i);
  });
});

describe('formatIndianMobile', () => {
  it('splits a full number after five digits', () => {
    expect(formatIndianMobile('9876543210')).toBe('98765 43210');
  });

  it('leaves partial input alone until there is something to split', () => {
    expect(formatIndianMobile('')).toBe('');
    expect(formatIndianMobile('98765')).toBe('98765');
    expect(formatIndianMobile('987654')).toBe('98765 4');
  });
});

describe('toE164', () => {
  it('prefixes the country dial code', () => {
    expect(toE164('9876543210')).toBe('+919876543210');
  });
});

describe('maskIndianMobile', () => {
  it('keeps the first two and last three digits', () => {
    expect(maskIndianMobile('9876543210')).toBe('+91 98XXX XX210');
  });

  it('falls back to plain formatting for an incomplete number', () => {
    expect(maskIndianMobile('98765')).toBe('+91 98765');
    expect(maskIndianMobile('')).toBe('+91');
  });
});
