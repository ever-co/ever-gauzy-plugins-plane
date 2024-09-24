import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { ProjectModule } from '../project/project.module';

@Module({
	imports: [
		RouterModule.register([{ path: '/', module: WorkspaceModule }]),
		ProjectModule,
	],
	providers: [WorkspaceService],
	controllers: [WorkspaceController],
	exports: [WorkspaceService],
})
export class WorkspaceModule {}
