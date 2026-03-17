import { AsyncLocalStorage } from 'async_hooks';
import { PlanePluginOptions } from './plane-plugin-options.interface';

/**
 * Per-request store that holds the tenant-specific PlanePluginOptions
 * resolved by the host application's `resolveConfig` callback.
 *
 * In standalone mode (no resolveConfig), the store is empty and all
 * getters fall back to the static options or environment variables.
 */
const requestConfigStore = new AsyncLocalStorage<PlanePluginOptions>();

/**
 * Configuration registry for the Plane plugin.
 *
 * Resolution priority for every getter:
 *   1. Request-scoped config (AsyncLocalStorage, set per-request by mount.ts)
 *   2. Static options (set once at module init via PlaneProxyModule.forRoot)
 *   3. Environment variables
 *   4. Hardcoded defaults
 */
export class PlaneConfigRegistry {
	private static options: PlanePluginOptions | null = null;

	/** Expose the store so mount.ts can wrap each request with tenant config. */
	static get requestStore(): AsyncLocalStorage<PlanePluginOptions> {
		return requestConfigStore;
	}

	static initialize(options: PlanePluginOptions): void {
		PlaneConfigRegistry.options = options;
	}

	private static get req(): PlanePluginOptions | undefined {
		return requestConfigStore.getStore();
	}

	static get externalBaseApiUrl(): string {
		return PlaneConfigRegistry.req?.externalBaseApiUrl
			?? PlaneConfigRegistry.options?.externalBaseApiUrl
			?? process.env.GAUZY_API_BASE_URL
			?? '';
	}

	static get clientBaseUrl(): string {
		return PlaneConfigRegistry.req?.clientBaseUrl
			?? PlaneConfigRegistry.options?.clientBaseUrl
			?? process.env.PLANE_CLIENT_BASE_URL
			?? 'http://localhost:3000';
	}

	static get clientAdminUrl(): string {
		return PlaneConfigRegistry.req?.clientAdminUrl
			?? PlaneConfigRegistry.options?.clientAdminUrl
			?? process.env.PLANE_CLIENT_ADMIN_URL
			?? 'http://localhost:3001';
	}

	static get clientSpaceUrl(): string {
		return PlaneConfigRegistry.req?.clientSpaceUrl
			?? PlaneConfigRegistry.options?.clientSpaceUrl
			?? process.env.PLANE_CLIENT_SPACE_URL
			?? 'http://localhost:3002';
	}

	static get appBaseUrl(): string {
		return PlaneConfigRegistry.req?.appBaseUrl
			?? PlaneConfigRegistry.options?.appBaseUrl
			?? process.env.PLANE_APP_BASE_URL
			?? PlaneConfigRegistry.clientBaseUrl;
	}

	static get clientUrls(): string[] {
		return [
			PlaneConfigRegistry.clientBaseUrl,
			PlaneConfigRegistry.clientSpaceUrl,
			PlaneConfigRegistry.clientAdminUrl
		];
	}

	static get apiKey(): string | undefined {
		return PlaneConfigRegistry.req?.apiKey
			?? PlaneConfigRegistry.options?.apiKey
			?? process.env.GAUZY_API_KEY;
	}

	static get apiSecret(): string | undefined {
		return PlaneConfigRegistry.req?.apiSecret
			?? PlaneConfigRegistry.options?.apiSecret
			?? process.env.GAUZY_API_SECRET;
	}

	static get apiToken(): string | undefined {
		return PlaneConfigRegistry.req?.apiToken
			?? PlaneConfigRegistry.options?.apiToken
			?? process.env.PLANE_API_TOKEN;
	}

	static get githubAppName(): string | undefined {
		return PlaneConfigRegistry.req?.githubAppName
			?? PlaneConfigRegistry.options?.githubAppName
			?? process.env.PLANE_GITHUB_APP_NAME;
	}

	static get slackClientId(): string | undefined {
		return PlaneConfigRegistry.req?.slackClientId
			?? PlaneConfigRegistry.options?.slackClientId
			?? process.env.PLANE_SLACK_CLIENT_ID;
	}

	static get posthogKey(): string | undefined {
		return PlaneConfigRegistry.req?.posthogKey
			?? PlaneConfigRegistry.options?.posthogKey
			?? process.env.PLANE_POSTHOG_KEY;
	}

	static get posthogHost(): string | undefined {
		return PlaneConfigRegistry.req?.posthogHost
			?? PlaneConfigRegistry.options?.posthogHost
			?? process.env.PLANE_POSTHOG_HOST;
	}
}
