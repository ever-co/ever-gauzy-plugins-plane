import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ID, IWorkItemInsightRow } from '@plane-plugin/models';
import { AdvanceAnalyticsService } from './advance-analytics.service';
import { AdvanceAnalyticsStatsQueryDto } from './dto';

@ApiTags('Advance Analytics Stats')
@Controller()
export class AdvanceAnalyticsStatsController {
	constructor(
		private readonly _advanceAnalyticsService: AdvanceAnalyticsService
	) {}

	/**
	 * Get advance analytics stats per assignee (for table view)
	 * Returns work item counts per assignee by state group
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project advance analytics stats per assignee' })
	@ApiResponse({
		status: 200,
		description: 'Successfully retrieved advance analytics stats'
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request'
	})
	@Get()
	async getAdvanceAnalyticsStats(
		@Param('projectId') projectId: ID,
		@Query() query: AdvanceAnalyticsStatsQueryDto
	): Promise<IWorkItemInsightRow[]> {
		return this._advanceAnalyticsService.getAdvanceAnalyticsStats(
			projectId,
			query
		);
	}
}
