import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { StatesModule } from '../states/states.module';
import { IssuesModule } from '../issues/issues.module';
import { IssueLabelsModule } from '../issues/issue-labels/issue-labels.module';
import { ProjectModule } from '../project/project.module';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/workspaces', module: WorkspaceModule },
		]),
		IssueLabelsModule,
		IssuesModule,
		ProjectModule,
		StatesModule,
	],
	providers: [WorkspaceService],
	controllers: [WorkspaceController],
	exports: [WorkspaceService],
})
export class WorkspaceModule {}
