import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import {
	DashboardIssueTypeEnum,
	DashboardWigetQueryEnum,
	UserStatsResponse,
} from '@plane-plugin/models';

@ApiTags('Workspaces routes')
@Controller()
export class WorkspaceController {
	constructor(private readonly _workspaceService: WorkspaceService) {}

	/**
	 * @description - Get dashboard widgets for given workspace
	 * @param {string} workspace_name - slug for workspace name
	 * @param {string} dashboard_type - query that define which widget filter should be fetched
	 * @returns - A promise that resolves when dashboard widgets are fetched
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get dashboard widgets' })
	@Get('dashboard')
	async getDashboard(
		@Param('worspace_name') workspace_name: string,
		@Query('dashboard_type') dashboard_type: string,
	) {
		return await this._workspaceService.getDashboard(
			workspace_name,
			dashboard_type,
		);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get dashboard widgets' })
	@Get('dashboard/:id')
	async getWigetsData(
		@Query('widget_key')
		widget: DashboardWigetQueryEnum,
		@Query('target_date') target_date: string,
		@Query('issue_type') issue_type: DashboardIssueTypeEnum,
	) {
		return await this._workspaceService.findDashboardWidgetsData(
			widget,
			target_date,
			issue_type,
		);
	}

	/**
	 * @description - Get member (from connected user) info for a workspace
	 * @param {string} workspace_name - slug for workspace name
	 * @returns - A promise that resolves after getting member informations
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get member info for given workspace' })
	@Get('workspace-members/me')
	async getMembersMe(@Param('worspace_name') workspace_name: string) {
		return await this._workspaceService.getMembersMe(workspace_name);
	}

	/**
	 * @description - Get members for a workspace
	 * @returns - A promise that resolves after getting members for a workspace
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace members' })
	@Get('members')
	async getMembers() {
		return await this._workspaceService.getWorkspaceMembers();
	}

	/**
	 * Retrieves a summary of the user's work statistics, including task distribution
	 * by state and priority, as well as counts for created, assigned, and completed issues.
	 *
	 * @returns {Promise<UserStatsResponse>} A promise that resolves with the user's work summary.
	 *
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get user stats' })
	@Get('user-stats/:id')
	async findUserWorkSummary(): Promise<UserStatsResponse> {
		return await this._workspaceService.findUserWorkSummary();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get user recent activities' })
	@Get('user-activity/:id')
	async findUserRecentActivity() {
		return await this._workspaceService.findUserRecentActivity();
	}
}
