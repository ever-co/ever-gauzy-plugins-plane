# Plane UIs: shared vs self-hosted — a per-tenant choice (+ SSO & security)

Companion to the [Kubernetes deployment guide](../deploy/kubernetes/README.md). It describes how a
Gauzy tenant chooses **how** it uses Plane, how login/SSO works on the **shared** option, what the
"Connect"/enable action actually does, and the **security model**.

---

## TL;DR

A tenant picks one of two modes when it enables the Plane integration in Gauzy:

| | **(a) Shared** *(default)* | **(b) Custom (self-hosted)** |
|---|---|---|
| Plane UI URLs | Ever's global `plane.gauzy.co`, `plane-admin.gauzy.co`, `plane-space.gauzy.co` (shown read-only) | The tenant's own URLs (entered by the admin) |
| Who deploys the UIs | Ever (once, globally) | The tenant |
| The "Connect" action | **Just "Enable"** — opt the tenant in | Enter URLs + enable |
| How the proxy finds the tenant | from the **logged-in session** (JWT) | from the **URL path** (`/api/plane/{tenantId}`) baked into that tenant's build |
| Login | Open the URL, sign in with Gauzy credentials (or one-click SSO) | same |

Both modes are served by the **same** proxy mount on `api.gauzy.co`. The only real difference is
**where the tenant identity comes from** — the session (shared) or the baked URL path (custom).

---

## Why both are possible (and why shared works now)

The proxy resolves the tenant per request, in priority order: the verified **session JWT**
(`auth-proxy-plane-token-*` cookie) → a `tenant-id` cookie / `X-TENANT-ID` header → the **UUID in
the URL path**. The recent security fix made the **session JWT the source of truth** when present.

That single change is what unlocks the shared option:

- **Custom build** bakes `VITE_API_BASE_URL=https://api.gauzy.co/api/plane/{tenantId}` → the tenant
  is in every URL → one build per tenant.
- **Shared build** bakes `VITE_API_BASE_URL=https://api.gauzy.co/api/plane` (no tenant) → the tenant
  comes from the session after login → **one build serves every tenant.**

So a tenant that chooses "shared" needs to deploy nothing; it reuses the global Plane build.

---

## What the Gauzy integration screen looks like

When a tenant admin opens **Integrations → Plane**, they choose a mode:

**(a) Use the shared Plane UIs (default).** The three global URLs are shown read-only with an
**Enable** button. Enabling opts the tenant in (a feature gate) — it does **not** require entering
URLs or self-hosting. After enabling, the admin (and the tenant's members) can open the URLs and
sign in.

**(b) Use my own Plane UIs.** The current page: the admin enters their `planeWebUrl` /
`planeAdminUrl` / `planeSpaceUrl` (their self-hosted deployment). The proxy uses path-based tenant
resolution and per-tenant CORS for these.

> **"Connect" demystified:** in the custom case it registers the tenant's URLs and generates the
> per-tenant credentials. In the shared case there are no custom URLs and no per-tenant credentials
> to manage — so the button is simply **"Enable Plane for this tenant."**

---

## How login / SSO works on the shared UIs

This is the part that's easy to over-think. There are two levels; **level 1 already works** once the
shared build is deployed and the security fix is merged.

### Level 1 — sign in with your Gauzy credentials (works today)

1. The user opens `https://plane.gauzy.co` and sees Plane's sign-in screen.
2. They enter their **Gauzy email + password** (or use the **magic link**). The proxy forwards this
   to Gauzy's public `/auth/login` (or `/auth/signin.email`) endpoints — these need **no** API key
   (verified: both are `@Public()` in Gauzy's auth controller).
3. Gauzy authenticates them and returns a JWT carrying their `tenantId`. The proxy stores it in the
   `auth-proxy-plane-token-*` cookie.
4. Every later request carries that cookie; the proxy reads the tenant from the verified JWT and
   scopes everything to the right tenant.

This is **not** seamless SSO — the user types their Gauzy credentials into Plane's login — but it
"just works" with the shared build because the tenant is derived from the session, not the URL.

### Level 2 — one-click SSO (the recommended enhancement)

1. From the Gauzy dashboard the user clicks **Open Plane**. Gauzy mints a short-lived **signed
   handoff token** and redirects to `https://plane.gauzy.co/?sso=<token>`.
2. A small **proxy SSO endpoint** validates the handoff, exchanges it for the Gauzy session, and
   sets the Plane session cookie — the user lands **already logged in**, no second password entry.

Why level 2 is worth building:
- **Seamless** — no re-login for users already in Gauzy.
- **Disambiguates multi-tenant users** — a person whose email exists in several Gauzy tenants is a
  problem for plain email/password login (which tenant?). SSO pins the exact tenant **and**
  organization the user chose in Gauzy, so there's no guessing.

> So: **"will SSO work right away?"** — Plain credential login works right away. True one-click SSO
> is a small bridge endpoint we add; until it exists, shared users just sign in once with their
> Gauzy credentials.

---

## What each mode needs (implementation checklist)

Status against the current codebase:

**Already done (security fix — PRs `ever-co/ever-gauzy#9747` + `ever-co/ever-gauzy-plugins-plane#252`):**
- Session JWT is authoritative for tenant resolution → a shared, tenant-agnostic build resolves the
  tenant from login.

**Operator one-time setup for the shared deployment (config/infra, no app code):**
- Deploy **one** tenant-agnostic Plane build (`VITE_API_BASE_URL=https://api.gauzy.co/api/plane`) at
  the global URLs — see the [deployment guide](../deploy/kubernetes/README.md) (`MODE=shared`).
- Configure the proxy's default config with the **shared origins** (so CORS passes pre- and
  post-login) and a **global app-level API key** (so password-login's `email-check` succeeds; without
  it the UI falls back to magic-link, which needs no key).

**Small code additions to productize the choice:**
- **Backend** (`integration-plane`): add a `mode: 'shared' | 'custom'` to the setup DTO/flow. For
  `shared`, don't require URLs (use the global ones) and skip per-tenant credential generation; just
  record the opt-in (`IS_ENABLED`).
- **Proxy** (`mount.ts`): union the configured **global shared origins** into the CORS allow-list so
  a shared-mode request is permitted regardless of per-tenant config.
- **UI** (`integration-plane-ui`): the two-option selector described above (shared default + Enable;
  custom = the existing URL form).
- *(Optional but recommended)* enforce the per-tenant **enable gate** in the proxy (reject a
  session-resolved tenant that hasn't opted in), and build the **SSO bridge** for level-2 login.

None of these are large; the load-bearing change (session-based tenant resolution) already landed.

---

## Security

> **Does knowing another tenant's TenantID UUID let an attacker read that tenant's data? No.** This
> holds for **both** modes.

The tenant identifier (a path UUID in custom mode, a session claim in shared mode) is a
**routing/scoping input, not a credential**. Data access is always gated by the **signed** session
JWT:

- Gauzy verifies the JWT signature (`jwt.strategy.ts`) and derives the tenant from the **token
  payload** (`RequestContext.currentTenantId() = user.tenantId`); `TenantAwareCrudService` ANDs that
  tenant into every query. A request with tenant A's JWT returns **A's** rows, never B's — whatever
  the URL says.
- The only API-key-authenticated route the proxy uses is `email-check`, which returns just
  `{ exists: boolean }`.

**Shared-mode specifics:**
- The shared build carries no tenant in the URL, so the tenant comes **only** from the verified
  session — there is no path UUID to confuse. The security fix ensures the session is authoritative.
- The global API key used for the shared deployment's `email-check` is an **email-existence oracle**
  only (global, boolean); treat it as such and rate-limit it.
- Multi-tenant users: prefer **SSO** (level 2) so the tenant is pinned by Gauzy rather than inferred
  from an email that may exist in several tenants.

**Custom-mode specifics:** unchanged from before — per-tenant build + per-tenant CORS; the path UUID
is non-secret and grants nothing on its own.

### Known residuals (low severity, both modes)
- `email-check` is a global user-existence oracle — rate-limit it.
- A session-resolved tenant with no Plane config currently falls back to a default (empty
  credentials) rather than an explicit deny; the optional enable-gate above closes this.

### Operational hardening
- Serve everything over **HTTPS** (the session cookie is `Secure`).
- Keep the Plane UI and the Gauzy API under one **registrable domain** (`gauzy.co`) so the session
  cookie stays same-site; cross-registrable-domain hosting needs `SameSite=None; Secure`.
- Register **exactly** the origins you serve from (shared globals, or a custom tenant's own URLs) —
  they become the CORS allow-list.
