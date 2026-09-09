import { apiAuthService } from '../apiAuthService';
import { AuthError, isAuthError } from '../types';

/**
 * Service-layer tests for the real OTP client.
 *
 * `fetch` is replaced rather than intercepted at the HTTP level, because most
 * of what this file has to get right is transport behaviour a real server
 * cannot be made to produce on demand: an aborted request, a body that fails to
 * read, ngrok's HTML interstitial instead of JSON. The Newman collection covers
 * the opposite side — that the live API answers correctly — so the two do not
 * overlap.
 *
 * Every helper in the module is private, so everything is driven through the
 * four public methods. That is deliberate: the tests then describe the contract
 * screens actually depend on.
 */

const BASE = 'https://bartender-sloppy-sandstone.ngrok-free.dev';

let fetchMock: jest.SpyInstance;

/** A successful API envelope. `status: "00"` is the API's "succeeded" code. */
function okResponse(data: unknown = null, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify({ data, message: 'Success', status: '00' }),
  } as unknown as Response;
}

/** A failing envelope: any `status` other than "00", or a non-2xx HTTP code. */
function failResponse({
  httpStatus = 400,
  message,
  apiStatus = '01',
}: { httpStatus?: number; message?: string; apiStatus?: string } = {}) {
  return {
    ok: httpStatus >= 200 && httpStatus < 300,
    status: httpStatus,
    text: async () => JSON.stringify({ data: null, message, status: apiStatus }),
  } as unknown as Response;
}

/** A body that is not JSON at all — a proxy error page, or ngrok's warning. */
function nonJsonResponse(body: string, httpStatus = 404) {
  return {
    ok: httpStatus >= 200 && httpStatus < 300,
    status: httpStatus,
    text: async () => body,
  } as unknown as Response;
}

/** Captures the arguments of the most recent fetch call. */
function lastFetch() {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: url as string, init: init as RequestInit };
}

/** Runs `fn` and returns the AuthError it rejects with. Fails if it resolves. */
async function captureAuthError(fn: () => Promise<unknown>): Promise<AuthError> {
  try {
    await fn();
  } catch (error) {
    if (!isAuthError(error)) throw error;
    return error;
  }
  throw new Error('expected the call to reject, but it resolved');
}

beforeEach(() => {
  fetchMock = jest.spyOn(global, 'fetch');
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
//  Group A — transport
// ---------------------------------------------------------------------------

describe('transport', () => {
  it('resolves when the envelope reports success', async () => {
    fetchMock.mockResolvedValue(okResponse());

    await expect(apiAuthService.requestOtp('9876543210')).resolves.toBeTruthy();
  });

  it('maps a transport failure to a NETWORK error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await captureAuthError(() => apiAuthService.requestOtp('9876543210'));
    expect(error.code).toBe('NETWORK');
    expect(error.message).toMatch(/could not reach the server/i);
  });

  // An abort gets its own wording, because "took too long" and "could not
  // reach" tell the customer to do different things.
  it('distinguishes a timeout from an unreachable server', async () => {
    const abort = new Error('Aborted');
    abort.name = 'AbortError';
    fetchMock.mockRejectedValue(abort);

    const error = await captureAuthError(() => apiAuthService.requestOtp('9876543210'));
    expect(error.code).toBe('NETWORK');
    expect(error.message).toMatch(/took too long/i);
    expect(error.message).not.toMatch(/could not reach/i);
  });

  it('maps a body that cannot be read to a NETWORK error', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => {
        throw new Error('stream closed');
      },
    } as unknown as Response);

    const error = await captureAuthError(() => apiAuthService.requestOtp('9876543210'));
    expect(error.code).toBe('NETWORK');
    expect(error.message).toMatch(/unexpected response/i);
  });

  // This is the failure the project actually hit: a dead ngrok tunnel answers
  // with its own HTML error page, not JSON.
  it('treats a non-JSON body as not having reached the API', async () => {
    fetchMock.mockResolvedValue(
      nonJsonResponse('<!DOCTYPE html><html><body>ERR_NGROK_3200</body></html>')
    );

    const error = await captureAuthError(() => apiAuthService.requestOtp('9876543210'));
    expect(error.code).toBe('NETWORK');
    expect(error.message).toMatch(/unexpected response/i);
  });

  // The envelope's own status is authoritative, independently of the HTTP code.
  it('rejects a 200 that carries a non-success envelope status', async () => {
    fetchMock.mockResolvedValue(
      failResponse({ httpStatus: 200, apiStatus: '01', message: 'Something failed' })
    );

    const error = await captureAuthError(() => apiAuthService.requestOtp('9876543210'));
    expect(error.message).toBe('Something failed');
  });

  it('rejects a non-2xx even when the envelope status is the success code', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ data: null, status: '00' }),
    } as unknown as Response);

    await expect(apiAuthService.requestOtp('9876543210')).rejects.toBeInstanceOf(AuthError);
  });

  it('sends the JSON headers and the ngrok interstitial bypass', async () => {
    fetchMock.mockResolvedValue(okResponse());
    await apiAuthService.requestOtp('9876543210');

    const { init } = lastFetch();
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    });
  });

  it('posts to the request endpoint on the configured base URL', async () => {
    fetchMock.mockResolvedValue(okResponse());
    await apiAuthService.requestOtp('9876543210');

    expect(lastFetch().url).toBe(`${BASE}/api/auth/otp/request`);
  });

  it('never leaves a pending timeout behind on success', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    fetchMock.mockResolvedValue(okResponse());

    await apiAuthService.requestOtp('9876543210');

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('clears the timeout even when the request fails', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await captureAuthError(() => apiAuthService.requestOtp('9876543210'));

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
//  Group B — error mapping
// ---------------------------------------------------------------------------

/**
 * `mapErrorCode` reads the server's message BEFORE it looks at the HTTP status.
 * Screens branch on the code — clearing the OTP input, restarting the flow — so
 * a wrong code sends the customer down the wrong path.
 */
describe('error mapping', () => {
  const verifyWith = (options: Parameters<typeof failResponse>[0]) => {
    fetchMock.mockResolvedValue(failResponse(options));
    return captureAuthError(() => apiAuthService.verifyOtp('+919876543210', '123456'));
  };

  it('reads an expired code from the message', async () => {
    expect((await verifyWith({ message: 'OTP expired' })).code).toBe('CODE_EXPIRED');
  });

  it('reads an invalid code from the message', async () => {
    expect((await verifyWith({ message: 'Invalid OTP' })).code).toBe('INVALID_CODE');
  });

  it('treats a phone-related message as an invalid phone', async () => {
    expect((await verifyWith({ message: 'Phone number not registered' })).code).toBe(
      'INVALID_PHONE'
    );
  });

  it.each([
    [401, 'INVALID_CODE'],
    [403, 'INVALID_CODE'],
    [429, 'TOO_MANY_ATTEMPTS'],
    [400, 'INVALID_PHONE'],
    [422, 'INVALID_PHONE'],
    [500, 'NETWORK'],
    [503, 'NETWORK'],
    [418, 'UNKNOWN'],
  ])('maps HTTP %i to %s when there is no message', async (httpStatus, expected) => {
    expect((await verifyWith({ httpStatus })).code).toBe(expected);
  });

  // The message wins. A 500 that says "expired" is a expired-code problem the
  // customer can fix by resending, not a server outage.
  it('lets the message override the HTTP status', async () => {
    expect((await verifyWith({ httpStatus: 500, message: 'OTP expired' })).code).toBe(
      'CODE_EXPIRED'
    );
  });

  it('shows the server message verbatim when there is one', async () => {
    const error = await verifyWith({ httpStatus: 400, message: '  Wrong OTP, 2 tries left  ' });
    expect(error.message).toBe('Wrong OTP, 2 tries left');
  });

  it.each([
    [429, /too many attempts/i],
    [500, /having trouble/i],
    [418, /something went wrong/i],
  ])('falls back to a written message for HTTP %i', async (httpStatus, pattern) => {
    expect((await verifyWith({ httpStatus })).message).toMatch(pattern);
  });

  it('falls back when the server sends a blank message', async () => {
    expect((await verifyWith({ httpStatus: 400, message: '   ' })).message).toMatch(
      /something went wrong/i
    );
  });
});

// ---------------------------------------------------------------------------
//  Group C — verifyOtp session
// ---------------------------------------------------------------------------

describe('verifyOtp session', () => {
  const verify = () => apiAuthService.verifyOtp('+919876543210', '123456');

  it('sends both the phone number and the code', async () => {
    fetchMock.mockResolvedValue(okResponse());
    await verify();

    const { url, init } = lastFetch();
    expect(url).toBe(`${BASE}/api/auth/otp/verify`);
    expect(JSON.parse(init.body as string)).toEqual({
      phoneNumber: '+919876543210',
      otp: '123456',
    });
  });

  it.each(['token', 'accessToken', 'access_token', 'jwt', 'idToken'])(
    'picks the bearer token up from data.%s',
    async (key) => {
      fetchMock.mockResolvedValue(okResponse({ [key]: 'header.payload.signature' }));

      const session = await verify();
      expect(session.accessToken).toBe('header.payload.signature');
    }
  );

  it('prefers `token` when the response carries several aliases', async () => {
    fetchMock.mockResolvedValue(okResponse({ token: 'first', jwt: 'second' }));

    expect((await verify()).accessToken).toBe('first');
  });

  it('reports no token rather than failing when none is sent', async () => {
    fetchMock.mockResolvedValue(okResponse({ categories: [] }));

    const session = await verify();
    expect(session.accessToken).toBeNull();
  });

  it('ignores a blank token', async () => {
    fetchMock.mockResolvedValue(okResponse({ token: '   ' }));

    expect((await verify()).accessToken).toBeNull();
  });

  // The endpoint currently returns `data: null`, so the phone number is the
  // only identity available. The session still has to be usable.
  it('builds a usable user from a null data payload', async () => {
    fetchMock.mockResolvedValue(okResponse(null));

    const { user } = await verify();
    expect(user).toEqual({
      id: '+919876543210',
      name: 'AP Pure Care Customer',
      email: '',
      phone: '+919876543210',
      isGuest: false,
    });
  });

  it('uses richer identity fields when the backend starts sending them', async () => {
    fetchMock.mockResolvedValue(
      okResponse({ id: 'u-42', name: 'Sumiran', email: 'sumiran@example.com' })
    );

    const { user } = await verify();
    expect(user).toMatchObject({ id: 'u-42', name: 'Sumiran', email: 'sumiran@example.com' });
  });

  it('reads identity from a nested user or customer object', async () => {
    fetchMock.mockResolvedValue(okResponse({ user: { name: 'Nested Name' } }));
    expect((await verify()).user.name).toBe('Nested Name');

    fetchMock.mockResolvedValue(okResponse({ customer: { name: 'Customer Name' } }));
    expect((await verify()).user.name).toBe('Customer Name');
  });

  it('falls back rather than accepting a blank identity field', async () => {
    fetchMock.mockResolvedValue(okResponse({ name: '   ', id: '' }));

    const { user } = await verify();
    expect(user.name).toBe('AP Pure Care Customer');
    expect(user.id).toBe('+919876543210');
  });

  it('never marks a verified session as a guest', async () => {
    fetchMock.mockResolvedValue(okResponse({ isGuest: true }));

    expect((await verify()).user.isGuest).toBe(false);
  });
});

// ---------------------------------------------------------------------------
//  Group D — catalog extraction
// ---------------------------------------------------------------------------

/**
 * The catalog arrives on the same response as the token, and it is untrusted
 * wire data. A malformed entry must be dropped, never crash a screen that
 * renders it — and names must survive verbatim, since the API owns them.
 */
describe('catalog extraction', () => {
  const verifyWithData = (data: unknown) => {
    fetchMock.mockResolvedValue(okResponse(data));
    return apiAuthService.verifyOtp('+919876543210', '123456');
  };

  it('maps categories and products', async () => {
    const session = await verifyWithData({
      categories: [{ id: 1, name: 'Digestive Care', description: null }],
      productList: [{ id: 8, name: 'Abhayarishta', categoryId: 3, price: 195 }],
    });

    expect(session.catalog?.categories).toHaveLength(1);
    expect(session.catalog?.products).toHaveLength(1);
  });

  it('reports no catalog when the response carries neither key', async () => {
    const session = await verifyWithData({ token: 'abc' });

    expect(session.catalog).toBeNull();
  });

  it('accepts a response that carries only categories', async () => {
    const session = await verifyWithData({ categories: [{ id: 1, name: 'Ear Care' }] });

    expect(session.catalog?.categories).toHaveLength(1);
    expect(session.catalog?.products).toEqual([]);
  });

  it.each([
    ['no id', { name: 'Nameless' }],
    ['a string id', { id: '1', name: 'Stringy' }],
    ['no name', { id: 1 }],
    ['a blank name', { id: 1, name: '   ' }],
    ['not an object', 'nonsense'],
  ])('drops a category with %s', async (_label, category) => {
    const session = await verifyWithData({
      categories: [category, { id: 2, name: 'Valid' }],
      productList: [],
    });

    expect(session.catalog?.categories.map((c) => c.name)).toEqual(['Valid']);
  });

  it('passes category names through verbatim', async () => {
    const session = await verifyWithData({
      categories: [
        { id: 46, name: "Women's Health" },
        { id: 23, name: 'Stress, Sleep & Mind' },
      ],
    });

    expect(session.catalog?.categories.map((c) => c.name)).toEqual([
      "Women's Health",
      'Stress, Sleep & Mind',
    ]);
  });

  it('keeps sub-services and drops malformed children', async () => {
    const session = await verifyWithData({
      categories: [
        {
          id: 1,
          name: 'Digestive Care',
          subService: [{ id: 2, name: 'Acidity' }, { name: 'Broken' }],
        },
      ],
    });

    expect(session.catalog?.categories[0].subService).toEqual([
      { id: 2, name: 'Acidity', description: null },
    ]);
  });

  // The UI checks for the key's presence, so an empty array would be a lie.
  it.each([
    ['is not an array', 'nope'],
    ['is empty', []],
    ['contains only malformed children', [{ name: 'Broken' }]],
  ])('omits subService entirely when it %s', async (_label, subService) => {
    const session = await verifyWithData({
      categories: [{ id: 1, name: 'Digestive Care', subService }],
    });

    expect(session.catalog?.categories[0]).not.toHaveProperty('subService');
  });

  it('normalises a non-string description to null', async () => {
    const session = await verifyWithData({
      categories: [{ id: 1, name: 'Digestive Care', description: 42 }],
    });

    expect(session.catalog?.categories[0].description).toBeNull();
  });

  it('drops a malformed product but keeps the valid ones', async () => {
    const session = await verifyWithData({
      productList: [
        { id: 8, name: 'Abhayarishta' },
        { name: 'No id' },
        { id: 9, name: '  ' },
        { id: 10, name: 'Amalaki Churna' },
      ],
    });

    expect(session.catalog?.products.map((p) => p.name)).toEqual([
      'Abhayarishta',
      'Amalaki Churna',
    ]);
  });

  it('defaults missing numbers to zero rather than NaN', async () => {
    const session = await verifyWithData({
      productList: [{ id: 8, name: 'Abhayarishta', price: null, stockQuantity: 'lots' }],
    });

    const product = session.catalog!.products[0];
    expect(product.price).toBe(0);
    expect(product.stockQuantity).toBe(0);
    expect(product.discountPercentage).toBe(0);
  });

  it('normalises blank optional strings to null', async () => {
    const session = await verifyWithData({
      productList: [{ id: 8, name: 'Abhayarishta', sku: '   ', composition: 42 }],
    });

    const product = session.catalog!.products[0];
    expect(product.sku).toBeNull();
    expect(product.composition).toBeNull();
  });

  // Anything other than a real `true` is false: a truthy string must not turn
  // an ordinary product into a prescription-only one.
  it.each([
    ['yes', false],
    [1, false],
    ['true', false],
    [true, true],
  ])('reads prescriptionRequired %p as %p', async (value, expected) => {
    const session = await verifyWithData({
      productList: [{ id: 8, name: 'Abhayarishta', prescriptionRequired: value }],
    });

    expect(session.catalog!.products[0].prescriptionRequired).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
//  Group E — reachability probe
// ---------------------------------------------------------------------------

/**
 * Runs on the Welcome screen as it mounts, so it must never send an OTP and
 * never reject — the UI uses it for an advisory notice, not as a gate.
 */
describe('checkReachable', () => {
  it('probes with OPTIONS so opening the app never costs the customer an OTP', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);

    await apiAuthService.checkReachable();

    const { url, init } = lastFetch();
    expect(init.method).toBe('OPTIONS');
    expect(url).toBe(`${BASE}/api/auth/otp/request`);
    expect(init.body).toBeUndefined();
  });

  it('reports reachable on a 2xx', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);

    await expect(apiAuthService.checkReachable()).resolves.toBe(true);
  });

  // A dead tunnel answers 404. That is "unreachable", not a crash.
  it('reports unreachable on a non-2xx instead of throwing', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(apiAuthService.checkReachable()).resolves.toBe(false);
  });

  it('reports unreachable when fetch rejects instead of throwing', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiAuthService.checkReachable()).resolves.toBe(false);
  });

  it('sends the ngrok interstitial bypass on the probe too', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    await apiAuthService.checkReachable();

    expect(lastFetch().init.headers).toMatchObject({ 'ngrok-skip-browser-warning': 'true' });
  });
});

// ---------------------------------------------------------------------------
//  Group F — challenge contract
// ---------------------------------------------------------------------------

describe('requestOtp and resendOtp', () => {
  it('sends the national number to the API in E.164', async () => {
    fetchMock.mockResolvedValue(okResponse());
    await apiAuthService.requestOtp('9876543210');

    expect(JSON.parse(lastFetch().init.body as string)).toEqual({
      phoneNumber: '+919876543210',
    });
  });

  // The API is keyed by phone number, not by a server-issued id, so the
  // challenge handle IS the E.164 number. Screens pass it straight to verifyOtp.
  it('uses the E.164 number as the challenge handle', async () => {
    fetchMock.mockResolvedValue(okResponse());

    const challenge = await apiAuthService.requestOtp('9876543210');
    expect(challenge.challengeId).toBe('+919876543210');
    expect(challenge.phoneE164).toBe('+919876543210');
    expect(challenge.nationalNumber).toBe('9876543210');
  });

  it('sets the client-side expiry and resend cooldown', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const before = Date.now();

    const challenge = await apiAuthService.requestOtp('9876543210');

    expect(challenge.expiresAt - before).toBeGreaterThan(4 * 60 * 1000);
    expect(challenge.expiresAt - before).toBeLessThanOrEqual(5 * 60 * 1000 + 1000);
    expect(challenge.resendAvailableAt - before).toBeGreaterThan(25 * 1000);
    expect(challenge.resendAvailableAt - before).toBeLessThanOrEqual(30 * 1000 + 1000);
  });

  // devCode is what keeps the OTP screen's development panel hidden. A real
  // backend must never hand the passcode back to the client.
  it('never returns a devCode', async () => {
    fetchMock.mockResolvedValue(okResponse());

    expect((await apiAuthService.requestOtp('9876543210')).devCode).toBeUndefined();
  });

  it('reports itself as a real implementation, not the mock', () => {
    expect(apiAuthService.isMock).toBe(false);
  });

  it('resends by asking the request endpoint again with the same number', async () => {
    fetchMock.mockResolvedValue(okResponse());

    const challenge = await apiAuthService.resendOtp('+919876543210');

    const { url, init } = lastFetch();
    expect(url).toBe(`${BASE}/api/auth/otp/request`);
    expect(JSON.parse(init.body as string)).toEqual({ phoneNumber: '+919876543210' });
    expect(challenge.nationalNumber).toBe('9876543210');
  });

  it('refreshes the cooldown on a resend', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const before = Date.now();

    const challenge = await apiAuthService.resendOtp('+919876543210');

    expect(challenge.resendAvailableAt).toBeGreaterThan(before);
  });
});

// ---------------------------------------------------------------------------
//  Group G — development logging
// ---------------------------------------------------------------------------

/**
 * Logging is gated on `__DEV__` and redacts credential-shaped values. These
 * payloads carry phone numbers and session tokens, which must never reach a
 * production log or a crash reporter.
 */
describe('development logging', () => {
  const logged = () =>
    (console.log as unknown as jest.Mock).mock.calls.map((args) => args.join(' ')).join('\n');

  it('logs the request and response in development', async () => {
    fetchMock.mockResolvedValue(okResponse());
    await apiAuthService.requestOtp('9876543210');

    expect(logged()).toMatch(/\[auth-api\].*→ POST/);
    expect(logged()).toMatch(/\[auth-api\].*← OK 200/);
  });

  it('previews a token instead of printing it', async () => {
    const token = `eyJhbGciOiJIUzUxMiJ9.${'x'.repeat(180)}.sig`;
    fetchMock.mockResolvedValue(okResponse({ token }));

    await apiAuthService.verifyOtp('+919876543210', '123456');

    const output = logged();
    expect(output).not.toContain(token);
    expect(output).toMatch(/eyJhbGciOiJI… \(len \d+\)/);
  });

  it.each(['accessToken', 'access_token', 'refreshToken', 'jwt', 'idToken', 'password', 'secret'])(
    'redacts data.%s',
    async (key) => {
      fetchMock.mockResolvedValue(okResponse({ [key]: 'super-secret-value-1234567890' }));

      await apiAuthService.verifyOtp('+919876543210', '123456');

      expect(logged()).not.toContain('super-secret-value-1234567890');
    }
  );

  it('matches sensitive keys regardless of case', async () => {
    fetchMock.mockResolvedValue(okResponse({ TOKEN: 'super-secret-value-1234567890' }));

    await apiAuthService.verifyOtp('+919876543210', '123456');

    expect(logged()).not.toContain('super-secret-value-1234567890');
  });

  it('redacts a token nested inside an object or an array', async () => {
    fetchMock.mockResolvedValue(
      okResponse({
        session: { token: 'nested-secret-abcdefghij' },
        list: [{ jwt: 'in-array-1234567890' }],
      })
    );

    await apiAuthService.verifyOtp('+919876543210', '123456');

    const output = logged();
    expect(output).not.toContain('nested-secret-abcdefghij');
    expect(output).not.toContain('in-array-1234567890');
  });

  // An HTML error page can be enormous; the log must stay readable.
  it('logs only a bounded slice of a non-JSON body', async () => {
    const huge = `<!DOCTYPE html>${'A'.repeat(5000)}`;
    fetchMock.mockResolvedValue(nonJsonResponse(huge));

    await captureAuthError(() => apiAuthService.requestOtp('9876543210'));

    const output = logged();
    expect(output).toMatch(/<non-JSON body>/);
    expect(output.length).toBeLessThan(2000);
  });

  it('marks a failed transport in the log', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await captureAuthError(() => apiAuthService.requestOtp('9876543210'));

    expect(logged()).toMatch(/✕ POST/);
    expect(logged()).toMatch(/transport error/);
  });

  it('labels the reachability probe as reachable or unreachable', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    await apiAuthService.checkReachable();
    expect(logged()).toMatch(/← REACHABLE 200 OPTIONS/);

    (console.log as unknown as jest.Mock).mockClear();
    fetchMock.mockResolvedValue({ ok: false, status: 404 } as Response);
    await apiAuthService.checkReachable();
    expect(logged()).toMatch(/← UNREACHABLE 404 OPTIONS/);
  });
});
