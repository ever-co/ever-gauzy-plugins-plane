import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ProjectModule } from '../project/project.module';
import { ProjectModuleService } from './project-module.service';
import { ProjectModuleController } from './project-module.controller';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/modules', module: ProjectModuleModule },
		]),
		ProjectModule,
	],
	providers: [ProjectModuleService],
	controllers: [ProjectModuleController],
	exports: [ProjectModuleService],
})
export class ProjectModuleModule {}
