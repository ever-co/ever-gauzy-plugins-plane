import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { PlaneConfigRegistry } from './plane-config.registry';

export async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS for the client URLs
	app.enableCors({
		origin: PlaneConfigRegistry.clientUrls,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
	});

	app.use(cookieParser());
	app.setGlobalPrefix('api/workspaces/:workspace_name', {
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

	const config = new DocumentBuilder()
		.setTitle('Plane Plugin API')
		.setDescription('The Plane Plugin API description')
		.setVersion('1.0')
		.addTag('plane-plugin')
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document);

	app.useGlobalPipes(new ValidationPipe());

	await app.listen(3300);
}
