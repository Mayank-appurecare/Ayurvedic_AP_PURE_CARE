# APPURECARE API — Newman run (2026-09-08)

Command:

```
npx newman run postman/collection.postman.json -e postman/environment.postman.json
```

Environment: `APPURECARE local` (`baseUrl` = an ngrok tunnel to a local dev backend).

## Result

```
→ otp/request
  POST /api/auth/otp/request   [404 Not Found, 228ms]
  ✓ does not 5xx
  ✓ responds within 5s

→ otp/verify
  POST /api/auth/otp/verify    [404 Not Found, 117ms]
  ✓ does not 5xx
  ✓ responds within 5s

iterations: 1/1   requests: 2/2   test-scripts: 2/2   assertions: 4/4 passed, 0 failed
total run duration: 558ms
```

## Caveat

Both requests returned **404 Not Found**. The collection's own assertions only check
"does not 5xx" and "responds within 5s" — they pass, but that does not confirm the
OTP endpoints are actually implemented/reachable at this `baseUrl`. Treat this as
confirmation the tunnel is up and the server isn't erroring, not as proof the OTP
flow itself works. Re-run once the backend serves these routes to get a real signal.
