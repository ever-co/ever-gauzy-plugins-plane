import { PlanePluginOptions } from './plane-plugin-options.interface';

/**
 * Static configuration registry for the Plane plugin.
 *
 * Populated once at module initialization from PlanePluginOptions.
 * Falls back to process.env when no options have been set (standalone mode with ConfigModule).
 */
export class PlaneConfigRegistry {
	private static options: PlanePluginOptions | null = null;

	static initialize(options: PlanePluginOptions): void {
		PlaneConfigRegistry.options = options;
	}

	static get externalBaseApiUrl(): string {
		return PlaneConfigRegistry.options?.externalBaseApiUrl
			?? process.env.EXTERNAL_BASE_API_URL
			?? '';
	}

	static get clientBaseUrl(): string {
		return PlaneConfigRegistry.options?.clientBaseUrl
			?? process.env.CLIENT_BASE_URL
			?? 'http://localhost:3000';
	}

	static get clientAdminUrl(): string {
		return PlaneConfigRegistry.options?.clientAdminUrl
			?? process.env.CLIENT_ADMIN_URL
			?? 'http://localhost:3001';
	}

	static get clientSpaceUrl(): string {
		return PlaneConfigRegistry.options?.clientSpaceUrl
			?? process.env.CLIENT_SPACE_URL
			?? 'http://localhost:3002';
	}

	static get appBaseUrl(): string {
		return PlaneConfigRegistry.options?.appBaseUrl
			?? process.env.APP_BASE_URL
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
		return PlaneConfigRegistry.options?.apiKey ?? process.env.API_KEY;
	}

	static get apiSecret(): string | undefined {
		return PlaneConfigRegistry.options?.apiSecret ?? process.env.API_SECRET;
	}

	static get apiToken(): string | undefined {
		return PlaneConfigRegistry.options?.apiToken ?? process.env.API_TOKEN;
	}

	static get githubAppName(): string | undefined {
		return PlaneConfigRegistry.options?.githubAppName ?? process.env.GITHUB_APP_NAME;
	}

	static get slackClientId(): string | undefined {
		return PlaneConfigRegistry.options?.slackClientId ?? process.env.SLACK_CLIENT_ID;
	}

	static get posthogKey(): string | undefined {
		return PlaneConfigRegistry.options?.posthogKey ?? process.env.POSTHOG_KEY;
	}

	static get posthogHost(): string | undefined {
		return PlaneConfigRegistry.options?.posthogHost ?? process.env.POSTHOG_HOST;
	}
}
