# Authentication & Token Storage

## Where the Token Lives
- The demo session token is kept in memory (`inMemoryToken`) and mirrored in `localStorage` under `bug_bazaar_token` via `tokenStorage` in `src/api/client.ts`.

## Trade-Offs
- **Pros (`localStorage` + memory):** Survives page refreshes so the user stays signed in across reloads, while keeping fast synchronous access in memory.
- **Cons (`localStorage`):** Accessible to JavaScript on the same origin (vulnerable to XSS if an injection flaw exists), unlike `HttpOnly`, `Secure` cookies managed by a backend server.
- **Session Hygiene:** `401` / `UNAUTHORIZED` responses clear the stored token and redirect protected routes (`/checkout`, `/account`) back to `/login` with `state.from` so users return to their intended destination after signing in.