import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlaneProxyModule } from '../plane-proxy.module';
import { PlanePluginOptions } from '../plane-plugin-options.interface';

/**
 * Standalone application module.
 * Used when running the proxy as an independent NestJS process (apps/api-plane).
 * Loads configuration from PLANE_* environment variables via ConfigModule.
 */
@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env', '../../.env']
		}),
		PlaneProxyModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService): PlanePluginOptions => ({
				externalBaseApiUrl: config.get<string>('GAUZY_API_BASE_URL', ''),
				clientBaseUrl: config.get<string>('PLANE_CLIENT_BASE_URL', 'http://localhost:3000'),
				clientAdminUrl: config.get<string>('PLANE_CLIENT_ADMIN_URL', 'http://localhost:3001'),
				clientSpaceUrl: config.get<string>('PLANE_CLIENT_SPACE_URL', 'http://localhost:3002'),
				appBaseUrl: config.get<string>('PLANE_APP_BASE_URL'),
				apiKey: config.get<string>('GAUZY_API_KEY'),
				apiSecret: config.get<string>('GAUZY_API_SECRET'),
				apiToken: config.get<string>('PLANE_API_TOKEN'),
				githubAppName: config.get<string>('PLANE_GITHUB_APP_NAME'),
				slackClientId: config.get<string>('PLANE_SLACK_CLIENT_ID'),
				posthogKey: config.get<string>('PLANE_POSTHOG_KEY'),
				posthogHost: config.get<string>('PLANE_POSTHOG_HOST')
			})
		})
	]
})
export class AppModule {}
