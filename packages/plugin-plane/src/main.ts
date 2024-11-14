import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { CLIENT_BASE_URL } from './config/constants';

export async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('api/workspaces/:workspace_name', {
		exclude: [
			'auth/:authEndPoint',
			'api/users/me',
			'api/users/me/:slug',
			'api/instances',
			'api/dashboard/:id/:dashboardEndpoint',
			'api/dashboard/:id/:dashboardEndpoint/:endPointParam',
		], // Exclude all the routes starting with /auth, /users, /dashboard and /instances from the global prefix
	});

	app.enableCors({
		origin: [CLIENT_BASE_URL],
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		credentials: true,
		allowedHeaders:
			'Authorization, Language, Content-Type, Content-Language, Accept, Accept-Language, Observe',
	});

	await app.listen(3300);
}
