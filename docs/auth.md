# Authentication

## Flow

1. `POST /api/login` returns `{ token, user }`. `LoginPage` dispatches `signedIn(...)`.
2. `baseQuery` adds `Authorization: Bearer <token>` to every request (read from the Redux `session` slice).
3. `RequireAuth` protects `/checkout`, `/account` and `/orders/:id`. A signed-out visitor goes to `/login` with
   `state.from = { pathname, search }`, and after login they are sent back there.
4. On app start, `SessionWatcher` calls `GET /api/me` to check a saved token.
5. **Any 401** on a request that carried a token dispatches `sessionExpired()` in the base query, in one place.
   The session is cleared (and its storage key), the route guard redirects, and a toast plus a banner explain why.
6. The login form can't be double-submitted: a ref guard blocks a second submit in the same tick, and the button is disabled while the request is pending.

## Where the token is stored

In the Redux store (memory), and mirrored to `localStorage` (`bazaar:session:v1`) so a refresh keeps you signed in.

## Trade-off

| Option                              | Survives refresh | Readable by JS (XSS risk) | CSRF risk             | Notes                                     |
| ----------------------------------- | ---------------- | ------------------------- | --------------------- | ----------------------------------------- |
| Memory only                         | No               | Only while page is open   | No                    | Safest, but every refresh logs you out    |
| **localStorage (chosen)**           | Yes              | **Yes**                   | No                    | Simple. Any XSS can steal the token       |
| sessionStorage                      | Per tab          | Yes                       | No                    | Same risk, shorter lifetime               |
| `HttpOnly; Secure; SameSite` cookie | Yes              | No                        | Mitigated by SameSite | Best for production; needs a real backend |

I chose `localStorage` because there is no real backend to set cookies, and staying signed in across reloads matters
for the demo. The risk is XSS, which is reduced here because React escapes output, there is no `dangerouslySetInnerHTML`,
and the only third-party code is the npm dependencies. **In production** I would use an `HttpOnly`, `Secure`, `SameSite=Lax`
session cookie (or a short-lived access token in memory plus a refresh token in an `HttpOnly` cookie), and add a CSP header.
