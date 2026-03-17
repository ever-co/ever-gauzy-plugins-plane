# Ever Gauzy — Plane Integration Proxy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)

A proxy API that bridges [Ever Gauzy](https://github.com/ever-co/ever-gauzy) backend services with the [Plane](https://plane.so/) project management frontend. It intercepts requests from Plane UI, transforms them to match the Gauzy API contract, forwards them, and transforms the responses back to the format Plane UI expects.

```
Plane UI  ──►  Proxy  ──►  Ever Gauzy API
              (transform request)
              (transform response)
```

The proxy can run in two modes:

| Mode | Description | Use case |
|------|-------------|----------|
| **Standalone** | Independent NestJS process on port 3300 | Development, isolated deployment |
| **Integrated** | Mounted in-process inside the Gauzy API | Production single-process deployment, multi-tenant |

---

## Published NPM Packages

| Package | Description |
|---------|-------------|
| [`@ever-gauzy/plugin-integration-plane-api`](https://www.npmjs.com/package/@ever-gauzy/plugin-integration-plane-api) | Core proxy: NestJS modules, controllers, services, transformers, and `mountPlaneProxy()` |
| [`@ever-gauzy/plugin-integration-plane-models`](https://www.npmjs.com/package/@ever-gauzy/plugin-integration-plane-models) | Shared TypeScript interfaces and models (DTOs, API response types, entity models) |

---

## Project Structure

```
ever-gauzy-plugins-plane/
├── apps/
│   └── api-plane/              # Thin standalone runner (imports bootstrap)
├── packages/
│   ├── plugin-plane/           # Core proxy (published as @ever-gauzy/plugin-integration-plane-api)
│   │   └── src/
│   │       ├── index.ts        # Public API exports
│   │       ├── main.ts         # bootstrap() for standalone mode
│   │       ├── mount.ts        # mountPlaneProxy() for integrated mode
│   │       ├── plane-proxy.module.ts     # Dynamic NestJS module (forRoot / forRootAsync)
│   │       ├── plane-config.registry.ts  # Config registry (static + per-request via AsyncLocalStorage)
│   │       ├── plane-plugin-options.interface.ts  # Configuration types + ResolveConfigFn
│   │       ├── config/         # Constants, serializers, decorators, utilities
│   │       └── modules/        # Feature modules (auth, issues, projects, etc.)
│   └── models/                 # Shared models (published as @ever-gauzy/plugin-integration-plane-models)
├── .github/workflows/
│   └── publish.yml             # NPM publish on version tags
├── turbo.json                  # Turborepo configuration
└── .env                        # Environment variables
```

---

## Quick Start (Standalone Mode)

### Prerequisites

- Node.js >= 18
- Yarn 1.22+
- A running Ever Gauzy API instance
- A Gauzy Tenant API key and secret (generated from the Gauzy admin panel)

### 1. Install dependencies

```bash
git clone https://github.com/ever-co/ever-gauzy-plugins-plane.git
cd ever-gauzy-plugins-plane
yarn install
```

### 2. Configure environment

Create a `.env` file at the project root:

```bash
# Gauzy API connection
GAUZY_API_BASE_URL=http://localhost:5500/api
GAUZY_API_KEY=your_generated_api_key
GAUZY_API_SECRET=your_generated_api_secret

# Plane UI URLs (used for CORS and redirects)
PLANE_CLIENT_BASE_URL=http://localhost:3000
PLANE_CLIENT_ADMIN_URL=http://localhost:3001
PLANE_CLIENT_SPACE_URL=http://localhost:3002
PLANE_APP_BASE_URL=http://localhost:3040

# Optional
PLANE_GITHUB_APP_NAME=
PLANE_SLACK_CLIENT_ID=
PLANE_POSTHOG_KEY=
PLANE_POSTHOG_HOST=
```

### 3. Build and run

```bash
# Development (with hot reload)
yarn dev
# or
yarn start:api:dev

# Production
yarn build
yarn start:api
```

The proxy will listen on **http://localhost:3300**. Swagger docs are available at **http://localhost:3300/docs**.

### 4. Point Plane UI to the proxy

In your Plane frontend `.env`:

```bash
VITE_API_BASE_URL=http://localhost:3300
```

---

## Integration in Ever Gauzy (Single-Tenant)

When integrated, the proxy runs inside the Gauzy API process. All `/api/plane/*` requests are intercepted at the Node.js HTTP server level before reaching Gauzy's own middleware stack. No additional port is opened.

### Install the package

In your Gauzy plugin's `package.json`:

```json
{
  "dependencies": {
    "@ever-gauzy/plugin-integration-plane-api": "^0.0.3"
  }
}
```

### Create the integration module

```typescript
import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { mountPlaneProxy, MountPlaneProxyResult } from '@ever-gauzy/plugin-integration-plane-api';

@Module({})
export class PlaneIntegrationModule implements OnModuleInit, OnModuleDestroy {
  private proxyResult: MountPlaneProxyResult | null = null;

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  async onModuleInit() {
    this.proxyResult = mountPlaneProxy(
      this.httpAdapterHost.httpAdapter.getHttpServer()
    );
  }

  async onModuleDestroy() {
    await this.proxyResult?.shutdown();
  }
}
```

### Set environment variables

```bash
GAUZY_API_BASE_URL=http://localhost:5500/api
GAUZY_API_KEY=your_api_key
GAUZY_API_SECRET=your_api_secret
PLANE_CLIENT_BASE_URL=http://localhost:3000
```

### Point Plane UI to Gauzy

In your Plane frontend `.env`:

```bash
VITE_API_BASE_URL=http://localhost:5500/api/plane
```

---

## Integration in Ever Gauzy (Multi-Tenant)

In a multi-tenant deployment, each tenant configures their own Plane integration from the Gauzy UI:

1. Tenant admin navigates to **Integrations** in the Gauzy dashboard
2. Selects **Plane** and enters their Plane UI URLs
3. The system auto-generates an `apiKey` / `apiSecret` for that tenant
4. Everything is stored in the database, per-tenant

The proxy supports this through two callbacks:
- **`resolveConfig(req)`** — looks up the tenant's config from the database
- **`extractTenantId(req)`** — extracts a tenant identifier from the request (used as cache key)

The proxy caches resolved configs in memory so the database is only hit once per tenant per TTL period (default: 60 seconds).

### How it works

```typescript
import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { mountPlaneProxy, MountPlaneProxyResult } from '@ever-gauzy/plugin-integration-plane-api';
import { PlaneIntegrationConfigService } from './plane-integration-config.service';

@Module({})
export class PlaneIntegrationModule implements OnModuleInit, OnModuleDestroy {
  private proxyResult: MountPlaneProxyResult | null = null;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: PlaneIntegrationConfigService
  ) {}

  async onModuleInit() {
    this.proxyResult = mountPlaneProxy(
      this.httpAdapterHost.httpAdapter.getHttpServer(),
      {
        // Quick sync extraction — reads tenant ID from header, cookie, etc.
        extractTenantId: (req) => {
          return this.configService.extractTenantId(req);
        },

        // Async DB lookup — called only on cache miss
        resolveConfig: async (req) => {
          const tenantId = this.configService.extractTenantId(req);
          const config = await this.configService.getConfigForTenant(tenantId);

          return {
            externalBaseApiUrl: config.gauzyApiUrl,
            apiKey: config.apiKey,
            apiSecret: config.apiSecret,
            clientBaseUrl: config.planeWebUrl,
            clientAdminUrl: config.planeAdminUrl,
            clientSpaceUrl: config.planeSpaceUrl,
          };
        },

        // Cache resolved configs for 60 seconds (default)
        cacheTtl: 60_000,
      }
    );
  }

  async onModuleDestroy() {
    await this.proxyResult?.shutdown();
  }
}
```

### What happens at runtime

1. A request arrives at `/api/plane/auth/email-check` from `https://plane.tenant-a.com`
2. `extractTenantId(req)` returns `"tenant-a-uuid"` — quick, sync, no DB
3. The proxy checks its in-memory cache for `"tenant-a-uuid"`:
   - **Cache hit** (< 60s since last lookup): uses cached config, no DB call
   - **Cache miss**: calls `resolveConfig(req)`, stores result in cache
4. The resolved `PlanePluginOptions` (Tenant A's `apiKey`, `apiSecret`, `clientBaseUrl`) is stored in `AsyncLocalStorage`
5. All proxy services (`ApiFetchService`, `AuthService`, etc.) automatically read Tenant A's values via `PlaneConfigRegistry`
6. The response goes back with Tenant A's CORS headers

### Caching behavior

| Scenario | DB calls | Latency |
|----------|----------|---------|
| 1st request from Tenant A | 1 (cache miss) | ~5-10ms (DB) |
| Next 100 requests from Tenant A (within 60s) | 0 (cache hit) | ~0ms |
| Request after TTL expires | 1 (cache refresh) | ~5-10ms (DB) |
| Tenant admin updates config in Gauzy UI | Change takes effect within 60s (next cache refresh) |

Set `cacheTtl: 0` to disable caching (every request hits the DB). Omit `extractTenantId` to disable caching as well.

### Per-tenant values

| Value | Source |
|-------|--------|
| `apiKey` / `apiSecret` | Auto-generated by Gauzy when the tenant enables the Plane integration |
| `clientBaseUrl` | Entered by the tenant admin (where they host their Plane UI) |
| `clientAdminUrl` | Entered by the tenant admin |
| `clientSpaceUrl` | Entered by the tenant admin |
| `externalBaseApiUrl` | Usually the same Gauzy instance for all tenants |

### Config resolution priority

`PlaneConfigRegistry` resolves values in this order:

1. **Request-scoped** — from `resolveConfig` via `AsyncLocalStorage` (multi-tenant)
2. **Static** — from `PlaneProxyModule.forRoot(options)` set at startup
3. **Environment variables** — `GAUZY_API_KEY`, `PLANE_CLIENT_BASE_URL`, etc.
4. **Defaults** — hardcoded fallbacks

Existing standalone deployments (single-tenant, env-based) keep working with zero changes.

---

## How `mountPlaneProxy()` Works

`mountPlaneProxy(httpServer, options?)` is the single entry-point for in-process integration. It:

1. **Intercepts** the Node.js `http.Server` `request` event for URLs starting with `/api/plane`
2. If `resolveConfig` is provided, **resolves** the tenant's config (from cache or by calling the callback)
3. **Handles CORS** (including `OPTIONS` preflight) using the resolved client URLs
4. **Creates** a NestJS application in-process with `app.init()` (no `app.listen()`, no extra port)
5. **Strips** the `/api/plane` prefix and delegates to the proxy's Express handler
6. If `resolveConfig` was used, **wraps** the handler in `AsyncLocalStorage.run()` so all downstream services read the tenant's values
7. **Passes through** all non-matching requests to the original server handler (Gauzy)

Returns a `MountPlaneProxyResult` with a `shutdown()` method for graceful cleanup.

### Options

```typescript
mountPlaneProxy(httpServer, {
  // URL prefix (default: '/api/plane')
  prefix: '/api/plane',

  // Multi-tenant: resolve config per-request from database
  resolveConfig: async (req) => ({ ... }),

  // Extract tenant ID from request (used as cache key)
  extractTenantId: (req) => req.headers['x-tenant-id'] as string,

  // Cache TTL in ms (default: 60000, set 0 to disable)
  cacheTtl: 60_000,

  // Single-tenant fallbacks (used when resolveConfig is not provided):
  externalBaseApiUrl: 'http://localhost:5500/api',
  clientBaseUrl: 'http://localhost:3000',
  apiKey: '...',
  apiSecret: '...',
});
```

---

## Configuration Reference

### `PlanePluginOptions`

| Option | Env Variable | Required | Description |
|--------|-------------|----------|-------------|
| `externalBaseApiUrl` | `GAUZY_API_BASE_URL` | Yes | Base URL of the Gauzy API (e.g. `http://localhost:5500/api`) |
| `apiKey` | `GAUZY_API_KEY` | Yes | Gauzy Tenant API key (sent as `X-APP-ID` header) |
| `apiSecret` | `GAUZY_API_SECRET` | Yes | Gauzy Tenant API secret (sent as `X-API-KEY` header) |
| `clientBaseUrl` | `PLANE_CLIENT_BASE_URL` | No | Plane web app URL (default: `http://localhost:3000`) |
| `clientAdminUrl` | `PLANE_CLIENT_ADMIN_URL` | No | Plane admin app URL (default: `http://localhost:3001`) |
| `clientSpaceUrl` | `PLANE_CLIENT_SPACE_URL` | No | Plane space app URL (default: `http://localhost:3002`) |
| `appBaseUrl` | `PLANE_APP_BASE_URL` | No | URL returned in instance config responses |
| `apiToken` | `PLANE_API_TOKEN` | No | Optional API token |
| `githubAppName` | `PLANE_GITHUB_APP_NAME` | No | GitHub app name for instance config |
| `slackClientId` | `PLANE_SLACK_CLIENT_ID` | No | Slack client ID for instance config |
| `posthogKey` | `PLANE_POSTHOG_KEY` | No | PostHog analytics API key |
| `posthogHost` | `PLANE_POSTHOG_HOST` | No | PostHog host URL |

### `ResolveConfigFn`

```typescript
type ResolveConfigFn = (req: http.IncomingMessage) => PlanePluginOptions | Promise<PlanePluginOptions>;
```

Resolves the tenant's configuration. Called on cache miss (or on every request if caching is disabled). Can be sync or async.

### `ExtractTenantIdFn`

```typescript
type ExtractTenantIdFn = (req: http.IncomingMessage) => string | undefined;
```

Extracts a tenant identifier from the raw request (header, cookie, Origin, etc.). Must be sync and fast — it's called on every request to check the cache. Return `undefined` to skip caching for that request.

### Using `PlaneProxyModule` directly

For advanced use cases, the NestJS module can be imported with full control:

```typescript
// Static configuration
PlaneProxyModule.forRoot({
  externalBaseApiUrl: 'http://localhost:5500/api',
  apiKey: 'xxx',
  apiSecret: 'yyy',
  clientBaseUrl: 'http://localhost:3000',
});

// Async configuration (e.g. from database or ConfigService)
PlaneProxyModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    externalBaseApiUrl: config.get('GAUZY_API_BASE_URL'),
    apiKey: config.get('GAUZY_API_KEY'),
    apiSecret: config.get('GAUZY_API_SECRET'),
  }),
});
```

---

## Proxy Modules

The proxy covers the following Plane functionality:

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `/auth/*` | Email check, login, logout, CSRF tokens |
| Instances | `/api/instances` | Plane instance configuration |
| Users | `/api/users/me/*` | Current user profile, settings, workspaces |
| Workspaces | `/api/workspaces/*` | Workspace CRUD, members, roles |
| Projects | `/:workspace/projects/*` | Project CRUD, members, deploy boards |
| Issues | `/:workspace/projects/:id/issues/*` | Issue CRUD, bulk operations |
| States | `/:workspace/projects/:id/states/*` | Workflow states |
| Labels | `/:workspace/projects/:id/labels/*` | Issue labels |
| Cycles | `/:workspace/projects/:id/cycles/*` | Sprint/cycle management |
| Modules | `/:workspace/projects/:id/modules/*` | Project modules |
| Comments | `/:workspace/projects/:id/issues/:id/comments/*` | Issue comments |
| Reactions | `/:workspace/.../reactions/*` | Comment and issue reactions |
| Relations | `/:workspace/projects/:id/issues/:id/relations/*` | Issue dependencies |
| Links | `/:workspace/projects/:id/issues/:id/links/*` | Issue links |
| Views | `/:workspace/projects/:id/views/*` | Saved issue views |
| Pages | `/:workspace/projects/:id/pages/*` | Project pages/wiki |
| Dashboard | `/api/dashboard/*` | Dashboard widgets and stats |
| Analytics | `/:workspace/analytics/*` | Advanced analytics and charts |
| Notifications | `/:workspace/users/notifications/*` | User notifications |
| Favorites | `/:workspace/users/favorites/*` | User favorites |
| File Assets | `/api/assets/*` | File upload and retrieval |
| Invitations | `/:workspace/invitations/*` | Workspace invitations |
| Activity | `/:workspace/projects/:id/activities/*` | Activity feed |

---

## Data Transformation

The proxy translates between Gauzy and Plane data models in both directions:

**Request transformation** (Plane → Gauzy):
- `name` → `title`, `target_date` → `dueDate`, `assignee_ids` → `members`, `label_ids` → `tags`, etc.

**Response transformation** (Gauzy → Plane):
- `title` → `name`, `members` → `assignee_ids`, `dueDate` → `target_date`, etc.

Transformers are located in `packages/plugin-plane/src/config/serializers/`.

---

## Middleware Stack

1. **Cookie Parser** — Extracts cookies from incoming requests
2. **TokenMiddleware** — Reads JWT from `auth-proxy-plane-token-*` cookies and attaches it to the request
3. **WorkspaceMiddleware** — Resolves workspace context (tenant, organization) from the URL
4. **AuthGuard** — Protects routes requiring authentication (public routes are decorated with `@Public()`)

---

## Development

### Scripts

```bash
yarn dev              # Start all packages in dev mode (Turborepo)
yarn start:api:dev    # Start the proxy in dev mode with hot reload (nodemon)
yarn build            # Build all packages
yarn start:api        # Start production server
yarn lint             # Run ESLint
yarn format           # Format with Prettier
```

### Adding a new module

1. Create a new folder under `packages/plugin-plane/src/modules/`
2. Create the NestJS module, controller, and service
3. Add the module to the `FEATURE_MODULES` array in `plane-proxy.module.ts`
4. Add transformers/serializers in `packages/plugin-plane/src/config/serializers/` if needed

---

## NPM Publishing (CI/CD)

Publishing is automated via GitHub Actions (`.github/workflows/publish.yml`).

### How it works

1. Push a version tag to `main`:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
2. The workflow verifies the tag is on `main`, builds the project, and publishes both packages to NPM under the `@ever-gauzy` organization.

### Requirements

- An `NPM_TOKEN` secret in the repository settings (Granular Access Token with 2FA bypass enabled)
- The tag must be on the `main` branch

### Manual trigger

The workflow also supports `workflow_dispatch` for manual runs from the GitHub Actions UI.

---

## Technology Stack

- **Runtime**: Node.js >= 18
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.4 (strict mode)
- **HTTP Client**: Axios via `@nestjs/axios`
- **Authentication**: JWT with cookie-based storage
- **Build System**: Turborepo + Yarn workspaces
- **API Docs**: Swagger/OpenAPI (standalone mode)
- **Testing**: Jest

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## About

Developed and maintained by [Ever Co. LTD](https://ever.co).

- [Ever Gauzy](https://github.com/ever-co/ever-gauzy) — The backend platform
