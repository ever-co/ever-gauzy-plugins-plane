import { RouterModule } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ProjectIdentifiersService } from './project-identifiers.service';
import { ProjectIdentifiersController } from './project-identifiers.controller';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/project-identifiers', module: ProjectIdentifiersModule }
		])
	],
	providers: [ProjectIdentifiersService],
	controllers: [ProjectIdentifiersController],
	exports: [ProjectIdentifiersService]
})
export class ProjectIdentifiersModule {}
