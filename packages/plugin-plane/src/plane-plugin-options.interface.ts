export const PLANE_PLUGIN_OPTIONS = Symbol('PLANE_PLUGIN_OPTIONS');

export interface PlanePluginOptions {
	/**
	 * Base URL of the Gauzy API (e.g. 'http://localhost:5500/api' or 'https://api.gauzy.co/api')
	 */
	externalBaseApiUrl: string;

	/**
	 * Gauzy API key (X-APP-ID header)
	 */
	apiKey?: string;

	/**
	 * Gauzy API secret (X-API-KEY header)
	 */
	apiSecret?: string;

	/**
	 * Plane web app URL (e.g. 'http://localhost:3000')
	 */
	clientBaseUrl?: string;

	/**
	 * Plane admin app URL (e.g. 'http://localhost:3001')
	 */
	clientAdminUrl?: string;

	/**
	 * Plane space app URL (e.g. 'http://localhost:3002')
	 */
	clientSpaceUrl?: string;

	/**
	 * App base URL returned to Plane UI instance config (e.g. 'http://localhost:3040')
	 */
	appBaseUrl?: string;

	/**
	 * Optional API token
	 */
	apiToken?: string;

	/**
	 * GitHub app name shown in Plane instance config
	 */
	githubAppName?: string;

	/**
	 * Slack client ID shown in Plane instance config
	 */
	slackClientId?: string;

	/**
	 * PostHog API key
	 */
	posthogKey?: string;

	/**
	 * PostHog host URL
	 */
	posthogHost?: string;
}

export interface PlanePluginAsyncOptions {
	imports?: any[];
	inject?: any[];
	useFactory: (...args: any[]) => Promise<PlanePluginOptions> | PlanePluginOptions;
}
