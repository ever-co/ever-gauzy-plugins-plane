import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { ProjectModule } from '../project/project.module';
import { IssuesModule } from '../issues/issues.module';
import { IssueLinksModule } from '../issue-links/issue-links.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { DraftIssuesModule } from '../issues/draft-issues/draft-issues.module';

@Module({
	imports: [
		RouterModule.register([{ path: '/', module: WorkspaceModule }]),
		ProjectModule,
		IssuesModule,
		IssueLinksModule,
		SubscriptionModule,
		DraftIssuesModule,
	],
	providers: [WorkspaceService],
	controllers: [WorkspaceController],
	exports: [WorkspaceService],
})
export class WorkspaceModule {}
