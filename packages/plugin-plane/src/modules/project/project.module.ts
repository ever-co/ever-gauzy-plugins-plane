import { forwardRef, Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceModule } from '../workspace/workspace.module';
import { StatesModule } from '../states/states.module';
import { IssuesModule } from '../issues/issues.module';
import { IssueLabelsModule } from '../issues/issue-labels/issue-labels.module';
import { ProjectModuleModule } from '../project-module/project-module.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({
	imports: [
		RouterModule.register([
			{
				path: '/projects',
				module: ProjectModule,
				children: [
					{ path: '/:projectId/states', module: StatesModule },
					{ path: '/:projectId/issues', module: IssuesModule },
					{
						path: '/:projectId/issue-labels',
						module: IssueLabelsModule,
					},
					{
						path: '/:projectId/modules',
						module: ProjectModuleModule,
					},
				],
			},
		]),
		forwardRef(() => WorkspaceModule),
		StatesModule,
		IssuesModule,
		IssueLabelsModule,
		// ProjectModuleModule,
	],
	providers: [ProjectService],
	controllers: [ProjectController],
	exports: [ProjectService],
})
export class ProjectModule {}
