import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { StatesModule } from '../states/states.module';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/workspaces', module: WorkspaceModule },
		]),
		StatesModule,
	],
	providers: [WorkspaceService],
	controllers: [WorkspaceController],
})
export class WorkspaceModule {}
