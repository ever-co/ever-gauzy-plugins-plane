import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdvanceAnalyticsService } from './advance-analytics.service';
import {
	AdvanceAnalyticsChartsQueryDto,
	AdvanceAnalyticsQueryDto
} from './dto';

/**
 * Controller for workspace-level advance analytics routes.
 * Mounted under /workspaces/:workspace_name/ via RouterModule in WorkspaceModule.
 */
@ApiTags('Workspace Advance Analytics')
@Controller()
export class WorkspaceAdvanceAnalyticsController {
	constructor(
		private readonly _advanceAnalyticsService: AdvanceAnalyticsService
	) {}

	/**
	 * Get workspace-level advance analytics.
	 *
	 * Matches Plane's AdvanceAnalyticsEndpoint.get() — dispatches by ?tab= param:
	 * - tab=overview → { total_users, total_admins, total_members, total_guests,
	 *                    total_projects, total_work_items, total_cycles, total_intake }
	 * - tab=work-items → { total_work_items, started_work_items, backlog_work_items,
	 *                      un_started_work_items, completed_work_items }
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace advance analytics' })
	@ApiResponse({ status: 200, description: 'Successfully retrieved workspace advance analytics' })
	@Get('advance-analytics')
	async getWorkspaceAdvanceAnalytics(
		@Query('tab') tab: string,
		@Query() query: AdvanceAnalyticsQueryDto
	): Promise<any> {
		return this._advanceAnalyticsService.getWorkspaceAdvanceAnalytics(tab, query);
	}

	/**
	 * Get workspace-level advance analytics charts.
	 *
	 * Matches Plane's AdvanceAnalyticsChartEndpoint.get() — dispatches by ?type= param:
	 * - type=projects → flat array [{key, name, count}]
	 * - type=work-items → {data, schema} with created vs completed over time
	 * - type=custom-work-items → {data, schema} with x_axis/group_by charting
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace advance analytics charts' })
	@ApiResponse({ status: 200, description: 'Successfully retrieved workspace advance analytics charts' })
	@Get('advance-analytics-charts')
	async getWorkspaceAdvanceAnalyticsCharts(
		@Query() query: AdvanceAnalyticsChartsQueryDto
	): Promise<any> {
		return this._advanceAnalyticsService.getWorkspaceAdvanceAnalyticsCharts(query);
	}
}
