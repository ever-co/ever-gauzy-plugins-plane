import { forwardRef, Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
	imports: [
		RouterModule.register([{ path: '/projects', module: ProjectModule }]),
		forwardRef(() => WorkspaceModule),
	],
	providers: [ProjectService],
	controllers: [ProjectController],
	exports: [ProjectService],
})
export class ProjectModule {}
