# One Plane for all tenants? Shared deployment, SSO, and the security model

This companion to the [Kubernetes deployment guide](../deploy/kubernetes/README.md) answers two
questions:

1. **Why is the integration "one Plane build per tenant" today**, and can we instead run a single
   `plane.gauzy.co` that serves **all** Gauzy tenants behind SSO?
2. **Is the tenant UUID in the URL a security risk** — can knowing another tenant's UUID leak their
   data? (See [Security](#security).)

---

## 1. Why it's per‑tenant today

The proxy resolves which Gauzy tenant a request belongs to, in priority order
(`integration-plane/src/lib/plane-proxy.service.ts`):

1. `X-TENANT-ID` header **+ a Bearer JWT whose `tenantId` claim must match** (Gauzy‑internal calls).
2. A `tenant-id` cookie.
3. **A UUID in the URL path** — `…/api/plane/{tenantId}/…`. This is what the browser UIs use,
   because the Plane SPA is built with `VITE_API_BASE_URL=https://api.gauzy.co/api/plane/{tenantId}`.

And the front‑ends **bake `VITE_API_BASE_URL` at build time** (Vite `define: process.env`; no runtime
injection). So a built bundle contains exactly one tenant UUID:

> **One Plane build = one tenant.** That is the entire reason each tenant needs its own Plane URLs
> (`plane.<tenant>.com`) and its own image build.

It is not that the proxy can only serve one tenant — the single `/api/plane` mount on `api.gauzy.co`
already serves *all* tenants concurrently; it disambiguates them per request from the path UUID. The
limitation is purely in the **static SPA**, which can carry only one baked URL.

---

## 2. What it takes to run ONE shared `plane.gauzy.co` for ALL tenants

To serve every tenant from a single deployment, the tenant must stop being a build‑time constant and
become a **runtime** signal. Three things have to be solved:

| Problem | Today | Needed for shared |
|---|---|---|
| **A. Tenant source** | baked path UUID | derive tenant at runtime (session cookie / SSO / subdomain) |
| **B. The bundle** | one tenant baked in | one tenant‑agnostic build (`VITE_API_BASE_URL=https://api.gauzy.co/api/plane`, no UUID) |
| **C. Bootstrap** | path carries tenant even pre‑login | the *unauthenticated* steps (email‑check, instances, CSRF) have no tenant yet |
| **D. Ambiguity** | tenant is fixed by the URL | a user's email may exist in several tenants → which one? |

Good news: most of the machinery already exists.

- The proxy **already accepts a `tenant-id` cookie** and the session JWT (`auth-proxy-plane-token-*`)
  **already encodes `tenantId`** (`token.helper.ts: getCurrentTenantId()`).
- After the security fix in this repo, **the session JWT is the source of truth** for the tenant when
  a session is present — the path UUID is only a fallback. So an authenticated, tenant‑agnostic
  bundle would already resolve the right tenant *from the cookie*, with no UUID in the URL.

So the remaining work is **B + C + D**: a tenant‑agnostic build, and a way to establish the tenant
*before* the user has a Plane session.

### Recommended design — Gauzy‑initiated SSO (pin the tenant into the session)

The cleanest path reuses Gauzy's existing auth and avoids Plane's ambiguous email/password login:

```
1. User is already logged into Gauzy (knows their tenant + organization).
2. Gauzy dashboard shows "Open Plane" → links to
      https://plane.gauzy.co/?sso=<short-lived, Gauzy-signed handoff token>
3. A small proxy SSO endpoint (e.g. /api/plane/sso) validates the handoff token,
   exchanges it for a Gauzy session, and sets the auth-proxy-plane-token-* cookie
   (which already carries tenantId) on the shared domain.
4. From here every /api/plane/* call carries that cookie. extractTenantId reads
   tenantId from the verified cookie JWT — no path UUID, one shared bundle.
```

Why this resolves A–D:
- **A/B:** tenant comes from the cookie; the bundle is built once with
  `VITE_API_BASE_URL=https://api.gauzy.co/api/plane` (no UUID).
- **C:** the SSO handoff establishes the session *before* the SPA boots, so there is no
  tenant‑less bootstrap. The truly tenant‑neutral calls (`/api/instances`, `/api/timezones`) don't
  need a tenant anyway.
- **D:** Gauzy initiates the flow, so it pins the exact tenant **and** organization the user chose —
  no email‑based guessing. (A user who belongs to several tenants just gets several "Open Plane"
  entries, one per workspace.)

What has to be built:
- A **proxy SSO bridge** endpoint that turns a Gauzy‑signed handoff into the `auth-proxy-plane-token`
  cookie. (Gauzy can mint the handoff; the proxy already knows how to chunk the JWT into cookies.)
- A **tenant‑agnostic build** of web/space (+admin) and a single set of DNS/ingress/CORS for
  `plane.gauzy.co`. CORS is *simpler* here — one origin for everyone.
- Make `email-check`/password login on the shared host either **disabled** (SSO‑only) or
  tenant‑selecting, to avoid the multi‑tenant ambiguity (D) and the enumeration foot‑gun (see
  Security).

### Alternative designs (and why they're weaker)

- **Wildcard subdomain per tenant** (`<tenant>.plane.gauzy.co`, proxy reads tenant from `Host`).
  Still needs a tenant‑agnostic build + runtime `Host`→tenant mapping and wildcard DNS/TLS. More
  moving parts than the cookie approach, and the `Host` isn't an authenticated signal.
- **Tenant in path, but runtime‑injected** (drop a `window.__ENV` / `/env.js` into the image and
  patch Plane to read it). This makes one image serve any tenant via config, but it's an upstream
  Plane patch you'd have to carry, and it still needs the SSO bridge for bootstrap. Reasonable if
  you already fork Plane's build.
- **Keep per‑tenant builds** (status quo). Zero new code; just more images/URLs. Fine for a handful
  of tenants; doesn't scale to self‑serve.

**Bottom line:** a shared multi‑tenant `plane.gauzy.co` is feasible and most of the plumbing is
already present. The missing piece is a **Gauzy‑initiated SSO bridge** that sets the tenant‑bearing
session cookie, plus a **tenant‑agnostic build**. Until that exists, per‑tenant builds (this repo's
deployment guide) are the supported path.

---

## Security

> **Does knowing another tenant's TenantID UUID let an attacker read that tenant's data? No.**

The `<TENANT_ID>` in the URL is a **routing/config selector, not a credential**. It is intentionally
non‑secret (it lives in the bundle, URLs and logs). It selects which config the proxy loads; it does
**not** authorize data access. Four independent red‑team attempts to cross tenants all failed:

- **Authenticated user hits another tenant's UUID/path/workspace‑slug** → no leak. Every upstream
  query is force‑scoped to the **signed JWT's** tenant: `jwt.strategy.ts` verifies the signature and
  reads `tenantId` from the payload; `RequestContext.currentTenantId() = user.tenantId`;
  `TenantAwareCrudService.findConditionsWithTenant` ANDs that tenant into every query. A request with
  tenant A's JWT returns **A's** rows, never B's. The auto workspace‑switch is itself gated by a
  membership check that derives the email from the signed JWT.
- **Unauthenticated, knows the UUID** → no data. The only API‑key‑authenticated route the proxy uses
  is `email-check`, which returns just `{ exists: boolean }`. The credential that *would* grant
  tenant access (`apiKey`/`apiSecret`) is server‑side and never exposed by the UUID.

### Real weaknesses (none leak data, but worth fixing)

| # | Severity | Issue | Status / fix |
|---|---|---|---|
| 1 | medium | **Path tenant not bound to session** (confused deputy): a request could run under another tenant's resolved config while carrying a different tenant's session. Inert today (Gauzy re‑scopes by JWT), but fragile. | **Fixed in this repo** — `extractTenantId` now makes the verified session JWT authoritative, overriding the path UUID. |
| 2 | low | **`email-check` enumeration**: an unauthenticated caller who knows a tenant's UUID drives Gauzy's global email‑existence oracle using that tenant's API key. | Recommend: require a session (or an app‑level credential) before using the per‑tenant key for email‑check, and rate‑limit it. |
| 3 | low | **Proxy `AuthGuard` open‑redirect**: it redirected missing‑cookie requests to the client‑controlled `Referer`. | **Fixed in this repo** — redirects to the configured Plane URL; rejects malformed tokens. |
| 4 | low | **CORS/redirect keyed on the (formerly unbound) path tenant.** | Closed by fix #1 (config now follows the session tenant). |

### To confirm with a human (the no‑leak conclusion rests on these)

- Gauzy's JWT trust is sound (no `alg:none`/algorithm‑confusion; `JWT_SECRET` correctly configured;
  token expiry enforced upstream — the proxy edge decodes but does not fully verify in standalone
  mode).
- No route other than `email-check` consumes the path‑tenant's `apiKey`/`clientUrls` for an
  authorization decision (add a guard so it stays that way).
- No admin/settings write path can persist a **tenant‑controlled** `externalBaseApiUrl` (today it's
  host‑hardcoded in `getConfigForTenant`); a tenant‑settable upstream URL would reopen an
  SSRF/token‑exfil angle.

### Operational hardening

- Register **exactly** the origins you serve from as the Plane URLs in Gauzy (they become the CORS
  allow‑list). Serve everything over **HTTPS** (the session cookie is `Secure`).
- Keep the Plane UI and the Gauzy API under one **registrable domain** (`gauzy.co`) so the session
  cookie stays same‑site; cross‑registrable‑domain hosting needs `SameSite=None; Secure`.
