import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
    AnalyticsType,
    ChartXAxisProperty,
    ChartYAxisMetric,
    DateFilter
} from '@plane-plugin/models';

/**
 * Query DTO for /advance-analytics endpoint
 */
export class AdvanceAnalyticsQueryDto {
	@IsOptional()
	@IsUUID()
	cycle_id?: string;

	@IsOptional()
	@IsUUID()
	module_id?: string;

	@IsOptional()
	@IsEnum(DateFilter)
	date_filter?: DateFilter;
}

/**
 * Query DTO for /advance-analytics-stats endpoint
 */
export class AdvanceAnalyticsStatsQueryDto extends AdvanceAnalyticsQueryDto {
	@IsOptional()
	@IsEnum(AnalyticsType)
	type?: AnalyticsType = AnalyticsType.WORK_ITEMS;

	@IsOptional()
	@IsString()
	project_ids?: string;
}

/**
 * Query DTO for /advance-analytics-charts endpoint
 */
export class AdvanceAnalyticsChartsQueryDto extends AdvanceAnalyticsQueryDto {
	@IsOptional()
	@IsEnum(AnalyticsType)
	type?: AnalyticsType = AnalyticsType.PROJECTS;

	@IsOptional()
	@IsEnum(ChartXAxisProperty)
	x_axis?: ChartXAxisProperty = ChartXAxisProperty.PRIORITY;

	@IsOptional()
	@IsEnum(ChartYAxisMetric)
	y_axis?: ChartYAxisMetric = ChartYAxisMetric.WORK_ITEM_COUNT;

	@IsOptional()
	@IsEnum(ChartXAxisProperty)
	group_by?: ChartXAxisProperty;

	@IsOptional()
	@IsString()
	project_ids?: string;
}
