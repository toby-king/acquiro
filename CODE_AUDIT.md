# Code Audit & Architecture Review

> Generated: 2026-03-04

---

## Critical Security Issues

### 1. API Keys Exposed Client-Side
`VITE_OPENAI_API_KEY` and `VITE_BUBBLE_API_TOKEN` are prefixed with `VITE_`, meaning Vite bundles them into the public JavaScript. Anyone can open DevTools, inspect the network tab or source bundle, and extract them. This gives them:
- Unlimited OpenAI API usage billed to you
- Full read/write access to your entire Bubble database (users, leads, subscriptions)

**Fix:** Proxy all OpenAI calls through the Express backend and keep the key server-side only. This pattern is already used correctly for Stripe — apply it here too.

### 2. `isAdmin` Stored in localStorage
The admin flag comes from Bubble via `get_user`, gets stored in Zustand, and persists to localStorage. A technically savvy user could open DevTools and set `isAdmin: true` in localStorage to gain access to the admin panel. The admin routes on the backend have no authentication layer, so this is a real attack surface — the admin panel exposes MRR, revenue data, and all user conversations.

**Fix:** Validate admin status server-side on each admin API request, not just client-side.

### 3. No Stripe Webhook Handler
The subscription lifecycle relies on Stripe's checkout session polling (`/session-status`) to update Bubble on payment completion, but there is no webhook handler for ongoing events: `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`. This means:
- Failed renewals won't revoke access
- Cancelled subscriptions at period end won't update Bubble
- Subscription state can drift permanently out of sync

**Fix:** Add a `/api/checkout/webhook` route that handles Stripe lifecycle events and updates Bubble accordingly.

---

## Architectural Concerns

### 4. Bubble.io as Primary Database
The biggest long-term architectural risk. Bubble is a no-code tool designed for prototyping, not production SaaS backends. Specific concerns:
- **API reliability:** The triple-fallback JSON parsing strategy in `matchesService` and `AdminListingsTab` exists because Bubble returns malformed JSON — this is a symptom, not a fix
- **Query limitations:** No complex joins, limited filtering, no aggregation — forces heavy client-side data manipulation
- **Vendor lock-in:** The entire data model lives in a proprietary no-code tool with no easy migration path
- **Scalability:** Bubble's API rate limits and performance degrade at scale
- **Cost:** Bubble pricing scales steeply with usage

**Fix (medium-term):** Plan a migration to a proper database (PostgreSQL via Supabase, PlanetScale, etc.) with a real API layer.

### 5. OpenAI Model Name & Endpoint
The code uses model `gpt-5-mini` via `/v1/responses`. As of the time of this audit, `gpt-5-mini` may not exist (the standard small model is `gpt-4o-mini`). The `/v1/responses` endpoint is the newer Responses API, distinct from `/v1/chat/completions`. If the model name is wrong and OpenAI is silently falling back to a default, the actual model in use may be unknown.

**Fix:** Verify the model name and endpoint are correct and intentional.

### 6. No Rate Limiting
Any user or bot can hammer the OpenAI streaming endpoint (called client-side) and rack up API costs with no throttling. There is also no rate limiting on the backend Express routes.

**Fix:** Add `express-rate-limit` to all backend routes. Once OpenAI calls are moved server-side, rate limit those too.

---

## Auth & State Management

### 7. localStorage as Auth Token
The `userId` stored in Zustand/localStorage is effectively the user's credentials. There is no expiry, no signed token, no way to invalidate it server-side. If a userId leaks (e.g., via browser sharing or XSS), it grants permanent access to that account.

**Fix:** Use short-lived signed tokens (JWT or similar) issued by the backend on magic link verification, with server-side invalidation capability.

### 8. Stale Client State
Subscription status, admin flags, and user data are stored client-side with no TTL or re-validation. They can go stale — a user whose subscription lapses won't have their access revoked until they trigger a fresh `get_user` call.

**Fix:** Re-validate critical flags (isSubscribed, isAdmin) on app load or route navigation, not just on login.

---

## Code Quality

### 9. Triple-Fallback JSON Parsing
`matchesService` has three separate JSON parsing strategies (array wrapper, split-and-parse, regex extraction) to handle malformed Bubble responses. This is a bandage over an unreliable data source and adds significant complexity. If this is needed in production, the upstream data quality is a real problem.

**Files:** `src/services/matchesService.ts`, `src/components/admin/AdminListingsTab.tsx`

### 10. Monolithic Zustand Store
`useAdvisorStore` holds everything: wizard config, user identity, subscription state, admin flag, interstitial state, and reconnection flags — all in one store with localStorage persistence. All state (including sensitive flags) is serialized to disk together.

**Fix:** Separate ephemeral UI state (wizard progress) from persistent user state. Keep auth/admin flags server-validated rather than stored locally.

**File:** `src/hooks/useAdvisorStore.ts`

### 11. Missing React Error Boundaries
There are no React error boundaries. An unhandled exception in the dashboard or admin panel will crash the entire React tree to a blank screen with no recovery option.

**Fix:** Add error boundaries around major route-level components (Dashboard, Admin, Chat).

---

## Minor Observations

- **High temperature for domain advice:** OpenAI calls use `temperature: 1`. For an M&A advisor making financial/business recommendations, this is quite high and may produce inconsistent or hallucinated responses. A value in the 0.5–0.7 range would be more appropriate.
- **ElevenLabs Agent ID is client-side:** Less critical than the others, but exposes your ElevenLabs agent configuration publicly.
- **Prompt injection via advisor name:** The user's chosen advisor name is injected directly into the system prompt with no sanitization. A user could potentially inject instructions into the prompt via this field.
- **`leadMailService` opacity:** The actual email sending logic delegates entirely to Bubble. If Bubble handles transactional email, that's another critical dependency on an external no-code tool with limited observability.

---

## Priority Order

| Priority | Issue |
|----------|-------|
| 1 | Move OpenAI calls to backend (fixes key exposure + enables rate limiting) |
| 2 | Add Stripe webhook handler for subscription lifecycle |
| 3 | Add server-side admin auth on all `/api/admin` routes |
| 4 | Add `express-rate-limit` to backend |
| 5 | Verify OpenAI model name is correct |
| 6 | Add React error boundaries |
| 7 | Plan migration path away from Bubble (medium-term) |
