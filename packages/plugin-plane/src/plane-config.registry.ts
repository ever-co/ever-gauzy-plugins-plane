import { PlanePluginOptions } from './plane-plugin-options.interface';

/**
 * Static configuration registry for the Plane plugin.
 *
 * Populated once at module initialization from PlanePluginOptions.
 * Falls back to PLANE_* environment variables when no options have been set.
 */
export class PlaneConfigRegistry {
	private static options: PlanePluginOptions | null = null;

	static initialize(options: PlanePluginOptions): void {
		PlaneConfigRegistry.options = options;
	}

	static get externalBaseApiUrl(): string {
		return PlaneConfigRegistry.options?.externalBaseApiUrl
			?? process.env.GAUZY_API_BASE_URL
			?? '';
	}

	static get clientBaseUrl(): string {
		return PlaneConfigRegistry.options?.clientBaseUrl
			?? process.env.PLANE_CLIENT_BASE_URL
			?? 'http://localhost:3000';
	}

	static get clientAdminUrl(): string {
		return PlaneConfigRegistry.options?.clientAdminUrl
			?? process.env.PLANE_CLIENT_ADMIN_URL
			?? 'http://localhost:3001';
	}

	static get clientSpaceUrl(): string {
		return PlaneConfigRegistry.options?.clientSpaceUrl
			?? process.env.PLANE_CLIENT_SPACE_URL
			?? 'http://localhost:3002';
	}

	static get appBaseUrl(): string {
		return PlaneConfigRegistry.options?.appBaseUrl
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
		return PlaneConfigRegistry.options?.apiKey ?? process.env.GAUZY_API_KEY;
	}

	static get apiSecret(): string | undefined {
		return PlaneConfigRegistry.options?.apiSecret ?? process.env.GAUZY_API_SECRET;
	}

	static get apiToken(): string | undefined {
		return PlaneConfigRegistry.options?.apiToken ?? process.env.PLANE_API_TOKEN;
	}

	static get githubAppName(): string | undefined {
		return PlaneConfigRegistry.options?.githubAppName ?? process.env.PLANE_GITHUB_APP_NAME;
	}

	static get slackClientId(): string | undefined {
		return PlaneConfigRegistry.options?.slackClientId ?? process.env.PLANE_SLACK_CLIENT_ID;
	}

	static get posthogKey(): string | undefined {
		return PlaneConfigRegistry.options?.posthogKey ?? process.env.PLANE_POSTHOG_KEY;
	}

	static get posthogHost(): string | undefined {
		return PlaneConfigRegistry.options?.posthogHost ?? process.env.PLANE_POSTHOG_HOST;
	}
}
