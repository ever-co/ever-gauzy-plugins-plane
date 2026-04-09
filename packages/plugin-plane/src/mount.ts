import * as http from 'http';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { PlaneProxyModule } from './plane-proxy.module';
import { PlanePluginOptions, ResolveConfigFn, ExtractTenantIdFn } from './plane-plugin-options.interface';
import { PlaneConfigRegistry } from './plane-config.registry';

const DEFAULT_CACHE_TTL = 60_000; // 60 seconds

export interface MountPlaneProxyOptions extends Partial<PlanePluginOptions> {
	/** URL prefix under which the proxy is mounted. Default: '/api/plane' */
	prefix?: string;

	/**
	 * Per-request configuration resolver for multi-tenant deployments.
	 *
	 * When provided, this callback is invoked for each incoming request to
	 * resolve the tenant's apiKey, apiSecret, clientUrls, etc. from the
	 * host application's database.
	 *
	 * When omitted, the proxy uses the static options / env vars (single-tenant
	 * or standalone mode).
	 */
	resolveConfig?: ResolveConfigFn;

	/**
	 * Extracts a tenant identifier from the raw request.
	 * Used as the cache key so that `resolveConfig` is not called on every
	 * single request. Typical implementations read a header, cookie, or the
	 * Origin header.
	 *
	 * Required when `resolveConfig` is provided and caching is desired.
	 * If omitted, `resolveConfig` is called on every request (no caching).
	 */
	extractTenantId?: ExtractTenantIdFn;

	/**
	 * How long (in ms) to cache the result of `resolveConfig` per tenant.
	 * Default: 60 000 (60 seconds). Set to 0 to disable caching entirely.
	 * Only effective when both `resolveConfig` and `extractTenantId` are provided.
	 */
	cacheTtl?: number;
}

export interface MountPlaneProxyResult {
	shutdown: () => Promise<void>;
}

interface CacheEntry {
	config: PlanePluginOptions;
	expiresAt: number;
}

/**
 * Mounts the Plane proxy on an existing Node.js HTTP server.
 *
 * This is the single entry-point consumers need to call. It:
 *   1. Intercepts the HTTP server for requests matching `prefix`
 *   2. Handles CORS (including OPTIONS preflight) for Plane UI origins
 *   3. Creates the Proxy NestJS app in-process (no extra port) in the background
 *   4. Strips the prefix and forwards matching requests to the Proxy handler
 *   5. When `resolveConfig` is provided, wraps each request in an AsyncLocalStorage
 *      context so all services read the correct tenant-specific configuration
 *   6. Caches resolved configs per tenant (when extractTenantId + cacheTtl are set)
 *
 * Non-matching requests pass through to the original server handler untouched.
 */
export function mountPlaneProxy(
	httpServer: http.Server,
	options?: MountPlaneProxyOptions
): MountPlaneProxyResult {
	const prefix = options?.prefix || '/api/plane';
	const resolveConfigFn = options?.resolveConfig;
	const extractTenantIdFn = options?.extractTenantId;
	const cacheTtl = options?.cacheTtl ?? DEFAULT_CACHE_TTL;

	// ── Tenant config cache ─────────────────────────────────────────────
	const configCache = new Map<string, CacheEntry>();

	async function getResolvedConfig(req: http.IncomingMessage): Promise<PlanePluginOptions> {
		if (!resolveConfigFn) {
			throw new Error('resolveConfig is not defined');
		}

		// Try cache first
		if (extractTenantIdFn && cacheTtl > 0) {
			const tenantId = extractTenantIdFn(req);
			if (tenantId) {
				const cached = configCache.get(tenantId);
				if (cached && cached.expiresAt > Date.now()) {
					return cached.config;
				}

				const config = await resolveConfigFn(req);
				configCache.set(tenantId, { config, expiresAt: Date.now() + cacheTtl });
				return config;
			}
		}

		// No tenant ID or caching disabled — always call resolveConfig
		return resolveConfigFn(req);
	}

	// ── Static fallback values (single-tenant / standalone) ─────────────
	const staticClientBaseUrl = options?.clientBaseUrl || process.env.PLANE_CLIENT_BASE_URL || 'http://localhost:3000';
	const staticClientAdminUrl = options?.clientAdminUrl || process.env.PLANE_CLIENT_ADMIN_URL || 'http://localhost:3001';
	const staticClientSpaceUrl = options?.clientSpaceUrl || process.env.PLANE_CLIENT_SPACE_URL || 'http://localhost:3002';
	const staticExternalBaseApiUrl =
		options?.externalBaseApiUrl ||
		process.env.GAUZY_API_BASE_URL ||
		`http://localhost:${process.env.API_PORT || 3000}/api`;

	const staticOrigins = new Set(
		[staticClientBaseUrl, staticClientAdminUrl, staticClientSpaceUrl].filter(Boolean)
	);

	const handlerRef: { current: ((req: any, res: any) => void) | null } = { current: null };
	let shutdownFn: (() => Promise<void>) | null = null;

	// ── 1. Intercept HTTP server immediately ────────────────────────────
	const originalListeners = httpServer.listeners('request').slice() as Function[];
	httpServer.removeAllListeners('request');

	httpServer.on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
		const url = req.url || '/';

		if (!url.startsWith(prefix)) {
			for (const listener of originalListeners) {
				listener.call(httpServer, req, res);
			}
			return;
		}

		handleProxyRequest(req, res).catch((err) => {
			console.error('[PlaneProxy] Unhandled error:', err);
			if (!res.headersSent) {
				res.writeHead(500, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ message: 'Internal proxy error' }));
			}
		});
	});

	async function handleProxyRequest(
		req: http.IncomingMessage,
		res: http.ServerResponse
	): Promise<void> {
		// ── Resolve tenant config if callback is provided ────────────
		let tenantConfig: PlanePluginOptions | undefined;
		let allowedOrigins: Set<string>;

		if (resolveConfigFn) {
			tenantConfig = await getResolvedConfig(req);
			allowedOrigins = new Set(
				[tenantConfig.clientBaseUrl, tenantConfig.clientAdminUrl, tenantConfig.clientSpaceUrl]
					.filter(Boolean) as string[]
			);
		} else {
			allowedOrigins = staticOrigins;
		}

		// ── CORS ─────────────────────────────────────────────────────
		const origin = req.headers['origin'];
		if (origin && allowedOrigins.has(origin as string)) {
			res.setHeader('Access-Control-Allow-Origin', origin);
			res.setHeader('Access-Control-Allow-Credentials', 'true');
			res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS');
			res.setHeader(
				'Access-Control-Allow-Headers',
				'Content-Type, Accept, Authorization, Cookie, X-Requested-With'
			);
		}

		if (req.method === 'OPTIONS') {
			res.writeHead(204);
			res.end();
			return;
		}

		if (!handlerRef.current) {
			res.writeHead(503, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ message: 'Plane Proxy is still initializing, please retry in a moment.' }));
			return;
		}

		// ── Strip prefix and delegate ────────────────────────────────
		req.url = (req.url || '/').replace(new RegExp(`^${prefix}`), '') || '/';

		if (tenantConfig) {
			PlaneConfigRegistry.requestStore.run(tenantConfig, () => {
				handlerRef.current!(req, res);
			});
		} else {
			handlerRef.current(req, res);
		}
	}

	// ── Logging ─────────────────────────────────────────────────────────
	const mode = resolveConfigFn ? 'multi-tenant (resolveConfig)' : 'static';
	const cacheInfo = resolveConfigFn && extractTenantIdFn && cacheTtl > 0
		? `, cache TTL: ${cacheTtl}ms`
		: resolveConfigFn ? ', no cache' : '';
	console.log(`[PlaneProxy] HTTP interceptor active for ${prefix}/* [${mode}${cacheInfo}]`);
	if (!resolveConfigFn) {
		console.log(`[PlaneProxy] Allowed origins: ${[...staticOrigins].join(', ')}`);
	}

	// ── 2. Create the Proxy handler in background ───────────────────────
	const initPromise = (async () => {
		try {
			console.log('[PlaneProxy] Creating NestJS handler (in-process)...');

			const proxyOptions: PlanePluginOptions = {
				externalBaseApiUrl: staticExternalBaseApiUrl,
				clientBaseUrl: staticClientBaseUrl,
				clientAdminUrl: staticClientAdminUrl,
				clientSpaceUrl: staticClientSpaceUrl,
				apiKey: options?.apiKey || process.env.GAUZY_API_KEY,
				apiSecret: options?.apiSecret || process.env.GAUZY_API_SECRET,
				appBaseUrl: options?.appBaseUrl || process.env.PLANE_APP_BASE_URL,
				apiToken: options?.apiToken || process.env.PLANE_API_TOKEN,
				githubAppName: options?.githubAppName || process.env.PLANE_GITHUB_APP_NAME,
				slackClientId: options?.slackClientId || process.env.PLANE_SLACK_CLIENT_ID,
				posthogKey: options?.posthogKey || process.env.PLANE_POSTHOG_KEY,
				posthogHost: options?.posthogHost || process.env.PLANE_POSTHOG_HOST
			};

			const proxyApp = await NestFactory.create(
				PlaneProxyModule.forRoot(proxyOptions),
				{ logger: ['error', 'warn', 'log'] }
			);

			proxyApp.use(json({ limit: '50mb' }));
			proxyApp.use(urlencoded({ extended: true, limit: '50mb' }));
			proxyApp.use(cookieParser());

			proxyApp.setGlobalPrefix('api/workspaces/:workspace_name', {
				exclude: [
					'auth/:authEndPoint',
					'auth/spaces/:authEndPoint',
					'api/users/me',
					'api/users/me/:slug',
					'api/users/me/workspaces/:workspace_name/project-roles',
					'api/instances',
					'api/timezones',
					'api/dashboard/:id/:dashboardEndpoint',
					'api/dashboard/:id/:dashboardEndpoint/:endPointParam',
					'api/workspace-slug-check',
					'api/workspaces',
					'api/assets/(.*)'
				]
			});

			proxyApp.useGlobalPipes(new ValidationPipe());

			await proxyApp.init();

			handlerRef.current = proxyApp.getHttpAdapter().getInstance();
			shutdownFn = () => proxyApp.close();

			console.log('[PlaneProxy] Handler READY. Default Gauzy API:', PlaneConfigRegistry.externalBaseApiUrl);
		} catch (error: any) {
			console.error('[PlaneProxy] FAILED to initialize:', error.message);
			console.error('[PlaneProxy] Stack:', error.stack);
		}
	})();

	return {
		shutdown: async () => {
			await initPromise;
			if (shutdownFn) {
				await shutdownFn();
				console.log('[PlaneProxy] Shut down.');
			}
		}
	};
}
