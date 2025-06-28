import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import {
	DashboardIssueTypeEnum,
	DashboardWigetQueryEnum,
	ICreateIssueLink,
	ICycle,
	ID,
	IEntitySearchFindInput,
	IGlabalEntitiesFindInput,
	IIssue,
	IIssueFindInput,
	IIssueLabel,
	IModule,
	INotification,
	IUserStatsResponse
} from '@plane-plugin/models';
import { CreateIssueDTO, UpdateIssueDTO } from '../issues/dto';

@ApiTags('Workspaces routes')
@Controller()
export class WorkspaceController {
	constructor(private readonly _workspaceService: WorkspaceService) {}

	/*
	|--------------------------------------------------------------------------
	| DASHBOARD ROUTES
	|--------------------------------------------------------------------------
	*/

	/**
	 * @description - Get dashboard widgets for given workspace
	 * @param {string} dashboard_type - query that define which widget filter should be fetched
	 * @returns - A promise that resolves when dashboard widgets are fetched
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get dashboard widgets' })
	@Get('dashboard')
	async getDashboard(@Query('dashboard_type') dashboard_type: string) {
		return await this._workspaceService.getDashboard(dashboard_type);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get dashboard widgets' })
	@Get('dashboard/:id')
	async getWigetsData(
		@Query('widget_key')
		widget: DashboardWigetQueryEnum,
		@Query('target_date') target_date: string,
		@Query('issue_type') issue_type: DashboardIssueTypeEnum
	) {
		return await this._workspaceService.findDashboardWidgetsData(
			widget,
			target_date,
			issue_type
		);
	}

	/**
	 * Retrieves the default set of dashboard widgets for the home preferences.
	 *
	 * @returns An array of widget objects, each containing a key,
	 * is_enabled status, config, and sort_order. These widgets represent
	 * the default settings for the home dashboard.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get dashboard widgets' })
	@Get('home-preferences')
	async getWidgets() {
		return [
			{
				key: 'my_stickies',
				is_enabled: true,
				config: {},
				sort_order: 997.0
			},
			{
				key: 'recents',
				is_enabled: true,
				config: {},
				sort_order: 998.0
			},
			{
				key: 'quick_links',
				is_enabled: true,
				config: {},
				sort_order: 999.0
			}
		];
	}

	/*
	|--------------------------------------------------------------------------
	| WORKSPACE MEMBERS ROUTES
	|--------------------------------------------------------------------------
	*/

	/**
	 * @description - Get member (from connected user) info for a workspace
	 * @returns - A promise that resolves after getting member informations
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get member info for given workspace' })
	@Get('workspace-members/me')
	async getMembersMe() {
		return await this._workspaceService.getMembersMe();
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

	/*
	|--------------------------------------------------------------------------
	| WORKSPACE USER PROFILE ROUTES
	|--------------------------------------------------------------------------
	*/

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
	async findUserWorkSummary(
		@Param('id') employeeId: ID
	): Promise<IUserStatsResponse> {
		return await this._workspaceService.findUserWorkSummary(employeeId);
	}

	/**
	 * Retrieves the user's recent activity
	 *
	 * @returns {Promise<Object>} A promise that resolves with a structured response containing user activity details.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get user recent activities' })
	@Get('user-activity/:id')
	async findUserRecentActivity(
		@Param('id') employeeId: ID,
		@Query('per_page') per_page: number
	): Promise<any> {
		return await this._workspaceService.findUserRecentActivity(
			per_page,
			employeeId
		);
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
	async findUserProjectsData(@Param('id') employeeId: ID): Promise<any> {
		return await this._workspaceService.findUserProjectsData(employeeId);
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
		@Query() options: IIssueFindInput
	): Promise<any> {
		return await this._workspaceService.findUserGroupedIssueAssigned(
			options
		);
	}

	/*
	|--------------------------------------------------------------------------
	| WORKSPACE GLOBAL DATA ROUTES
	|--------------------------------------------------------------------------
	*/

	/**
	 * Fetches all projects associated with the workspace.
	 *
	 * @returns A promise resolving to an array of workspace projects.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace projects' })
	@Get('projects')
	async findWorkspaceProjects(): Promise<any> {
		return await this._workspaceService.findProjects();
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

	/**
	 * Retrieves all labels associated with the projects in the workspace.
	 *
	 * @returns {Promise<IIssueLabel[]>} A promise resolving to an array of issue labels.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace labels' })
	@Get('labels')
	async findWorkspaceLabels(): Promise<IIssueLabel[]> {
		return await this._workspaceService.findWorkspaceLabels();
	}

	/*
	|--------------------------------------------------------------------------
	| DRAFT ISSUES ROUTES
	|--------------------------------------------------------------------------
	*/

	/**
	 * Creates a new draft issue.
	 * @param {CreateIssueDTO} input - The input data required to create a draft issue.
	 * @returns {Promise<IIssue>} A promise that resolves to the newly created draft issue.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create draft issue' })
	@Post('draft-issues')
	async createDraftIssue(@Body() input: CreateIssueDTO): Promise<IIssue> {
		return await this._workspaceService.createDraftIssue(input);
	}

	/**
	 * Updates an issue with the given ID and input data, ensuring it remains a draft.
	 *
	 * @param {ID} id - The unique identifier of the issue to update.
	 * @param {IIssueUpdateInput} input - The data to update the issue with.
	 * @returns {Promise<IIssue>} A promise that resolves to the updated issue.
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Update Draft issue' })
	@Patch('draft-issues/:id')
	async update(
		@Body() input: UpdateIssueDTO,
		@Param('id') id: ID
	): Promise<IIssue> {
		return await this._workspaceService.updateDraftIssue(id, input);
	}

	/**
	 * Retrieves all draft issues.
	 *
	 * @returns {Promise<any>} A promise that resolves to a list of transformed issues.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find draft issues' })
	@Get('draft-issues')
	async findDraftIssues(): Promise<any> {
		return await this._workspaceService.findDraftIssues();
	}

	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Update Draft issue' })
	@Post('draft-to-issue/:id')
	async draftToIssue(
		@Body() input: UpdateIssueDTO,
		@Param('id') id: ID
	): Promise<IIssue> {
		return await this._workspaceService.draftToIssue(id, input);
	}

	/*
	|--------------------------------------------------------------------------
	| GLOBAL SEARCH
	|--------------------------------------------------------------------------
	*/

	/**
	 * @description - Find global entities (Projects, issues, etc.)
	 * @param {IGlabalEntitiesFindInput} options - query that define the filter options
	 * @returns - A promise that resolves when entities are found
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find global entities' })
	@Get('search')
	async findGlobalEntitiesBySearch(
		@Query() options: IGlabalEntitiesFindInput
	) {
		return await this._workspaceService.findGlobalEntitiesBySearch(options);
	}

	/**
	 * Performs an entity search based on the provided options.
	 *
	 * @param {IEntitySearchFindInput} options - The search options containing `project_id`
	 * and `query_type`.
	 * @returns {Promise<any>} A promise resolving to an object containing the user mention details.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Entity search' })
	@Get('entity-search')
	async entitySearch(@Query() options: IEntitySearchFindInput): Promise<any> {
		return await this._workspaceService.entitySearch(options);
	}

	/*
	|--------------------------------------------------------------------------
	| VIEWS
	|--------------------------------------------------------------------------
	*/
	/**
	 * @description - Find workspace issues by view type.
	 * @param {IIssueFindInput} options - query that define the filter options.
	 * @param {string} referer - Request referer to determine view ID.
	 * @returns - A promise that resolves when entities are found
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find Workspace view issues' })
	@Get('issues')
	async findViewIssues(
		@Query() options: IIssueFindInput,
		@Headers('referer') referer: string
	) {
		return await this._workspaceService.findViewIssues(options, referer);
	}

	/*
	|--------------------------------------------------------------------------
	| NOTIFICATIONS ROUTES
	|--------------------------------------------------------------------------
	*/
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get my notifications' })
	@Get('users/notifications')
	async findMyNotifications() {
		return this._workspaceService.findUserNotification();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get my unread notifications' })
	@Get('users/notifications/unread')
	async findMyUnreadNotifications() {
		return this._workspaceService.findUnreadNotifications();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Read notification' })
	@Post('users/notifications/mark-all-read')
	async markAllAsRead() {
		return this._workspaceService.markAllAsRead();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Read notification' })
	@Post('users/notifications/:notificationId/read')
	async readNotification(@Param('notificationId') id: ID) {
		return this._workspaceService.readNotification(id);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Unread notification' })
	@Delete('users/notifications/:notificationId/read')
	async unreadNotification(@Param('notificationId') id: ID) {
		return this._workspaceService.unreadNotification(id);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Archive notification' })
	@Post('users/notifications/:notificationId/archive')
	async archiveNotification(@Param('notificationId') id: ID) {
		return this._workspaceService.archiveNotification(id);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Un Archive notification' })
	@Delete('users/notifications/:notificationId/archive')
	async unArchiveNotification(@Param('notificationId') id: ID) {
		return this._workspaceService.unArchiveNotification(id);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Hold notification' })
	@Patch('users/notifications/:notificationId')
	async holdNotification(
		@Param('notificationId') id: ID,
		@Body() data: INotification
	) {
		return this._workspaceService.holdNotification(id, data);
	}

	/*
	|--------------------------------------------------------------------------
	| DASHBOARD ROUTES
	|--------------------------------------------------------------------------
	*/

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find current plan' })
	@Get('current-plan')
	async getCurrentPlan() {
		return {
			is_cancelled: false,
			purchased_seats: 1,
			current_period_end_date: '2025-12-31T12:49:48Z',
			interval: 'YEARLY',
			product: 'PRO',
			is_offline_payment: false,
			trial_end_date: '2025-12-31T12:49:48Z',
			has_activated_free_trial: true,
			has_added_payment_method: true,
			subscription: '59a092b3-54da-47d7-9f31-6b22ae45cd97',
			is_self_managed: false,
			is_on_trial: true,
			is_trial_allowed: true,
			remaining_trial_days: 342,
			has_upgraded: true,
			show_payment_button: false,
			show_trial_banner: false,
			free_seats: 12,
			occupied_seats: 1,
			show_seats_banner: false,
			current_period_start_date: '2025-01-23T12:49:48Z',
			is_trial_ended: false,
			billable_members: 1,
			is_free_member_count_exceeded: false
		};
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find products plans' })
	@Get('products')
	async getProducts() {
		return [
			{
				id: 'prod_RagdjBkta6q1td',
				name: 'Plane Business • Cloud',
				description:
					'The earliest packaging of Business at $10 a seat a month billed annually, $12 a seat a month billed monthly for Plane Cloud',
				type: 'BUSINESS',
				prices: [
					{
						id: 'price_1QhVGcG5xRvEyfTNPq2q1dbA',
						unit_amount: 12000.0,
						recurring: 'year',
						currency: 'usd',
						workspace_amount: 12000.0
					},
					{
						id: 'price_1QhVGcG5xRvEyfTNVY1ZfpCi',
						unit_amount: 1200.0,
						recurring: 'month',
						currency: 'usd',
						workspace_amount: 1200.0
					}
				],
				payment_quantity: 1,
				is_active: false
			},
			{
				id: 'prod_QLrOPmCCpcsN6s',
				name: 'Plane Pro • Cloud',
				description:
					'More views, more cycles powers, more pages features, new reports, and better dashboards are waiting to be unlocked.',
				type: 'PRO',
				prices: [
					{
						id: 'price_1PnjZ3G5xRvEyfTNT3WNGHsC',
						unit_amount: 800.0,
						recurring: 'month',
						currency: 'usd',
						workspace_amount: 800.0
					},
					{
						id: 'price_1PnjZjG5xRvEyfTNOkO0UDlX',
						unit_amount: 7200.0,
						recurring: 'year',
						currency: 'usd',
						workspace_amount: 7200.0
					}
				],
				payment_quantity: 1,
				is_active: true
			}
		];
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find products plans' })
	@Get('flags')
	async getPlanFlags() {
		return {
			values: {
				EPICS_DISPLAY: true,
				EPICS_SETTINGS: true,
				PROJECT_UPDATES: true,
				PROJECT_OVERVIEW: true,
				INBOX_STACKING: true,
				TIMELINE_DEPENDENCY: true,
				NO_LOAD: true,
				FILE_SIZE_LIMIT_PRO: true,
				EDITOR_AI_OPS: true,
				COLLABORATION_CURSOR: true,
				PROJECT_GROUPING: true,
				BULK_OPS_ADVANCED: true,
				WORKSPACE_ACTIVE_CYCLES: true,
				PAGE_ISSUE_EMBEDS: true,
				PAGE_PUBLISH: true,
				VIEW_ACCESS_PRIVATE: true,
				VIEW_PUBLISH: true,
				VIEW_LOCK: true,
				ISSUE_TYPE_SETTINGS: true,
				ISSUE_TYPE_DISPLAY: true,
				WORKSPACE_PAGES: true,
				BULK_OPS: true,
				ESTIMATE_WITH_TIME: true,
				ISSUE_WORKLOG: true,
				OIDC_SAML_AUTH: true
			}
		};
	}

	/*
	|--------------------------------------------------------------------------
	| QUICK LINKS ROUTES
	|--------------------------------------------------------------------------
	*/

	/**
	 * Creates a quick link, an issue link that is not associated with any issue.
	 * @param data - The input data for creating the quick link.
	 * @returns The created quick link.
	 * @throws {BadRequestException} If the API returns an array of links instead of a single link.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create A Quick link' })
	@Post('quick-links')
	async createQuickLink(@Body() data: ICreateIssueLink) {
		return await this._workspaceService.createQuickLink(data);
	}

	/**
	 * Updates a quick link in the workspace.
	 * @param linkId - The ID of the quick link to update.
	 * @param data - The updated data for the quick link.
	 * @returns The updated quick link.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Update A Quick link' })
	@Patch('quick-links/:id')
	async updateQuickLink(
		@Param('id') linkId: ID,
		@Body() data: ICreateIssueLink
	) {
		return await this._workspaceService.updateQuickLink(linkId, data);
	}

	/**
	 * Finds all quick links in the workspace.
	 * @returns A promise resolved to an array of quick links.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find Quick links' })
	@Get('quick-links')
	async getQuickinks() {
		return await this._workspaceService.findQuickLinks();
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete A Quick Link' })
	@Delete('quick-links/:id')
	async deleteQuickLink(@Param('id') linkId: ID) {
		return await this._workspaceService.deleteQuickLink(linkId);
	}
}
