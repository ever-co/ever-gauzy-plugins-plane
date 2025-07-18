import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/api/workspaces', module: WorkspacesModule }
		])
	],
	providers: [WorkspacesService],
	controllers: [WorkspacesController],
	exports: [WorkspacesService]
})
export class WorkspacesModule {}
