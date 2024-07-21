import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3300);
}
