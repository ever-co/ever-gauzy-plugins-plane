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
	ICycle,
	IIssueFindInput,
	IModule,
	IUserStatsResponse,
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
	 * @returns {Promise<IUserStatsResponse>} A promise that resolves with the user's work summary.
	 *
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get user stats' })
	@Get('user-stats/:id')
	async findUserWorkSummary(): Promise<IUserStatsResponse> {
		return await this._workspaceService.findUserWorkSummary();
	}

	/**
	 * Retrieves the user's recent activity
	 *
	 * @returns {Promise<Object>} A promise that resolves with a structured response containing user activity details.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get user recent activities' })
	@Get('user-activity/:id')
	async findUserRecentActivity(): Promise<any> {
		return await this._workspaceService.findUserRecentActivity();
	}

	/**
	 * Retrieves the project data associated with the currently connected user.
	 *
	 * @returns {Promise<IUserProjectsDataResponse>} A promise that resolves with the user's projects data.
	 *
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get user profile and project data' })
	@Get('user-profile/:id')
	async findUserProjectsData(): Promise<any> {
		return await this._workspaceService.findUserProjectsData();
	}

	/**
	 * Retrieves and groups issues assigned to a user based on the specified grouping option.
	 *
	 * @param {IIssueFindInput} options - The input options specifying the query criteria.
	 * @returns A promise that resolves to an array of grouped issues.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get user profile and assigned issues' })
	@Get('user-issues/:id')
	async findUserGroupedIssueAssigned(
		@Query() options: IIssueFindInput,
	): Promise<any> {
		return await this._workspaceService.findUserGroupedIssueAssigned(
			options,
		);
	}

	/**
	 * Fetches all workspace states associated with projects in the workspace.
	 *
	 * @returns A promise resolving to an array of workspace states.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace states' })
	@Get('states')
	async findWorkspaceStates(): Promise<any> {
		return await this._workspaceService.findWorkspaceStates();
	}

	/**
	 * Fetches all workspace modules associated with projects in the workspace.
	 *
	 * @returns {Promise<IModule[]>} A promise resolving to an array of project modules.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace modules' })
	@Get('modules')
	async findWorkspaceModules(): Promise<IModule[]> {
		return await this._workspaceService.findWorkspaceModules();
	}

	/**
	 * Fetches all cycles associated with projects in the workspace.
	 *
	 * @returns {Promise<ICycle[]>} A promise resolving to an array of cycles.
	 *
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace cycles' })
	@Get('cycles')
	async findWorkspaceCycles(): Promise<ICycle[]> {
		return await this._workspaceService.findWorkspaceCycles();
	}
}
