import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IAdvanceAnalyticsChartResponse, ID } from '@plane-plugin/models';
import { AdvanceAnalyticsService } from './advance-analytics.service';
import { AdvanceAnalyticsChartsQueryDto } from './dto';

@ApiTags('Advance Analytics Charts')
@Controller()
export class AdvanceAnalyticsChartsController {
	constructor(
		private readonly _advanceAnalyticsService: AdvanceAnalyticsService
	) {}

	/**
	 * Get advance analytics charts data
	 * Returns chart data with configurable x_axis, y_axis, and group_by
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project advance analytics charts data' })
	@ApiResponse({
		status: 200,
		description: 'Successfully retrieved advance analytics charts'
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request'
	})
	@Get()
	async getAdvanceAnalyticsCharts(
		@Param('projectId') projectId: ID,
		@Query() query: AdvanceAnalyticsChartsQueryDto
	): Promise<IAdvanceAnalyticsChartResponse> {
		return this._advanceAnalyticsService.getAdvanceAnalyticsCharts(
			projectId,
			query
		);
	}
}
