import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
	IAdvanceAnalyticsChartResponse,
	IAdvanceAnalyticsResponse,
	ID,
	IWorkItemInsightRow
} from '@ever-gauzy/plugin-integration-plane-models';
import { AdvanceAnalyticsService } from './advance-analytics.service';
import {
	AdvanceAnalyticsChartsQueryDto,
	AdvanceAnalyticsQueryDto,
	AdvanceAnalyticsStatsQueryDto
} from './dto';

/**
 * Controller for project-level advance analytics routes.
 * Mounted under /projects/:projectId/ via RouterModule in ProjectModule.
 */
@ApiTags('Advance Analytics')
@Controller()
export class AdvanceAnalyticsController {
	constructor(
		private readonly _advanceAnalyticsService: AdvanceAnalyticsService
	) {}

	/**
	 * Get advance analytics overview stats for a project.
	 * Returns work item counts by state group (total, started, backlog, unstarted, completed).
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project advance analytics overview' })
	@ApiResponse({ status: 200, description: 'Successfully retrieved advance analytics overview' })
	@Get('advance-analytics')
	async getAdvanceAnalytics(
		@Param('projectId') projectId: ID,
		@Query() query: AdvanceAnalyticsQueryDto
	): Promise<IAdvanceAnalyticsResponse> {
		return this._advanceAnalyticsService.getAdvanceAnalytics(projectId, query);
	}

	/**
	 * Get advance analytics stats per assignee (for table view).
	 * Returns work item counts per assignee by state group.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project advance analytics stats per assignee' })
	@ApiResponse({ status: 200, description: 'Successfully retrieved advance analytics stats' })
	@Get('advance-analytics-stats')
	async getAdvanceAnalyticsStats(
		@Param('projectId') projectId: ID,
		@Query() query: AdvanceAnalyticsStatsQueryDto
	): Promise<IWorkItemInsightRow[]> {
		return this._advanceAnalyticsService.getAdvanceAnalyticsStats(projectId, query);
	}

	/**
	 * Get advance analytics charts data.
	 * Returns chart data with configurable x_axis, y_axis, and group_by.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project advance analytics charts data' })
	@ApiResponse({ status: 200, description: 'Successfully retrieved advance analytics charts' })
	@Get('advance-analytics-charts')
	async getAdvanceAnalyticsCharts(
		@Param('projectId') projectId: ID,
		@Query() query: AdvanceAnalyticsChartsQueryDto
	): Promise<IAdvanceAnalyticsChartResponse> {
		return this._advanceAnalyticsService.getAdvanceAnalyticsCharts(projectId, query);
	}
}
