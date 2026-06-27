import { forwardRef, Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { AdvanceAnalyticsService } from './advance-analytics.service';
import { AdvanceAnalyticsController } from './advance-analytics.controller';

/**
 * Module for project-level advance analytics routes.
 * Provides advance-analytics, advance-analytics-stats, and advance-analytics-charts
 * endpoints under /projects/:projectId/.
 */
@Module({
	imports: [forwardRef(() => ProjectModule)],
	providers: [AdvanceAnalyticsService],
	controllers: [AdvanceAnalyticsController],
	exports: [AdvanceAnalyticsService]
})
export class AdvanceAnalyticsModule {}
