import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { ProjectModule } from '../project/project.module';
import { ProjectModuleModule } from '../project-module/project-module.module';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/workspaces', module: WorkspaceModule },
		]),
		ProjectModule,
		ProjectModuleModule,
	],
	providers: [WorkspaceService],
	controllers: [WorkspaceController],
	exports: [WorkspaceService],
})
export class WorkspaceModule {}
