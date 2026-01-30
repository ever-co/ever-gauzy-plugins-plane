import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
    IAdvanceAnalyticsResponse,
    ID
} from '@plane-plugin/models';
import { AdvanceAnalyticsService } from './advance-analytics.service';
import {
    AdvanceAnalyticsQueryDto
} from './dto';

@ApiTags('Advance Analytics')
@Controller()
export class AdvanceAnalyticsController {
	constructor(
		private readonly _advanceAnalyticsService: AdvanceAnalyticsService
	) {}

	/**
	 * Get advance analytics overview stats for a project
	 * Returns work item counts by state group (total, started, backlog, unstarted, completed)
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project advance analytics overview' })
	@ApiResponse({
		status: 200,
		description: 'Successfully retrieved advance analytics overview'
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request'
	})
	@Get()
	async getAdvanceAnalytics(
		@Param('projectId') projectId: ID,
		@Query() query: AdvanceAnalyticsQueryDto
	): Promise<IAdvanceAnalyticsResponse> {
		return this._advanceAnalyticsService.getAdvanceAnalytics(projectId, query);
	}
}
