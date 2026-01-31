import { forwardRef, Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { AdvanceAnalyticsService } from './advance-analytics.service';
import {
    AdvanceAnalyticsController,
    AdvanceAnalyticsStatsController,
    AdvanceAnalyticsChartsController
} from './advance-analytics.controller';

/**
 * Module for advance-analytics route
 */
@Module({
	imports: [forwardRef(() => ProjectModule)],
	providers: [AdvanceAnalyticsService],
	controllers: [AdvanceAnalyticsController],
	exports: [AdvanceAnalyticsService]
})
export class AdvanceAnalyticsModule {}

/**
 * Module for advance-analytics-stats route
 */
@Module({
	imports: [forwardRef(() => ProjectModule)],
	providers: [AdvanceAnalyticsService],
	controllers: [AdvanceAnalyticsStatsController],
	exports: [AdvanceAnalyticsService]
})
export class AdvanceAnalyticsStatsModule {}

/**
 * Module for advance-analytics-charts route
 */
@Module({
	imports: [forwardRef(() => ProjectModule)],
	providers: [AdvanceAnalyticsService],
	controllers: [AdvanceAnalyticsChartsController],
	exports: [AdvanceAnalyticsService]
})
export class AdvanceAnalyticsChartsModule {}
