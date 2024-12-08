import { forwardRef, Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceModule } from '../workspace/workspace.module';
import { StatesModule } from '../states/states.module';
import { IssuesModule } from '../issues/issues.module';
import { IssueLabelsModule } from '../issues/issue-labels/issue-labels.module';
import { ProjectModuleModule } from '../project-module/project-module.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { SearchIssuesModule } from '../issues/search-issues/search-issues.module';
import { ProjectIdentifiersModule } from './project-identifiers/project-identifiers.module';
import { UserFavoritesModule } from '../user-favorites/user-favorites.module';
import { CommentsModule } from '../comments/comments.module';
import { IssueViewModule } from '../views/view.module';
import { CyclesModule } from '../cycles/cycles.module';

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
					{ path: '/:projectId/comments', module: CommentsModule }
				]
			}
		]),
		forwardRef(() => WorkspaceModule),
		StatesModule,
		IssuesModule,
		IssueLabelsModule,
		ProjectIdentifiersModule,
		UserFavoritesModule
	],
	providers: [ProjectService],
	controllers: [ProjectController],
	exports: [ProjectService]
})
export class ProjectModule {}
