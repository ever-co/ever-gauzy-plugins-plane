import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	BaseEntityEnum,
	DashboardIssueTypeEnum,
	DashboardWigetQueryEnum,
	ID,
	IIssue,
	IOrganization,
	IRecentCollaborator,
	ITask,
	IWorkspaceUserInfo,
	TaskStatusEnum,
	IUserStatsResponse,
	IUserProjectsDataResponse,
	IssueGroupBy,
	IIssueFindInput,
	IModule,
	ICycle,
	IIssueLabel,
	IssueOrderByField,
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	cycleTransformer,
	defaultEmployeeId,
	defaultOrganizationId,
	defaultTestTenantId,
	defaultUserId,
	getStatesTransformer,
	getTaskCounts,
	groupIssuesByLabel,
	groupIssuesByPriority,
	groupIssuesByProjectId,
	groupIssuesByStateGroup,
	issueActivityLogTransformer,
	issueLabelsTransformer,
	issueLinkTransformer,
	issuesByPriority,
	issueTransformer,
	modulesTransformer,
	userIssuesByPriority,
	userWorkNonGroupedIssues,
	userWorkProjectsTransformer,
	widgetTargetDateTransformer,
} from '../../config';
import {
	getOrganizationQuery,
	organizationMembersTransformer,
} from '../../config';
import { ProjectService } from '../project/project.service';
import { IssuesService } from '../issues/issues.service';
import { ActivityService } from '../activity/activity.service';
import { IssueLinksService } from '../issue-links/issue-links.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class WorkspaceService extends ApiFetchService {
	constructor(
		private readonly _issueService: IssuesService,
		private readonly _projectService: ProjectService,
		private readonly _activityService: ActivityService,
		private readonly _issueLinkService: IssueLinksService,
		private readonly _subscriptionService: SubscriptionService,
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
		target_date?: string,
		issue_type?: DashboardIssueTypeEnum,
	): Promise<any> {
		// Mapping object for each widget type and its corresponding handler function
		const widgetHandlers: {
			[key in DashboardWigetQueryEnum]?: () => Promise<any>;
		} = {
			[DashboardWigetQueryEnum.COLLABORATORS]:
				this.findRecentCollaborators.bind(this),

			[DashboardWigetQueryEnum.CREATED_ISSUES]: async () => {
				const issues = await this.findMyCreatedIssues(
					target_date,
					issue_type,
				);
				return { issues: issues.slice(0, 5), count: issues.length };
			},

			[DashboardWigetQueryEnum.ASSIGNED_ISSUES]: async () => {
				const issues = await this.findMyAssignedIssues(
					target_date,
					issue_type,
				);
				return { issues: issues.slice(0, 5), count: issues.length };
			},

			[DashboardWigetQueryEnum.RECENT_ACTIVITY]: async () => {
				return this.findRecentIssueActivity(8);
			},

			[DashboardWigetQueryEnum.RECENT_PROJECTS]:
				this.findRecentProjects.bind(this),

			[DashboardWigetQueryEnum.ISSUES_BY_STATE]: async () => {
				return this.finAssignedByState(target_date);
			},

			[DashboardWigetQueryEnum.ISSUES_BY_PRIORITY]: async () => {
				return this.findAssignedByPriority(target_date);
			},

			[DashboardWigetQueryEnum.OVERVIEW]: async () => {
				return await this.findOverViewWidgetStats();
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
			const employees = await this.getWorkspaceMembers();

			const collaborators = await Promise.all(
				employees.map(async (employee) => {
					const tasks: ITask[] =
						await this._issueService.findExternalByEmployee(
							employee.member.id,
							['taskStatus'],
						);
					const { startedIssues, unstartedIssues } =
						getTaskCounts(tasks);

					return {
						user_id: employee.member.id,
						active_issue_count: startedIssues + unstartedIssues,
					};
				}),
			);
			return collaborators.sort(
				(a, b) => b.active_issue_count - a.active_issue_count,
			);
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves statistics for the overview widget related to assigned, completed,
	 * created, and overdue issues.
	 *
	 * The method fetches the user's assigned issues, completed issues, and created issues.
	 * It also filters assigned issues to determine how many are overdue (i.e., with a due date
	 * or target date that is earlier than today).
	 *
	 * @returns {Promise<Object>} An object containing the following issue counts:
	 * - `assigned_issues_count`: The number of issues assigned to the user.
	 * - `pending_issues_count`: The number of overdue issues assigned to the user.
	 * - `completed_issues_count`: The number of issues the user has completed.
	 * - `created_issues_count`: The number of issues created by the user.
	 *
	 * @throws {Error} If any of the asynchronous operations fail.
	 */
	async findOverViewWidgetStats(): Promise<object> {
		const today = new Date();
		const assigned = await this.findMyAssignedIssues();
		const completed = await this.findMyAssignedIssues(
			null,
			DashboardIssueTypeEnum.COMPLETED,
		);
		const created = await this.findMyCreatedIssues();
		const overdue = assigned.filter((task) => {
			if ('dueDate' in task) {
				const taskDueDate = new Date(task.dueDate);
				return taskDueDate < today;
			} else if ('target_date' in task) {
				const issueTargetDate = new Date(task.target_date);
				return issueTargetDate < today;
			}
			return true;
		});

		return {
			assigned_issues_count: assigned.length,
			pending_issues_count: overdue.length,
			completed_issues_count: completed.length,
			created_issues_count: created.length,
		};
	}

	/**
	 * Retrieves the issues assigned to the current employee.
	 *
	 * The function calls the issue service to fetch all issues assigned to the employee
	 */
	async findMyAssignedIssues(
		target_date?: string,
		issue_type?: DashboardIssueTypeEnum,
	) {
		const employeeId = defaultEmployeeId(); // TODO: Replace with the correct authenticated employee ID
		return this.getIssues(
			employeeId,
			'employeeId',
			target_date,
			issue_type,
		);
	}

	async findMyCreatedIssues(
		target_date?: string,
		issue_type?: DashboardIssueTypeEnum,
	) {
		const userId = defaultUserId(); // TODO: Replace with the correct authenticated user
		return this.getIssues(userId, 'creatorId', target_date, issue_type);
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
	async finAssignedByState(
		target_date?: string,
	): Promise<{ state: string; count: number }[]> {
		try {
			let tasks: ITask[] =
				await this._issueService.findExternalByEmployee(
					defaultEmployeeId(),
					['taskStatus'],
				); // TODO: Adjust this to use correct authenticated employee;

			if (target_date) {
				const { dueDateFrom, dueDateTo } =
					widgetTargetDateTransformer(target_date);

				tasks = await this._issueService.findByStartAndDueDate({
					dueDateFrom,
					dueDateTo,
					relations: ['members'],
					employeeId: defaultEmployeeId(), // TODO: Adjust this to use correct authenticated employee
				});
			}

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
	async findAssignedByPriority(
		target_date?: string,
	): Promise<{ priority: string; count: number }[]> {
		try {
			let tasks: ITask[] =
				await this._issueService.findExternalByEmployee(
					defaultEmployeeId(),
					['taskStatus'],
				); // TODO: Adjust this to use correct authenticated employee;

			if (target_date) {
				const { dueDateFrom, dueDateTo } =
					widgetTargetDateTransformer(target_date);

				tasks = await this._issueService.findByStartAndDueDate({
					dueDateFrom,
					dueDateTo,
					relations: ['members'],
					employeeId: defaultEmployeeId(), // TODO: Adjust this to use correct authenticated employee
				});
			}

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
			const projects = await this._projectService.getExternalProjects([]);

			// Return the first 5 project IDs
			return projects.map((project) => project.id).slice(0, 4);
		} catch (error) {
			// Log the error and throw a BadRequestException
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves the recent activity logs for issues, transformed and filtered based on the user's activity.
	 * The method fetches activity logs, resolves associated tasks, and includes details about the issue,
	 * actor, project, workspace, and cycle if applicable.
	 *
	 * @param {number} [length] - Optional limit for the number of recent activities to return.
	 * @returns {Promise<any[]>} A promise that resolves with a list of transformed issue activities.
	 *
	 * @throws {BadRequestException} If an error occurs during the retrieval or processing of activity logs.
	 */
	async findRecentIssueActivity(length?: number): Promise<any> {
		try {
			const activityLogs = await this._activityService.findAll({
				entity: BaseEntityEnum.Task,
				creatorId: defaultUserId(), // Use authenticated user ID
			});

			const issueActivities = await Promise.all(
				activityLogs.map(async (activityLog) => {
					const task = await this._issueService.getExternalIssue(
						activityLog.entityId,
						[
							'project.members.employee.user.role',
							'organizationSprint',
						],
					);

					if (task.projectId) {
						const { actor, issue, project, workspace } =
							await this._issueService.getIssueCommentDetails(
								task.id,
								task.projectId,
								activityLog.creatorId,
								task,
								task.project,
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
			const activities = issueActivities.flat().filter(Boolean);
			if (length) {
				return activities.slice(0, length);
			}

			return activities;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Fetches and filters issues based on a target date and issue type.
	 */
	private async getIssues(
		id: string,
		idField: 'employeeId' | 'creatorId',
		target_date?: string,
		issue_type?: DashboardIssueTypeEnum,
	) {
		try {
			let tasks: (ITask | IIssue)[];
			const dateRangesRelations = [
				'taskStatus',
				'linkedIssues.taskTo',
				'linkedIssues.taskFrom',
			];
			const relations = [
				'members.user',
				'creator',
				'project.members.employee.user.role',
				...dateRangesRelations,
			];

			// If a target date is provided, fetch tasks by date
			if (target_date) {
				const { dueDateFrom, dueDateTo } =
					widgetTargetDateTransformer(target_date);

				// Pass the appropriate field to the method based on idField
				if (idField === 'employeeId') {
					tasks = await this._issueService.findByStartAndDueDate({
						dueDateFrom,
						dueDateTo,
						relations: dateRangesRelations,
						employeeId: id, // Explicitly specify employeeId
					});
				} else {
					tasks = await this._issueService.findByStartAndDueDate({
						dueDateFrom,
						dueDateTo,
						relations: dateRangesRelations,
						creatorId: id, // Explicitly specify creatorId
					});
				}

				// Apply additional filtering based on issue_type
				if (issue_type) {
					const today = new Date();

					tasks = tasks.filter((task) => {
						if ('dueDate' in task) {
							// Logic for ITask
							const taskDueDate = new Date(task.dueDate);
							if (
								issue_type === DashboardIssueTypeEnum.UPCOMING
							) {
								return taskDueDate > today; // Only keep tasks due after today
							} else if (
								issue_type === DashboardIssueTypeEnum.OVERDUE
							) {
								return taskDueDate < today; // Only keep tasks due before today
							}
						} else if ('target_date' in task) {
							// Logic for IIssue
							const issueTargetDate = new Date(task.target_date);
							if (
								issue_type === DashboardIssueTypeEnum.UPCOMING
							) {
								return issueTargetDate > today; // Only keep issues with target_date after today
							} else if (
								issue_type === DashboardIssueTypeEnum.OVERDUE
							) {
								return issueTargetDate < today; // Only keep issues with target_date before today
							}
						}
						return true; // Default: no filtering for other issue types
					});
				}
			} else {
				// Fetch all tasks based on idField
				if (idField === 'employeeId') {
					tasks = await this._issueService.findByEmployee(
						id,
						relations,
					); // Directly pass the employeeId
				} else {
					tasks = await this._issueService.findAll(
						{ creatorId: id },
						relations,
					); // Directly pass the creatorId
				}
			}

			// Filter and transform tasks based on issue type
			return this.filterAndTransformTasks(tasks, issue_type);
		} catch (error: any) {
			console.error(error.response);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Filters and transforms the tasks based on issue type.
	 */
	private filterAndTransformTasks(
		tasks: (ITask | IIssue)[],
		issue_type?: DashboardIssueTypeEnum,
	) {
		const isCompleted = issue_type === DashboardIssueTypeEnum.COMPLETED;

		return tasks
			.filter((task) => {
				const status =
					'status' in task
						? task.status
						: 'state__group' in task
							? task.state__group
							: null;

				return isCompleted
					? status === TaskStatusEnum.COMPLETED ||
							status === TaskStatusEnum.DONE
					: status !== TaskStatusEnum.COMPLETED &&
							status !== TaskStatusEnum.DONE;
			})
			.map((task) => ('status' in task ? issueTransformer(task) : task));
	}

	/**
	 * Retrieves a summary of the user's work statistics, including task distribution
	 * by state and priority, as well as counts for created, assigned, and completed issues.
	 *
	 * @returns {Promise<IUserStatsResponse>} A promise that resolves with the user's work summary.
	 *
	 * @throws {BadRequestException} If an error occurs during the retrieval of work statistics.
	 */
	async findUserWorkSummary(): Promise<IUserStatsResponse> {
		try {
			const assignedIssues =
				await this._issueService.findExternalByEmployee(
					defaultEmployeeId(),
					['taskStatus'],
				);

			const subscribedIssues = await this.findUserSubscribedIssues([]);

			const {
				completedIssues,
				backlogIssues,
				startedIssues,
				unstartedIssues,
			} = getTaskCounts(assignedIssues);

			const createdIssues = await this.findMyCreatedIssues();

			return {
				state_distribution: [
					{ state_group: 'backlog', state_count: backlogIssues },
					{ state_group: 'unstarted', state_count: unstartedIssues },
					{ state_group: 'started', state_count: startedIssues },
					{ state_group: 'completed', state_count: completedIssues },
				],
				priority_distribution: userIssuesByPriority(assignedIssues),
				created_issues: createdIssues.length,
				assigned_issues: assignedIssues.length,
				completed_issues: completedIssues,
				pending_issues: backlogIssues + startedIssues + unstartedIssues,
				subscribed_issues: subscribedIssues.length || 0,
				present_cycles: [],
				upcoming_cycles: [],
			};
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves the user's recent activity
	 *
	 * @returns {Promise<Object>} A promise that resolves with a structured response containing user activity details.
	 */
	async findUserRecentActivity(per_page: number): Promise<any> {
		try {
			const activities = await this.findRecentIssueActivity(per_page);
			return {
				grouped_by: null,
				sub_grouped_by: null,
				total_count: 165,
				next_cursor: '10:1:0',
				prev_cursor: '10:-1:1',
				next_page_results: true,
				prev_page_results: false,
				count: 10,
				total_pages: 17,
				total_results: 165,
				extra_stats: null,
				results: activities,
			};
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves the project data associated with the currently connected user.
	 * This method fetches projects linked to the employee and user ID, then transforms
	 * the data using the `userWorkProjectsTransformer`.
	 *
	 * @returns {Promise<IUserProjectsDataResponse>} A promise that resolves with the user's projects data.
	 * @throws {BadRequestException} If an error occurs during the data retrieval or transformation process.
	 *
	 */
	async findUserProjectsData(): Promise<IUserProjectsDataResponse> {
		try {
			const employeeId = defaultEmployeeId(); // TODO : Change this with real connected employee ID
			const userId = defaultUserId(); // TODO : Change this with real connected user ID
			const userProjects =
				await this._projectService.getExternalProjectsByEmployee(
					employeeId,
					['members.employee.user', 'tasks.members'],
				);

			return userWorkProjectsTransformer(
				userProjects,
				employeeId,
				userId,
			);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves and groups issues assigned to a user based on the specified grouping option.
	 * This method fetches issues assigned to the current employee and organizes them into groups,
	 * such as by state or other criteria provided in the options.
	 *
	 * @param {IIssueFindInput} options - The input options specifying the grouping criteria.
	 *
	 * @returns A promise that resolves to an array of grouped issues.
	 * Each group is structured based on the specified grouping option.
	 *
	 * @throws {BadRequestException} Throws if an error occurs during issue retrieval or processing.
	 */
	async findUserGroupedIssueAssigned(options: IIssueFindInput) {
		try {
			const { assignees, created_by, group_by, order_by, subscriber } =
				options;
			let assignedIssues: ITask[] = [];
			const relations = ['taskStatus'];

			if (assignees) {
				assignedIssues =
					await this._issueService.findExternalByEmployee(
						assignees,
						relations,
						order_by,
					);
			} else if (created_by) {
				const createdTasks = await this._issueService.findAllExternal(
					{
						creatorId: defaultUserId(), // TODO : Change here with current autheticated user.
					},
					relations,
					order_by,
				);
				assignedIssues = createdTasks.items;
			} else if (subscriber) {
				assignedIssues = await this.findUserSubscribedIssues(
					relations,
					order_by,
				);
			}

			const issuesWithLinks = await Promise.all(
				assignedIssues.map(async (issue) => {
					const issueLinks = await this._issueLinkService.findAll(
						issue.id,
					);

					const transformedIssueLinks =
						issueLinkTransformer(issueLinks);

					return {
						issue,
						issueLinks: transformedIssueLinks,
					};
				}),
			);

			if (group_by === IssueGroupBy.STATE_GROUP) {
				return groupIssuesByStateGroup(issuesWithLinks);
			}

			if (group_by === IssueGroupBy.PRIORITY) {
				return groupIssuesByPriority(issuesWithLinks);
			}

			if (group_by === IssueGroupBy.PROJECT_ID) {
				return groupIssuesByProjectId(issuesWithLinks);
			}

			if (group_by === IssueGroupBy.LABEL_ID) {
				return groupIssuesByLabel(issuesWithLinks);
			}

			return userWorkNonGroupedIssues(issuesWithLinks);
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	async findUserSubscribedIssues(
		relations?: string[],
		order_by?: IssueOrderByField,
	) {
		const tasks = await this._issueService.findAllExternal(
			{},
			relations,
			order_by,
		);

		const subscriptions = await this._subscriptionService.findAll({
			entity: BaseEntityEnum.Task,
			userId: defaultUserId(),
		}); // TODO : Make sure we pass correct userId
		const subscribedTaskIds = subscriptions.map(
			(subscription) => subscription.entityId,
		);
		return tasks.items.filter((task) =>
			subscribedTaskIds.includes(task.id),
		);
	}

	/**
	 * Fetches all workspace states associated with projects in the workspace.
	 * This method retrieves all projects in the workspace, then queries each project's states,
	 * consolidating them into a single array.
	 *
	 * @returns A promise resolving to an array of workspace states.
	 * Each state corresponds to a specific project within the workspace.
	 *
	 * @throws {BadRequestException} Throws if an error occurs during project or state retrieval.
	 */

	async findWorkspaceStates() {
		try {
			const projects = await this._projectService.getExternalProjects([
				'statuses',
			]);

			const states = projects.map((project) => project.statuses);

			return getStatesTransformer(states.flat());
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Fetches all workspace modules associated with projects in the workspace.
	 * This method retrieves all projects within the workspace and then queries
	 * each project's modules, consolidating them into a single array.
	 *
	 * @returns {Promise<IModule[]>} A promise resolving to an array of project modules.
	 * Each module corresponds to a specific project within the workspace.
	 *
	 * @throws {BadRequestException} Throws if an error occurs during project or module retrieval.
	 */
	async findWorkspaceModules(): Promise<IModule[]> {
		try {
			const projects = await this._projectService.getExternalProjects([
				'modules',
			]);

			const modules = projects.map((project) => project.modules).flat();

			const transformedModules = modulesTransformer(
				Array.isArray(modules) ? modules : modules,
			);

			return Array.isArray(transformedModules)
				? transformedModules
				: [transformedModules];
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Fetches all cycles associated with projects in the workspace.
	 * This method retrieves all projects within the workspace and then queries
	 * each project's cycles, consolidating them into a single array.
	 *
	 * @returns {Promise<ICycle[]>} A promise resolving to an array of cycles.
	 * Each cycle corresponds to a specific project within the workspace.
	 *
	 * @throws {BadRequestException} Throws if an error occurs during project or cycle retrieval.
	 */
	async findWorkspaceCycles(): Promise<ICycle[]> {
		try {
			const projects = await this._projectService.getExternalProjects([
				'organizationSprints',
			]);

			const cycles = projects
				.map((project) => project.organizationSprints)
				.flat();

			const transformedSprints = cycleTransformer(
				Array.isArray(cycles) ? cycles : cycles,
			);

			return Array.isArray(transformedSprints)
				? transformedSprints
				: [transformedSprints];
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves all labels associated with the projects in the workspace.
	 * This method fetches all projects along with their tags and transforms the tags
	 * into issue labels, consolidating them into a single array.
	 *
	 * @returns {Promise<IIssueLabel[]>} A promise resolving to an array of issue labels (`IIssueLabel[]`),
	 * each associated with a specific project in the workspace.
	 *
	 * @throws {BadRequestException} Throws if an error occurs during project or label retrieval.
	 */
	async findWorkspaceLabels(): Promise<IIssueLabel[]> {
		try {
			const projects = await this._projectService.getExternalProjects([
				'tags',
			]);

			const labels: IIssueLabel[] = projects
				.map((project) => {
					const transformed = issueLabelsTransformer(
						project.tags,
						project.id,
					);
					return Array.isArray(transformed)
						? transformed
						: [transformed];
				})
				.flat();

			return labels;
		} catch (error) {
			console.error(error);
			throw new BadRequestException(error);
		}
	}
}
