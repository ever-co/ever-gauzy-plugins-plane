import * as http from 'http';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { PlaneProxyModule } from './plane-proxy.module';
import { PlanePluginOptions } from './plane-plugin-options.interface';
import { PlaneConfigRegistry } from './plane-config.registry';

/**
 * Options for mounting the Plane proxy. All fields are optional
 * and fall back to environment variables or sensible defaults.
 */
export interface MountPlaneProxyOptions extends Partial<PlanePluginOptions> {
	/** URL prefix under which the proxy is mounted. Default: '/api/plane' */
	prefix?: string;
}

export interface MountPlaneProxyResult {
	shutdown: () => Promise<void>;
}

/**
 * Mounts the Plane proxy on an existing Node.js HTTP server.
 *
 * This is the single entry-point consumers need to call. It:
 *   1. Intercepts the HTTP server for requests matching `prefix`
 *   2. Handles CORS (including OPTIONS preflight) for Plane UI origins
 *   3. Creates the Proxy NestJS app in-process (no extra port) in the background
 *   4. Strips the prefix and forwards matching requests to the Proxy handler
 *
 * Non-matching requests pass through to the original server handler untouched.
 */
export function mountPlaneProxy(
	httpServer: http.Server,
	options?: MountPlaneProxyOptions
): MountPlaneProxyResult {
	const prefix = options?.prefix || '/api/plane';

	const clientBaseUrl = options?.clientBaseUrl || process.env.PLANE_CLIENT_BASE_URL || 'http://localhost:3000';
	const clientAdminUrl = options?.clientAdminUrl || process.env.PLANE_CLIENT_ADMIN_URL || 'http://localhost:3001';
	const clientSpaceUrl = options?.clientSpaceUrl || process.env.PLANE_CLIENT_SPACE_URL || 'http://localhost:3002';
	const externalBaseApiUrl =
		options?.externalBaseApiUrl ||
		process.env.GAUZY_API_BASE_URL ||
		`http://localhost:${process.env.API_PORT || 3000}/api`;

	const clientOrigins = [clientBaseUrl, clientAdminUrl, clientSpaceUrl].filter(Boolean);
	const originsSet = new Set(clientOrigins);

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

		// CORS
		const origin = req.headers['origin'];
		if (origin && originsSet.has(origin as string)) {
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

		// Strip prefix and delegate to the Proxy's Express handler
		req.url = url.replace(new RegExp(`^${prefix}`), '') || '/';
		handlerRef.current(req, res);
	});

	console.log(`[PlaneProxy] HTTP interceptor active for ${prefix}/* (origins: ${clientOrigins.join(', ')})`);

	// ── 2. Create the Proxy handler in background ───────────────────────
	const initPromise = (async () => {
		try {
			console.log('[PlaneProxy] Creating NestJS handler (in-process)...');

			const proxyOptions: PlanePluginOptions = {
				externalBaseApiUrl,
				clientBaseUrl,
				clientAdminUrl,
				clientSpaceUrl,
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

			console.log('[PlaneProxy] Handler READY. Proxying to:', PlaneConfigRegistry.externalBaseApiUrl);
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
