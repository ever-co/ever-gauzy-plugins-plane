import { forwardRef, Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { AdvanceAnalyticsService } from './advance-analytics.service';
import { AdvanceAnalyticsController } from './advance-analytics.controller';
import { AdvanceAnalyticsStatsController } from './advance-analytics-stats.controller';
import { AdvanceAnalyticsChartsController } from './advance-analytics-charts.controller';

@Module({
	imports: [forwardRef(() => ProjectModule)],
	providers: [AdvanceAnalyticsService],
	controllers: [
		AdvanceAnalyticsController,
		AdvanceAnalyticsStatsController,
		AdvanceAnalyticsChartsController
	],
	exports: [AdvanceAnalyticsService]
})
export class AdvanceAnalyticsModule {}
