import { Module, forwardRef } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { ProjectModule } from '../project/project.module';
import { IssuesModule } from '../issues/issues.module';
import { IssueLinksModule } from '../issue-links/issue-links.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { DraftIssuesModule } from '../issues/draft-issues/draft-issues.module';
import { EmployeePropertiesModule } from '../employee-properties/employee-properties.module';
import { CyclesModule } from '../cycles/cycles.module';
import { ProjectModuleModule } from '../project-module/project-module.module';
import { IssueViewModule } from '../views/view.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { NotificationModule } from '../notification/notification.module';
import { WorkspaceAdvanceAnalyticsModule } from '../advance-analytics/workspace-advance-analytics.module';
import { StickiesModule } from '../stickies/stickies.module';

@Module({
	imports: [
		RouterModule.register([
			{
				path: '/',
				module: WorkspaceModule,
				children: [
					{
						path: '/',
						module: WorkspaceAdvanceAnalyticsModule
					},
					{
						path: '/stickies',
						module: StickiesModule
					}
				]
			}
		]),
		forwardRef(() => ProjectModule),
		IssuesModule,
		CyclesModule,
		ProjectModuleModule,
		IssueViewModule,
		IssueLinksModule,
		SubscriptionModule,
		DraftIssuesModule,
		EmployeePropertiesModule,
		DashboardModule,
		NotificationModule,
		WorkspaceAdvanceAnalyticsModule
	],
	providers: [WorkspaceService],
	controllers: [WorkspaceController],
	exports: [WorkspaceService]
})
export class WorkspaceModule {}
