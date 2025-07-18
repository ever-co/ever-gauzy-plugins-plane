import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { WorkspaceSlugController } from './workspace-slug.controller';

@Module({
	imports: [
		RouterModule.register([
			{ path: '/api/workspace-slug-check', module: WorkspaceSlugModule }
		])
	],
	controllers: [WorkspaceSlugController]
})
export class WorkspaceSlugModule {}
