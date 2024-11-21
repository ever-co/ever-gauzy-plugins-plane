import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { ProjectModule } from '../project/project.module';
import { IssuesModule } from '../issues/issues.module';
import { StatesModule } from '../states/states.module';

@Module({
	imports: [
		RouterModule.register([{ path: '/', module: WorkspaceModule }]),
		ProjectModule,
		IssuesModule,
		StatesModule,
	],
	providers: [WorkspaceService],
	controllers: [WorkspaceController],
	exports: [WorkspaceService],
})
export class WorkspaceModule {}
