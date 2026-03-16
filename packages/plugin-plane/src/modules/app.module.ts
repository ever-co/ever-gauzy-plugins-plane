import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlaneProxyModule } from '../plane-proxy.module';
import { PlanePluginOptions } from '../plane-plugin-options.interface';

/**
 * Standalone application module.
 * Used when running the proxy as an independent NestJS process (apps/api-plane).
 * Loads configuration from environment variables via ConfigModule.
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
				externalBaseApiUrl: config.get<string>('EXTERNAL_BASE_API_URL', ''),
				clientBaseUrl: config.get<string>('CLIENT_BASE_URL', 'http://localhost:3000'),
				clientAdminUrl: config.get<string>('CLIENT_ADMIN_URL', 'http://localhost:3001'),
				clientSpaceUrl: config.get<string>('CLIENT_SPACE_URL', 'http://localhost:3002'),
				appBaseUrl: config.get<string>('APP_BASE_URL'),
				apiKey: config.get<string>('API_KEY'),
				apiSecret: config.get<string>('API_SECRET'),
				apiToken: config.get<string>('API_TOKEN'),
				githubAppName: config.get<string>('GITHUB_APP_NAME'),
				slackClientId: config.get<string>('SLACK_CLIENT_ID'),
				posthogKey: config.get<string>('POSTHOG_KEY'),
				posthogHost: config.get<string>('POSTHOG_HOST')
			})
		})
	]
})
export class AppModule {}
