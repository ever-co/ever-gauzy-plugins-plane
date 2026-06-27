# Deploying the Plane UIs on Kubernetes (connected to Ever Gauzy)

> End‑to‑end guide for running the **Plane Web, Admin (God Mode) and Space** front‑ends in a
> Kubernetes cluster, wired to an **Ever Gauzy** backend through the in‑process
> [`@ever-gauzy/plugin-integration-plane-api`](../../README.md) proxy.
>
> The worked example uses the public Gauzy Cloud API at **`https://api.gauzy.co`** and the cluster
> **`k8s-gauzy`**. Everything is parameterised, so the same scripts deploy against a **self‑hosted**
> Gauzy API just by changing a few variables. **No secrets are committed** — credentials are
> generated per tenant inside Gauzy and injected at deploy time.

---

## TL;DR

There are **two modes** (§2): **shared** (one global deployment Ever runs for all tenants) and
**custom** (a tenant self‑hosts its own). Both use the same steps below — only `MODE` differs.

```bash
cd deploy/kubernetes
cp .env.example .env && $EDITOR .env      # set MODE, GAUZY_API_URL (+ TENANT_ID for custom), hosts, registry…
./build-images.sh                          # build & push web/space/(admin)/(live) images
./deploy.sh                                # envsubst the manifests and kubectl apply
```

You end up with the Plane UI live at `https://plane.gauzy.co`, talking to
`https://api.gauzy.co/api/plane` (shared) or `…/api/plane/<TENANT_ID>` (custom), authenticating
against your Gauzy tenant.

---

## 1. How the pieces fit together

```
        Browser
          │   https://plane.gauzy.co            (static SPA + SSR, in YOUR cluster)
          ▼
 ┌─────────────────────────┐
 │  Plane front-ends (k8s)  │   web (/)   admin (/god-mode)   space (/spaces)   [live (/live)]
 └─────────────────────────┘
          │   XHR/fetch to VITE_API_BASE_URL
          │   https://api.gauzy.co/api/plane/<TENANT_ID>/...
          ▼
 ┌─────────────────────────────────────────────┐
 │  Ever Gauzy API  (api.gauzy.co)              │
 │  ├─ mountPlaneProxy()  ── /api/plane/*       │  ← the proxy in THIS repo, in-process
 │  │     • reads <TENANT_ID> from the path     │
 │  │     • loads that tenant's Plane config    │
 │  │     • translates Plane ⇄ Gauzy            │
 │  └─ Gauzy core (REST, auth, multi-tenant DB) │
 └─────────────────────────────────────────────┘
```

The key idea: **the proxy replaces Plane's own backend.** You do **not** deploy Plane's Django API,
Postgres, Redis, RabbitMQ, MinIO, or workers. The proxy emulates every REST surface the front‑ends
call at boot (`/api/instances`, `/api/users/me/*`, `/api/workspaces/*`, projects, issues, pages,
dashboard, analytics, file assets), and file uploads are tunnelled to Gauzy's `image-assets`
endpoint, so **no object store is required** either.

| Plane component | Run it? | Why |
|---|---|---|
| **web** (SPA) | ✅ required | The main app UI |
| **space** (SSR) | ✅ recommended | Public/published views; it is a Node SSR server, not static |
| **admin** ("God Mode") | ⬜ optional | Instance‑admin panel; rarely needed with the proxy |
| **live** (collab) | ⬜ optional | Realtime co‑editing of Pages; **needs Redis** if enabled |
| api / worker / beat / postgres / redis / rabbitmq / minio | ❌ **do not run** | Replaced by the Gauzy proxy + Gauzy API + Gauzy DB |

---

## 2. Two modes: shared vs custom (pick before you build)

A Gauzy tenant uses Plane in one of two ways, chosen in the Gauzy integration settings:

| | **Shared** (`MODE=shared`) | **Custom / self‑hosted** (`MODE=custom`) |
|---|---|---|
| Who deploys the UIs | **Ever**, once, globally | the tenant, in its own cluster |
| Plane build | tenant‑agnostic — `VITE_API_BASE_URL=https://api.gauzy.co/api/plane` (no UUID) | per‑tenant — `…/api/plane/{tenantId}` |
| Tenant resolved from | the **logged‑in session** (JWT cookie) | the **UUID in the URL path** |
| One deployment serves | **all** tenants | exactly **one** tenant |
| In the Gauzy UI | tenant just clicks **Enable** (URLs are the global ones, read‑only) | tenant enters its own URLs |

**Why the modes differ — Plane bakes config at _build time_.** Plane's front‑ends are Vite apps;
every `VITE_*` value is frozen into the JS bundle during `docker build` (`define: process.env`) —
**there is no runtime env injection.** So a build carries exactly one `VITE_API_BASE_URL`:

- include a tenant UUID → that image only ever talks for **that** tenant (custom), and
- omit it → the proxy learns the tenant another way: from the **session** after login. The security
  fix makes the session JWT authoritative, so one tenant‑agnostic image works for **everyone**
  (shared).

**This guide builds whichever you need** via `MODE` in `.env`. Self‑hosting for one tenant →
`MODE=custom`. Standing up the global `plane.gauzy.co` for the whole platform → `MODE=shared`. The
k8s manifests, topologies and TLS below are **identical** for both — only the baked
`VITE_API_BASE_URL` (and whether you pass a `TENANT_ID`) differ.

> How login/SSO works on the shared deployment, and what "Enable" vs "Connect" means per tenant, is
> in [`docs/shared-multi-tenant-plane-sso.md`](../../docs/shared-multi-tenant-plane-sso.md).

---

## 3. Prerequisites

- A Kubernetes cluster and `kubectl` context (the example uses DigitalOcean `do-sfo2-k8s-gauzy`,
  cluster `k8s-gauzy`).
- An **ingress controller** (`ingressClassName: nginx` in the example).
- A container registry you can push to (example: `registry.digitalocean.com/ever`).
- Docker/BuildKit, and a checkout of the **Plane** source you build from
  (`git clone https://github.com/makeplane/plane` or your fork).
- DNS you control for the host(s) you will use (`plane.gauzy.co`, …).
- A **TLS strategy**. The `k8s-gauzy` cluster does **not** run cert‑manager — TLS secrets are
  pre‑created (`kubectl create secret tls <host>-tls …`). If your cluster has cert‑manager, you can
  use it instead (see [§7](#7-tls)).
- A running **Ever Gauzy** API (Gauzy Cloud `https://api.gauzy.co`, or your self‑hosted instance)
  with the **Plane integration plugin** enabled (`IntegrationPlanePlugin` is registered in
  `apps/api/src/plugins.ts`).

---

## 4. Step 1 — Configure the Plane integration in Gauzy (get your `TENANT_ID`)

The Plane integration is configured **per tenant** through Gauzy's REST API (or the Integrations UI
in the Gauzy dashboard → **Plane**).

- **Shared mode:** the tenant just **enables** Plane — the URLs are the global ones (shown
  read‑only) and there is nothing to build or host. Open the global URL and sign in; skip to §9.
- **Custom mode (below):** register the tenant's own URLs. This mints the per‑tenant API credentials
  the proxy uses and sets the CORS origins, and is where you get the `TENANT_ID` for the build.

Authenticate to Gauzy as a tenant admin (you need `INTEGRATION_ADD`), then:

```bash
# 4a. Find your tenant id (it goes into VITE_API_BASE_URL). Any authenticated call exposes it,
#     e.g. decode your access token, or read it from /api/auth/... — it is the `tenantId` claim.

# 4b. Configure Plane for your tenant — registers the UI URLs and auto-generates apiKey/apiSecret.
curl -X POST https://api.gauzy.co/api/integration/plane/setup \
  -H "Authorization: Bearer $GAUZY_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "planeWebUrl":   "https://plane.gauzy.co",
        "planeAdminUrl": "https://plane.gauzy.co",
        "planeSpaceUrl": "https://plane.gauzy.co"
      }'
# → { "integrationTenantId": "...", "apiKey": "...", "apiSecret": "..." }   (shown once)
```

Notes:
- `planeWebUrl` / `planeAdminUrl` / `planeSpaceUrl` are the **origins** the proxy will return in
  `Access-Control-Allow-Origin`. They must exactly match the scheme+host you serve the UIs from
  (path is irrelevant for CORS). For the single‑host topology, all three are
  `https://plane.gauzy.co`; for subdomains, set them to `https://plane.gauzy.co`,
  `https://plane-admin.gauzy.co`, `https://plane-space.gauzy.co`.
- The returned `apiKey`/`apiSecret` are stored server‑side and used by the proxy to talk to Gauzy;
  **you never put them in the Plane build or in k8s.** Keep them only if you want to inspect them.
- Other endpoints: `GET /settings`, `PUT /settings` (change URLs), `POST /regenerate-key`,
  `GET /status`, `DELETE /:integrationTenantId`.

The `tenantId` you pass into `VITE_API_BASE_URL` is your Gauzy tenant's UUID.

---

## 5. Step 2 — Choose a topology

### Topology A — single host, path‑routed (recommended, uses stock builds)

One hostname, Plane's native layout. Web at `/`, space at `/spaces`, admin at `/god-mode`,
live at `/live`. The **only** non‑default build arg is `VITE_API_BASE_URL`.

```
https://plane.gauzy.co/            → web
https://plane.gauzy.co/spaces      → space
https://plane.gauzy.co/god-mode    → admin   (optional)
https://plane.gauzy.co/live        → live    (optional)
            └── all API/auth calls go cross-origin to https://api.gauzy.co/api/plane/<TID>
```

CORS: register all three Gauzy URLs as `https://plane.gauzy.co` (one origin).

### Topology B — three subdomains (what you asked about)

`plane.gauzy.co`, `plane-admin.gauzy.co`, `plane-space.gauzy.co`. The Gauzy integration stores three
distinct URLs precisely so each can be its own origin. The catch: Plane's admin/space images are
built to live under `/god-mode` and `/spaces`. Two ways to get subdomains:

- **B1 (no rebuild):** keep the default builds; serve admin at `plane-admin.gauzy.co/god-mode`
  and space at `plane-space.gauzy.co/spaces`, and add an ingress **redirect** from `/` → the app
  path. Only the **web** image needs the cross‑app URLs baked in
  (`VITE_ADMIN_BASE_URL=https://plane-admin.gauzy.co`, `VITE_SPACE_BASE_URL=https://plane-space.gauzy.co`,
  `VITE_LIVE_BASE_URL=https://plane-live.gauzy.co`, keeping the default `*_BASE_PATH`s).
- **B2 (serve at root):** rebuild admin/space with `VITE_ADMIN_BASE_PATH=/` / `VITE_SPACE_BASE_PATH=/`
  **and** adjust the admin Dockerfile's nginx `COPY` target (it hardcodes `html/god-mode`) so files
  are served from `/`. More work; only do this if clean root URLs matter.

This guide ships manifests for **A** (`manifests/50-ingress.yaml`) and **B1**
(`manifests/51-ingress-subdomains.yaml`). Set `TOPOLOGY=single` or `TOPOLOGY=subdomains` in `.env`.

---

## 6. Step 3 — Build & push the images

`build-images.sh` builds each app from your Plane checkout with the correct `VITE_*` build args and
pushes to your registry. For `MODE=custom` the tenant UUID is baked in here; for `MODE=shared` it is
omitted (the tenant comes from the session).

```bash
# .env (excerpt)
PLANE_SRC=/path/to/plane                       # your Plane checkout
GAUZY_API_URL=https://api.gauzy.co             # self-hosted: https://api.your-co.com
MODE=custom                                    # custom (per-tenant) | shared (global, tenant-agnostic)
TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx # required for MODE=custom; leave empty for MODE=shared
IMAGE_REGISTRY=registry.digitalocean.com/ever
IMAGE_TAG=tenant-acme-1                          # custom: per-tenant + version; shared: just a version
TOPOLOGY=single                                  # or: subdomains
PLANE_HOST=plane.gauzy.co
PLANE_ADMIN_HOST=plane-admin.gauzy.co            # used only when TOPOLOGY=subdomains
PLANE_SPACE_HOST=plane-space.gauzy.co
PLANE_LIVE_HOST=plane-live.gauzy.co
DEPLOY_ADMIN=false
DEPLOY_LIVE=false
LIVE_SERVER_SECRET_KEY=                          # required only if DEPLOY_LIVE=true
```

```bash
./build-images.sh            # builds web (+ space, +admin/live if enabled), tags, pushes
```

The single most important value it bakes depends on `MODE`:

```
MODE=custom   →  VITE_API_BASE_URL = ${GAUZY_API_URL}/api/plane/${TENANT_ID}
MODE=shared   →  VITE_API_BASE_URL = ${GAUZY_API_URL}/api/plane     (no tenant; resolved from the session)
```

> ⚠️ Because `VITE_API_BASE_URL` is build‑time: in **custom** mode a new tenant or API host means a
> new image build (use a per‑tenant `IMAGE_TAG`); in **shared** mode you build **once** for the whole
> platform. For shared, also point the proxy's default config at the shared origins + a global
> app‑level API key — see
> [`docs/shared-multi-tenant-plane-sso.md`](../../docs/shared-multi-tenant-plane-sso.md#what-each-mode-needs-implementation-checklist).

---

## 7. Step 4 — TLS

The example cluster has **no cert‑manager**; create the TLS secret(s) imperatively (this is the
house pattern, mirroring `api.gauzy.co-tls`):

```bash
kubectl -n "$PLANE_NAMESPACE" create secret tls plane.gauzy.co-tls \
  --cert=plane.gauzy.co.crt --key=plane.gauzy.co.key
```

If your cluster **does** run cert‑manager, set `CERT_MANAGER_ISSUER=letsencrypt-prod` in `.env`;
`deploy.sh` will add the `cert-manager.io/cluster-issuer` annotation and let it provision the cert
(then you can skip the manual secret). A wildcard `*.gauzy.co` cert also works for subdomains.

---

## 8. Step 5 — Deploy

```bash
./deploy.sh          # envsubst over manifests/*.yaml → kubectl apply ; then rollout restart
```

`deploy.sh` renders the manifests (namespace, Deployments, Services, Ingress) substituting your
`.env` values, applies them, and triggers a rollout so the new image is pulled.

What gets created (Topology A, defaults):

- `Namespace/plane`
- `Deployment/plane-web` + `Service/plane-web` (nginx static, port 3000, 2 replicas)
- `Deployment/plane-space` + `Service/plane-space` (Node SSR, port 3000)
- *(optional)* `plane-admin`, `plane-live` (+ `plane-redis` for live)
- `Ingress/plane` routing `/ → web`, `/spaces → space`, `/god-mode → admin`, `/live → live`

---

## 9. Step 6 — Verify

```bash
kubectl -n plane get pods,svc,ingress
# Boot path the SPA hits first — should return JSON from the proxy, with CORS for your host:
curl -sS -H "Origin: https://plane.gauzy.co" \
  https://api.gauzy.co/api/plane/$TENANT_ID/api/instances/ -i | head -n 20
```

Then open `https://plane.gauzy.co`, sign in with your Gauzy credentials, and confirm projects/issues
load. If you enabled **live**, open a Page and confirm realtime editing (no "sync error" banner).

---

## 10. Security model (what the tenant UUID does and does **not** protect)

**The `<TENANT_ID>` in the URL is a routing/config selector, not a credential.** It is not secret —
it lives in the bundle, the URL, and access logs by design. Knowing another tenant's UUID does
**not** grant access to their data:

- Every data call the proxy makes to Gauzy is authenticated with the **signed** user JWT
  (`auth-proxy-plane-token-*` cookie). Gauzy derives the tenant from the **verified token**
  (`jwt.strategy.ts` → `RequestContext.currentTenantId() = user.tenantId`) and force‑scopes every
  query to it (`TenantAwareCrudService`). A request carrying tenant A's JWT but pointed at tenant
  B's UUID returns **A's** data, never B's.
- The only credential that *would* grant tenant‑scoped access (`apiKey`/`apiSecret`,
  `X-APP-ID`/`X-API-KEY`) is stored server‑side and used only by the proxy's `email-check`
  bootstrap; it is never exposed by the UUID.

Hardening shipped/relevant here:
- The proxy now binds the **path tenant to the authenticated session** — the session JWT's
  `tenantId` overrides the path UUID, closing a confused‑deputy where a logged‑in user drives
  another tenant's resolved config. (See `plane-proxy.service.ts`.)
- The proxy `AuthGuard` no longer open‑redirects to the client `Referer` header.

Operational guidance:
- Register **exactly** the origins you serve from as the Plane URLs in Gauzy — the proxy reflects
  those in CORS. Don't add origins you don't control.
- Always serve the UIs over **HTTPS** (the session cookie is `Secure; SameSite` ).
- `plane.gauzy.co` and `api.gauzy.co` share the registrable domain `gauzy.co`, so the session cookie
  is **same‑site**. If a tenant self‑hosts Plane on a *different* registrable domain than its Gauzy
  API, the cross‑site cookie needs `SameSite=None; Secure` — keep API and UI under one parent domain
  to avoid this.

Full analysis (and the residual low‑severity items — `email-check` enumeration, etc.) is in
[`docs/shared-multi-tenant-plane-sso.md`](../../docs/shared-multi-tenant-plane-sso.md#security).

---

## 11. Self‑hosted Gauzy

Nothing changes except the API host. In `.env` set `GAUZY_API_URL=https://api.your-co.com`, register
your Plane URLs via `https://api.your-co.com/api/integration/plane/setup`, rebuild (the API host is
baked), and deploy. The proxy runs in‑process inside *your* Gauzy API — there is no separate proxy
pod to deploy.

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| CORS error in browser console | Registered Plane URL ≠ the origin you serve from | `PUT /api/integration/plane/settings` with the exact origin; redeploy not needed |
| 401 loop / can't stay logged in | Cross‑site cookie blocked | Keep UI + API under one registrable domain, serve HTTPS |
| Changing a URL/tenant didn't take effect | `VITE_*` is build‑time | Rebuild the image; bump `IMAGE_TAG` |
| `:latest` image not updating | Spec unchanged → no pull | Use immutable tags, or `kubectl rollout restart` (deploy.sh does this) |
| Pages editor shows "sync error" | `live` not deployed/reachable | Deploy `live` (+Redis) or accept no realtime collab |
| `live` pod crashloops on boot | Missing `REDIS_URL` or `LIVE_SERVER_SECRET_KEY` | Set both; live's Redis hocuspocus extension throws without a client |
| admin/space 404 at subdomain root | Default build serves `/god-mode`,`/spaces` | Use the redirect (Topology B1) or rebuild at root (B2) |

---

## 13. Files in this directory

| File | Purpose |
|---|---|
| `.env.example` | All the knobs; copy to `.env` |
| `build-images.sh` | Build & push web/space/(admin)/(live) with the right `VITE_*` args |
| `deploy.sh` | `envsubst` the manifests and `kubectl apply` + rollout |
| `manifests/00-namespace.yaml` | Namespace |
| `manifests/10-web.yaml` | web Deployment + Service |
| `manifests/20-space.yaml` | space (SSR) Deployment + Service |
| `manifests/30-admin.yaml` | admin Deployment + Service (optional) |
| `manifests/40-live.yaml` | live + Redis (optional) |
| `manifests/50-ingress.yaml` | Topology A — single host, path‑routed |
| `manifests/51-ingress-subdomains.yaml` | Topology B1 — three subdomains |

> The exact `VITE_*` build args (and how they differ per `MODE`/`TOPOLOGY`) are inline in
> `build-images.sh`. The shared‑vs‑custom modes, login/SSO, and security model are in
> [`docs/shared-multi-tenant-plane-sso.md`](../../docs/shared-multi-tenant-plane-sso.md).
