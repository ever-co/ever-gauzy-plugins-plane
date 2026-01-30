import { forwardRef, Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceModule } from '../workspace/workspace.module';
import { StatesModule } from '../states/states.module';
import { IssuesModule } from '../issues/issues.module';
import { IssueLabelsModule } from '../issues/issue-labels/issue-labels.module';
import { ProjectModuleModule } from '../project-module/project-module.module';
import { ProjectService } from './project.service';
import { ProjectDeployBoardsService } from './project-deploy-boards/project-deploy-boards.service';
import { ProjectController } from './project.controller';
import { SearchIssuesModule } from '../issues/search-issues/search-issues.module';
import { ProjectIdentifiersModule } from './project-identifiers/project-identifiers.module';
import { CommentsModule } from '../comments/comments.module';
import { IssueViewModule } from '../views/view.module';
import { CyclesModule } from '../cycles/cycles.module';
import { IntakeIssuesModule } from '../issues/intake-issues/intake-issues.module';
import { EmployeePropertiesModule } from '../employee-properties/employee-properties.module';
import { AdvanceAnalyticsModule } from '../advance-analytics/advance-analytics.module';

@Module({
	imports: [
		RouterModule.register([
			{
				path: '/projects',
				module: ProjectModule,
				children: [
					{ path: '/:projectId/states', module: StatesModule },
					{ path: '/:projectId/issues', module: IssuesModule },
					{ path: '/:projectId/views', module: IssueViewModule },
					{ path: '/:projectId/cycles', module: CyclesModule },
					{
						path: '/:projectId/inbox-issues',
						module: IntakeIssuesModule
					},
					{
						path: '/:projectId/search-issues',
						module: SearchIssuesModule
					},
					{
						path: '/:projectId/issue-labels',
						module: IssueLabelsModule
					},
					{
						path: '/:projectId/modules',
						module: ProjectModuleModule
					},
					{ path: '/:projectId/comments', module: CommentsModule },
					{
						path: '/:projectId/advance-analytics',
						module: AdvanceAnalyticsModule
					},
					{
						path: '/:projectId/advance-analytics-stats',
						module: AdvanceAnalyticsModule
					},
					{
						path: '/:projectId/advance-analytics-charts',
						module: AdvanceAnalyticsModule
					}
				]
			}
		]),
		forwardRef(() => WorkspaceModule),
		StatesModule,
		IssuesModule,
		IssueLabelsModule,
		ProjectIdentifiersModule,
		EmployeePropertiesModule
	],
	providers: [ProjectService, ProjectDeployBoardsService],
	controllers: [ProjectController],
	exports: [ProjectService]
})
export class ProjectModule {}
