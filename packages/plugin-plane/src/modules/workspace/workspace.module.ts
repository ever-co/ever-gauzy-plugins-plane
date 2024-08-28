import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { StatesModule } from '../states/states.module';
import { IssuesModule } from '../issues/issues.module';
import { IssueLabelsModule } from '../issues/issue-labels/issue-labels.module';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/workspaces', module: WorkspaceModule },
		]),
		StatesModule,
		IssuesModule,
		IssueLabelsModule,
	],
	providers: [WorkspaceService],
	controllers: [WorkspaceController],
})
export class WorkspaceModule {}
