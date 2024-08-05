import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { InstancesService } from './instances.service';
import { InstancesController } from './instances.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    RouterModule.register([{ path: '/instances', module: InstancesModule }]),
  ],
  providers: [InstancesService, ConfigService],
  controllers: [InstancesController],
})
export class InstancesModule {}
