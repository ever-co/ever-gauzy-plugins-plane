import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { PlaneConfigRegistry } from './plane-config.registry';
import { RequestContextService } from './request-context';

export async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS for the client URLs
	app.enableCors({
		origin: PlaneConfigRegistry.clientUrls,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
	});

	// Wrap every request in AsyncLocalStorage for per-request token & workspace isolation.
	// This MUST be registered before cookieParser / TokenMiddleware so the store
	// is already active when downstream middleware writes to it.
	app.use((_req: Request, _res: Response, next: NextFunction) => {
		RequestContextService.store.run(RequestContextService.createContext(), () => {
			next();
		});
	});

	app.use(cookieParser());
	app.use(json({ limit: '50mb' }));
	app.use(urlencoded({ extended: true, limit: '50mb' }));
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
