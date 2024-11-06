import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	BaseEntityEnum,
	DashboardWigetQueryEnum,
	ID,
	IOrganization,
	IRecentCollaborator,
	IWorkspaceUserInfo,
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	defaultEmployeeId,
	defaultOrganizationId,
	defaultTestTenantId,
	defaultUserId,
	getTaskCounts,
	issueActivityLogTransformer,
	issuesByPriority,
} from '../../config';
import {
	getOrganizationQuery,
	organizationMembersTransformer,
} from '../../config';
import { ProjectService } from '../project/project.service';
import { IssuesService } from '../issues/issues.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class WorkspaceService extends ApiFetchService {
	constructor(
		private readonly _issueService: IssuesService,
		private readonly _projectService: ProjectService,
		private readonly _activityService: ActivityService,
		private readonly _serverFetchService: ApiFetchService,
	) {
		super(_serverFetchService['_httpService']);
	}

	/**--------------------------------------------------------------
     * This function handlers should be updated after implementing authentication
     *--------------------------------------------------------------/
	/**
	 * @description - Get dashboard widgets for given workspace
	 * @param {string} workspace_name - slug for workspace name
	 * @param {string} dashboard_type - query that define which widget filter should be fetched
	 * @returns - A promise that resolves when dashboard widgets are fetched
	 * @memberof WorkspaceService
	 */
	async getDashboard(workspace_name: string, dashboard_type: string) {
		console.log({ workspace_name, dashboard_type });
		return {
			dashboard: {
				id: '9495b115-1faa-4677-9051-0206353a21d4',
				created_at: '2024-06-25T12:24:39.030331Z',
				updated_at: '2024-06-25T12:24:39.030345Z',
				deleted_at: null,
				name: '',
				description_html: '<p></p>',
				identifier: null,
				is_default: true,
				type_identifier: 'home',
				logo_props: {},
				created_by: defaultEmployeeId(),
				updated_by: defaultEmployeeId(),
				owned_by: defaultEmployeeId(),
			},
			widgets: [
				{
					id: '2aeac7af-6040-488c-8f5c-6ebac65ca4b7',
					key: 'recent_collaborators',
					is_visible: true,
					widget_filters: {},
				},
				{
					id: '59f310e4-0473-4fb9-ad2d-d709edcc44e2',
					key: 'recent_projects',
					is_visible: true,
					widget_filters: {},
				},
				{
					id: '6bbda6d1-73cc-4e95-82e2-6f4677cc4993',
					key: 'recent_activity',
					is_visible: true,
					widget_filters: {},
				},
				{
					id: '99748079-63ff-413a-95e2-3d1a706512dd',
					key: 'issues_by_priority',
					is_visible: true,
					widget_filters: {
						duration: 'none',
					},
				},
				{
					id: '15eebb02-7be0-472d-a621-5a886e39f10e',
					key: 'issues_by_state_groups',
					is_visible: true,
					widget_filters: {
						duration: 'none',
					},
				},
				{
					id: 'b07deb33-9e8d-42aa-9515-134c26e5d7df',
					key: 'created_issues',
					is_visible: true,
					widget_filters: {
						tab: 'pending',
						duration: 'none',
					},
				},
				{
					id: 'fd3307a4-11e3-4013-ab65-d1f9bcfcaad4',
					key: 'assigned_issues',
					is_visible: true,
					widget_filters: {
						tab: 'pending',
						duration: 'none',
					},
				},
				{
					id: 'b2c401a3-ce8a-42e5-853f-55302b0b5502',
					key: 'overview_stats',
					is_visible: true,
					widget_filters: {},
				},
			],
		};
	}

	/**
	 * Fetches data for various dashboard widgets based on the widget type.
	 *
	 * This function retrieves data for different types of dashboard widgets such as recent collaborators,
	 * created issues, assigned issues, recent projects, issues by state, and issues by priority.
	 *
	 * @param {DashboardWigetQueryEnum} widget - The widget type to query data for.
	 * @returns {Promise<any>} A promise that resolves to the data for the requested widget.
	 * @throws {BadRequestException} If an error occurs during data retrieval.
	 */
	async findDashboardWidgetsData(
		widget: DashboardWigetQueryEnum,
	): Promise<any> {
		const completed = 0;
		const pending = 0;

		// Mapping object for each widget type and its corresponding handler function
		const widgetHandlers: {
			[key in DashboardWigetQueryEnum]?: () => Promise<any>;
		} = {
			[DashboardWigetQueryEnum.COLLABORATORS]:
				this.findRecentCollaborators.bind(this),

			[DashboardWigetQueryEnum.CREATED_ISSUES]: async () => {
				const issues = await this.findMyCreatedIssues();
				return { issues, count: issues.length };
			},

			[DashboardWigetQueryEnum.ASSIGNED_ISSUES]: async () => {
				const issues = await this.findMyAssignedIssues();
				return { issues, count: issues.length };
			},

			[DashboardWigetQueryEnum.RECENT_ACTIVITY]:
				this.findRecentIssueActivity.bind(this),

			[DashboardWigetQueryEnum.RECENT_PROJECTS]:
				this.findRecentProjects.bind(this),

			[DashboardWigetQueryEnum.ISSUES_BY_STATE]:
				this.finAssignedByState.bind(this),

			[DashboardWigetQueryEnum.ISSUES_BY_PRIORITY]:
				this.findAssignedByPriority.bind(this),

			[DashboardWigetQueryEnum.OVERVIEW]: async () => {
				const assigned = await this.findMyAssignedIssues();

				const created = await this.findMyCreatedIssues();
				return {
					assigned_issues_count: assigned.length,
					pending_issues_count: pending,
					completed_issues_count: completed,
					created_issues_count: created.length,
				};
			},
		};

		// Execute the corresponding handler if the widget type exists in the mapping
		if (widget in widgetHandlers) {
			return widgetHandlers[widget]();
		}
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication and User features
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get member (from connected user) info for a workspace
	 * @param {string} workspace_name - slug for workspace name
	 * @returns - A promise that resolves after getting member informations
	 * @memberof WorkspaceController
	 */
	async getMembersMe(workspace_name: string) {
		console.log({ workspace_name });
		return {
			id: defaultUserId(),
			created_at: '2024-08-13T11:47:19.039549Z',
			updated_at: '2024-08-13T11:47:19.039558Z',
			deleted_at: null,
			role: 20,
			company_role: '',
			view_props: {
				filters: {
					state: null,
					labels: null,
					priority: null,
					assignees: null,
					created_by: null,
					start_date: null,
					subscriber: null,
					state_group: null,
					target_date: null,
				},
				display_filters: {
					type: null,
					layout: 'list',
					group_by: null,
					order_by: '-created_at',
					sub_issue: true,
					show_empty_groups: true,
					calendar_date_range: '',
				},
				display_properties: {
					key: true,
					link: true,
					state: true,
					labels: true,
					assignee: true,
					due_date: true,
					estimate: true,
					priority: true,
					created_on: true,
					start_date: true,
					updated_on: true,
					sub_issue_count: true,
					attachment_count: true,
				},
			},
			default_props: {
				filters: {
					state: null,
					labels: null,
					priority: null,
					assignees: null,
					created_by: null,
					start_date: null,
					subscriber: null,
					state_group: null,
					target_date: null,
				},
				display_filters: {
					type: null,
					layout: 'list',
					group_by: null,
					order_by: '-created_at',
					sub_issue: true,
					show_empty_groups: true,
					calendar_date_range: '',
				},
				display_properties: {
					key: true,
					link: true,
					state: true,
					labels: true,
					assignee: true,
					due_date: true,
					estimate: true,
					priority: true,
					created_on: true,
					start_date: true,
					updated_on: true,
					sub_issue_count: true,
					attachment_count: true,
				},
			},
			issue_props: {
				created: true,
				assigned: true,
				all_issues: true,
				subscribed: true,
			},
			is_active: true,
			created_by: defaultEmployeeId(),
			updated_by: defaultEmployeeId(),
			workspace: defaultTestTenantId(),
			member: defaultEmployeeId(),
		};
	}

	/**
	 * @description - Get Organization members
	 * @returns A promise that resolves after get organization members
	 * @memberof WorkspaceService
	 */
	async getWorkspaceMembers(): Promise<IWorkspaceUserInfo[]> {
		const query = qs.stringify(getOrganizationQuery);
		const organization: IOrganization = (
			await this.apiFetch({
				method: 'GET',
				path: `/organization/${defaultOrganizationId()}`, // TODO : Get this organization ID from request
				query,
			})
		).data;
		return organizationMembersTransformer(
			organization.employees,
			organization.tenant,
		);
	}

	/**
	 * Retrieves the most recent collaborators from the workspace members.
	 *
	 * The function fetches all workspace members and and returns the first members found. The result includes each collaborator's
	 * user ID and active issue count (which needs to be calculated accordingly).
	 *
	 * @returns {Promise<IRecentCollaborator[]>} A promise that resolves to an array of recent collaborators.
	 * @throws {BadRequestException} If there is an error while fetching the workspace members.
	 */
	async findRecentCollaborators(): Promise<IRecentCollaborator[]> {
		try {
			const employees = (await this.getWorkspaceMembers()).slice(0, 10);

			return employees.map((employee) => ({
				user_id: employee.member.id,
				active_issue_count: 0, // Find a way  to make this working
			}));
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves the issues assigned to the current employee.
	 *
	 * The function calls the issue service to fetch all issues assigned to the employee
	 */
	async findMyAssignedIssues() {
		return this._issueService.findByEmployee(defaultEmployeeId()); // TODO: Adjust this to use correct authenticated employee
	}

	/**
	 * Retrieves the issues created by the current user.
	 *
	 * The function calls the issue service to fetch all issues created by the user
	 */
	async findMyCreatedIssues() {
		return await this._issueService.findAll({ creatorId: defaultUserId() }); // TODO: Adjust this to use correct authenticated user
	}

	/**
	 * Retrieves the count of tasks assigned to the current employee, grouped by their state.
	 *
	 * Sends a GET request to fetch tasks assigned to the authenticated employee.
	 * Tasks are then categorized into states (backlog, unstarted, started, completed, and cancelled).
	 *
	 * @returns {Promise<{ state: string, count: number }[]>} A promise that resolves to an array of objects representing task states and their respective counts.
	 * @throws {BadRequestException} If an error occurs during the fetch.
	 */
	async finAssignedByState(): Promise<{ state: string; count: number }[]> {
		try {
			const tasks =
				await this._issueService.findExternalByEmployee(
					defaultEmployeeId(),
				); // Use authenticated employee ID

			// Get task counts based on their states
			const {
				backlogIssues,
				completedIssues,
				startedIssues,
				unstartedIssues,
			} = getTaskCounts(tasks);

			// Return the task counts grouped by state
			return [
				{ state: 'backlog', count: backlogIssues },
				{ state: 'unstarted', count: unstartedIssues },
				{ state: 'started', count: startedIssues },
				{ state: 'completed', count: completedIssues },
				{ state: 'cancelled', count: 0 }, // Assuming 0 cancelled issues as not specified
			];
		} catch (error: any) {
			// Log error and throw BadRequestException
			console.log(error.response?.data ?? error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves tasks assigned to the authenticated employee and categorizes them by priority.
	 *
	 * This function fetches tasks for the authenticated employee and returns the count
	 * of tasks grouped by their priority (urgent, high, medium, low, none).
	 *
	 * @returns {Promise<Array<{ priority: string; count: number }>>} A promise that resolves to an array of objects containing the priority and the count of tasks for each priority level.
	 * @throws {BadRequestException} If an error occurs during task retrieval.
	 */
	async findAssignedByPriority(): Promise<
		{ priority: string; count: number }[]
	> {
		try {
			// Fetch tasks assigned to the authenticated employee
			const tasks =
				await this._issueService.findExternalByEmployee(
					defaultEmployeeId(),
				); // Use authenticated employee ID

			// Get the tasks counts grouped by priority
			return issuesByPriority(tasks);
		} catch (error: any) {
			// Log the error and throw a BadRequestException
			console.log(error.response?.data ?? error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves the most recent project IDs.
	 *
	 * This function fetches all projects and returns the IDs of the first 5 recent projects.
	 *
	 * @returns {Promise<ID[]>} A promise that resolves to an array of the most recent project IDs.
	 * @throws {BadRequestException} If an error occurs during project retrieval.
	 */
	async findRecentProjects(): Promise<ID[]> {
		try {
			// Fetch all projects
			const projects = await this._projectService.getProjects();

			// Return the first 5 project IDs
			return projects.map((project) => project.id).slice(0, 4);
		} catch (error) {
			// Log the error and throw a BadRequestException
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	async findRecentIssueActivity() {
		try {
			const activityLogs = await this._activityService.findAll({
				entity: BaseEntityEnum.Task,
				creatorId: defaultUserId(), // Use authenticated user ID
			});

			const issueActivities = await Promise.all(
				activityLogs.map(async (activityLog) => {
					const task = await this._issueService.getExternalIssue(
						activityLog.entityId,
					);

					if (task.projectId) {
						const { actor, issue, project, workspace } =
							await this._issueService.getIssueCommentDetails(
								task.id,
								task.projectId,
								activityLog.creatorId,
							);

						const transformedActivityLogs =
							issueActivityLogTransformer(
								activityLog,
								issue,
								actor,
								project,
								workspace,
								issue.cycle,
							);

						return Array.isArray(transformedActivityLogs)
							? transformedActivityLogs
							: [transformedActivityLogs];
					}
				}),
			);

			// TODO: Include also links activities and filter both by createdAt to return most recent activities.

			return issueActivities.flat().filter(Boolean).slice(0, 8);
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
