import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { PLANE_CLIENT_BASE_URL } from './config/constants';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  	app.enableCors({
      origin: [PLANE_CLIENT_BASE_URL],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders:
        'Authorization, Language, Content-Type, Content-Language, Accept, Accept-Language, Observe',
    });

  await app.listen(3300);
}

