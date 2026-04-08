import { forwardRef, Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { AdvanceAnalyticsService } from './advance-analytics.service';
import { WorkspaceAdvanceAnalyticsController } from './workspace-advance-analytics.controller';

/**
 * Module for workspace-level advance analytics routes.
 * Provides advance-analytics and advance-analytics-charts endpoints
 * at the workspace scope (without projectId).
 */
@Module({
	imports: [forwardRef(() => ProjectModule)],
	providers: [AdvanceAnalyticsService],
	controllers: [WorkspaceAdvanceAnalyticsController],
	exports: [AdvanceAnalyticsService]
})
export class WorkspaceAdvanceAnalyticsModule {}
