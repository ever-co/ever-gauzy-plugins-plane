import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { IssueViewModule } from './view.module';
import { WorkspaceIssueViewController } from './workspace-view.controller';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/views', module: WorkspaceIssueViewModule }
		]),
		IssueViewModule
	],
	controllers: [WorkspaceIssueViewController]
})
export class WorkspaceIssueViewModule {}
