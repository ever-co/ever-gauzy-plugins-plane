import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstancesModule } from './instances/instances.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [InstancesModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
