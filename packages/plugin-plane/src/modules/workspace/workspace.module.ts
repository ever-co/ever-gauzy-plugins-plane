import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { RouterModule } from '@nestjs/core';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/workspaces', module: WorkspaceModule },
		]),
	],
	providers: [WorkspaceService],
	controllers: [WorkspaceController],
})
export class WorkspaceModule {}
