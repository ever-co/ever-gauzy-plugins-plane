import { Module } from '@nestjs/common';
import { ProjectModuleService } from './project-module.service';
import { ProjectModuleController } from './project-module.controller';
import { RouterModule } from '@nestjs/core';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/modules', module: ProjectModuleModule },
		]),
	],
	providers: [ProjectModuleService],
	controllers: [ProjectModuleController],
	exports: [ProjectModuleService],
})
export class ProjectModuleModule {}
