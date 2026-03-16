import { Injectable } from '@nestjs/common';
import { PlaneConfigRegistry } from '../../plane-config.registry';

@Injectable()
export class InstancesService {
	getDefaultInstance() {
		return {
			id: 'f94d4bf8-35b6-4543-9b6f-ca2072a9582e',
			created_at: '2024-07-20T12:12:42.803977Z',
			updated_at: '2024-07-20T12:12:42.803992Z',
			instance_name: 'Plugin Plane',
			whitelist_emails: null,
			instance_id: '75dd75585d2c97fe6d8b17b6',
			current_version: '0.0.1',
			latest_version: null,
			product: 'plane-pro',
			domain: '',
			last_checked_at: '2024-07-20T12:12:42.803253Z',
			namespace: null,
			is_telemetry_enabled: true,
			is_support_required: true,
			is_setup_done: true,
			is_signup_screen_visited: true,
			current_plan: 'PREMIUM',
			user_count: 29373,
			is_verified: true,
			created_by: null,
			updated_by: null,
			workspaces_exist: true,
			edition: 'PLANE_PROFESSIONAL',
			is_trial: false,
			plan: {
				id: 'f94d4bf8-35b6-4543-9b6f-ca2072a9582e',
				name: 'Plane Enterprise',
				plan_id: 'f94d4bf8-35b6-4543-9b6f-ca2072a9582e',
				created_at: '2024-07-20T12:12:42.803977Z',
				updated_at: '2024-07-20T12:12:42.803977Z',
				created_by: null,
				updated_by: null,
				plan_name: 'Plane Enterprise'
			},
			is_test: false
		};
	}

	getDefaultConfigs() {
		return {
			enable_signup: true,
			is_workspace_creation_disabled: false,
			is_google_enabled: true,
			is_github_enabled: true,
			is_gitlab_enabled: false,
			is_magic_login_enabled: true,
			is_email_password_enabled: true,
			is_oidc_enabled: true,
			oidc_provider_name: '',
			is_telemetry_enabled: true,
			is_support_required: true,
			is_setup_done: true,
			is_verified: true,
			is_test: false,
			is_saml_enabled: false,
			saml_provider_name: '',
			github_app_name: PlaneConfigRegistry.githubAppName,
			slack_client_id: PlaneConfigRegistry.slackClientId,
			posthog_api_key: PlaneConfigRegistry.posthogKey,
			posthog_host: PlaneConfigRegistry.posthogHost,
			has_unsplash_configured: true,
			has_openai_configured: true,
			file_size_limit: 5242880.0,
			is_smtp_configured: true,
			admin_base_url: PlaneConfigRegistry.clientAdminUrl,
			space_base_url: PlaneConfigRegistry.clientSpaceUrl,
			app_base_url: PlaneConfigRegistry.appBaseUrl
		};
	}
}
