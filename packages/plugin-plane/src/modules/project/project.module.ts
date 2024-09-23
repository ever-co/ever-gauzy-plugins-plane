import { forwardRef, Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceModule } from '../workspace/workspace.module';
import { IssuesModule } from '../issues/issues.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({
	imports: [
		RouterModule.register([
			{
				path: '/projects',
				module: ProjectModule,
				children: [
					{ path: '/:projectId/issues', module: IssuesModule },
				],
			},
		]),
		forwardRef(() => WorkspaceModule),
		IssuesModule,
	],
	providers: [ProjectService],
	controllers: [ProjectController],
	exports: [ProjectService],
})
export class ProjectModule {}
