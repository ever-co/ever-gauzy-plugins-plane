import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InstancesService {
	constructor(private readonly _configService: ConfigService) {}
	getDefaultInstance() {
		return {
			id: 'f94d4bf8-35b6-4543-9b6f-ca2072a9582e',
			created_at: '2024-07-20T12:12:42.803977Z',
			updated_at: '2024-07-20T12:12:42.803992Z',
			instance_name: 'Plugin Plane',
			whitelist_emails: null,
			instance_id: '76dd75585d2c97fe6d8b17a6',
			current_version: '0.0.1',
			latest_version: null,
			product: 'plane',
			domain: '',
			last_checked_at: '2024-07-20T12:12:42.803253Z',
			namespace: null,
			is_telemetry_enabled: true,
			is_support_required: true,
			is_setup_done: true,
			is_signup_screen_visited: true,
			user_count: 29373,
			is_verified: true,
			created_by: null,
			updated_by: null,
			workspaces_exist: true
		};
	}

	getDefaultConfigs() {
		return {
			is_google_enabled: true,
			is_github_enabled: true,
			is_gitlab_enabled: false,
			is_magic_login_enabled: true,
			is_email_password_enabled: true,
			is_oidc_enabled: false,
			oidc_provider_name: '',
			is_saml_enabled: false,
			saml_provider_name: '',
			github_app_name: this._configService.get('GITHUB_APP_NAME'),
			slack_client_id: this._configService.get('SLACK_CLIENT_ID'),
			posthog_api_key: this._configService.get('POSTHOG_KEY'),
			posthog_host: this._configService.get('POSTHOG_HOST'),
			has_unsplash_configured: true,
			has_openai_configured: true,
			file_size_limit: 5242880.0,
			is_smtp_configured: true,
			admin_base_url: this._configService.get('CLIENT_ADMIN_URL'),
			space_base_url: this._configService.get('CLIENT_SPACE_URL'),
			app_base_url: this._configService.get('APP_BASE_URL')
		};
	}
}
