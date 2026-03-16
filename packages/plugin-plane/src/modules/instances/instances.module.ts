import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { InstancesService } from './instances.service';
import { InstancesController } from './instances.controller';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/api/instances', module: InstancesModule }
		])
	],
	providers: [InstancesService],
	controllers: [InstancesController]
})
export class InstancesModule {}
