import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable
} from '@nestjs/common';
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
	IssueGroupByEnum,
	IIssueFindInput,
	IModule,
	ICycle,
	IIssueLabel,
	IssueOrderByField,
	IIssueCreateInput,
	IIssueUpdateInput,
	EmployeeSettingTypeEnum,
	IGlobalEntitiesResponse,
	IGlabalEntitiesFindInput,
	IEntitySearchFindInput,
	IUnreadNotificationResponse,
	INotificationResponse,
	INotification,
	IEmployeeSetting
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	currentEmployeeId,
	cycleTransformer,
	dashboardTransformer,
	DEFAULT_DASHBOARD_WIDGETS,
	getCurrentOrganizationSlug,
	currentUserId,
	extractWorkspaceViewIdFromReferer,
	getProjectsResponse,
	getStatesTransformer,
	getTaskCounts,
	groupIssuesByLabel,
	groupIssuesByPriority,
	groupIssuesByProjectId,
	groupIssuesByStateGroup,
	issueActivityLogTransformer,
	issueFilterSplitter,
	issueLabelsTransformer,
	issueLinkTransformer,
	issuesByPriority,
	issueTransformer,
	MEMBER_DEFAULT_VIEW_PROPS,
	modulesTransformer,
	userIssuesByPriority,
	userWorkNonGroupedIssues,
	userWorkProjectsTransformer,
	widgetTargetDateTransformer,
	widgetTransformer,
	currentTenantId,
	memberPropertiesSerializer,
	notificationTranformer,
	unreadNotificationData
} from '../../config';
import {
	getOrganizationQuery,
	organizationMembersTransformer
} from '../../config';
import { ProjectService } from '../project/project.service';
import { IssuesService } from '../issues/issues.service';
import { ActivityService } from '../activity/activity.service';
import { IssueLinksService } from '../issue-links/issue-links.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { DraftIssuesService } from '../issues/draft-issues/draft-issues.service';
import { EmployeePropertiesService } from '../employee-properties/employee-properties.service';
import { CyclesService } from '../cycles/cycles.service';
import { ProjectModuleService } from '../project-module/project-module.service';
import { IssueViewService } from '../views/view.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { WidgetService } from '../dashboard/widget.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class WorkspaceService extends ApiFetchService {
	constructor(
		@Inject(forwardRef(() => ProjectService))
		private readonly _projectService: ProjectService,
		private readonly _issueService: IssuesService,
		private readonly _cycleService: CyclesService,
		private readonly _projectModuleService: ProjectModuleService,
		private readonly _issueViewService: IssueViewService,
		private readonly _activityService: ActivityService,
		private readonly _issueLinkService: IssueLinksService,
		private readonly _subscriptionService: SubscriptionService,
		private readonly _draftIssueService: DraftIssuesService,
		private readonly _employeePropertiesService: EmployeePropertiesService,
		private readonly _dashboardService: DashboardService,
		private readonly _widgetService: WidgetService,
		private readonly _notificationService: NotificationService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

	/**--------------------------------------------------------------
     * This function handlers should be updated after implementing authentication
     *--------------------------------------------------------------/
	/**
	 * @description - Get dashboard widgets for given workspace
	 * @param {string} dashboard_type - query that define which widget filter should be fetched
	 * @returns - A promise that resolves when dashboard widgets are fetched
	 * @memberof WorkspaceService
	 */
	async getDashboard(dashboard_type: string) {
		try {
			let externalDashboard =
				await this._dashboardService.findDashboardByIdentifier(
					dashboard_type
				);

			if (!externalDashboard) {
				externalDashboard = await this._dashboardService.create({
					name: 'home',
					identifier: 'home',
					description: 'Default home dashboard for plane',
					organizationId: getCurrentOrganizationSlug()
				});
			}

			let transformedWidgets = widgetTransformer(
				externalDashboard.widgets
			);

			if (externalDashboard.widgets.length === 0) {
				const widgets = DEFAULT_DASHBOARD_WIDGETS;
				try {
					transformedWidgets = (
						await Promise.all(
							widgets.map(async (widget) => {
								return await this._widgetService.create({
									name: widget.key,
									isVisible: widget.is_visible,
									options: widget.widget_filters,
									dashboardId: externalDashboard.id,
									organizationId:
										externalDashboard.organizationId
								});
							})
						)
					).flat();
				} catch (error: any) {
					// console.log(error.response);
					throw new BadRequestException(error.response);
				}
			}

			// If found, return the serialized dashboard
			return {
				dashboard: dashboardTransformer(externalDashboard),
				widgets: transformedWidgets
			};
		} catch (error: any) {
			// console.log(error.response);
			throw new BadRequestException(error.response);
		}
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
		issue_type?: DashboardIssueTypeEnum
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
					issue_type
				);
				return { issues: issues.slice(0, 5), count: issues.length };
			},

			[DashboardWigetQueryEnum.ASSIGNED_ISSUES]: async () => {
				const issues = await this.findMyAssignedIssues(
					target_date,
					issue_type
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
			}
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
	 * @returns - A promise that resolves after getting member informations
	 * @memberof WorkspaceController
	 */
	async getMembersMe() {
		const employeeId = currentEmployeeId();
		const tenantId = currentTenantId();

		try {
			let memberSetting =
				await this._employeePropertiesService.findOneByOptions({
					employeeId,
					entity: BaseEntityEnum.Tenant,
					entityId: tenantId,
					settingType: EmployeeSettingTypeEnum.TASK_VIEWS
				});

			if (!memberSetting) {
				// Create default settings if none exist
				memberSetting = await this.createDefaultSettings(
					tenantId,
					employeeId
				);
			}

			return memberPropertiesSerializer(memberSetting, employeeId);
		} catch (error) {
			console.warn(
				'Failed to retrieve settings, creating new ones...',
				error
			);

			try {
				// Create default settings in case of error
				const memberSetting = await this.createDefaultSettings(
					tenantId,
					employeeId
				);
				return memberPropertiesSerializer(memberSetting, employeeId);
			} catch (creationError) {
				console.error(
					'Failed to create new view properties',
					creationError
				);
				throw new BadRequestException(
					'Failed to find or create new view properties'
				);
			}
		}
	}

	private async createDefaultSettings(
		tenantId: ID,
		employeeId: ID
	): Promise<IEmployeeSetting> {
		const settingViewProps = {
			...MEMBER_DEFAULT_VIEW_PROPS,
			issue_props: {
				created: true,
				assigned: true,
				all_issues: true,
				subscribed: true
			}
		};

		await this._employeePropertiesService.create({
			entity: BaseEntityEnum.Tenant,
			entityId: tenantId,
			settingType: EmployeeSettingTypeEnum.TASK_VIEWS,
			data: settingViewProps,
			defaultData: settingViewProps,
			employee: { id: employeeId },
			employeeId
		});

		// Retourner les paramètres après la création
		return await this._employeePropertiesService.findOneByOptions({
			employeeId,
			entity: BaseEntityEnum.Tenant,
			entityId: tenantId,
			settingType: EmployeeSettingTypeEnum.TASK_VIEWS
		});
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
				path: `/organization/${getCurrentOrganizationSlug()}`,
				query
			})
		).data;

		return organizationMembersTransformer(organization);
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
							['taskStatus']
						);
					const { startedIssues, unstartedIssues } =
						getTaskCounts(tasks);

					return {
						user_id: employee.member.id,
						active_issue_count: startedIssues + unstartedIssues
					};
				})
			);
			return collaborators.sort(
				(a, b) => b.active_issue_count - a.active_issue_count
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
			DashboardIssueTypeEnum.COMPLETED
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
			created_issues_count: created.length
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
		employee?: ID
	) {
		const employeeId = employee || currentEmployeeId();
		return this.getIssues(
			employeeId,
			'employeeId',
			target_date,
			issue_type
		);
	}

	async findMyCreatedIssues(
		target_date?: string,
		issue_type?: DashboardIssueTypeEnum
	) {
		const userId = currentUserId();
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
		target_date?: string
	): Promise<{ state: string; count: number }[]> {
		try {
			let tasks: ITask[] =
				await this._issueService.findExternalByEmployee(
					currentEmployeeId(),
					['taskStatus']
				);

			if (target_date) {
				const { dueDateFrom, dueDateTo } =
					widgetTargetDateTransformer(target_date);

				tasks = await this._issueService.findByStartAndDueDate({
					dueDateFrom,
					dueDateTo,
					relations: ['members'],
					employeeId: currentEmployeeId()
				});
			}

			// Get task counts based on their states
			const {
				backlogIssues,
				completedIssues,
				startedIssues,
				unstartedIssues
			} = getTaskCounts(tasks);

			// Return the task counts grouped by state
			return [
				{ state: 'backlog', count: backlogIssues },
				{ state: 'unstarted', count: unstartedIssues },
				{ state: 'started', count: startedIssues },
				{ state: 'completed', count: completedIssues },
				{ state: 'cancelled', count: 0 } // Assuming 0 cancelled issues as not specified
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
		target_date?: string
	): Promise<{ priority: string; count: number }[]> {
		try {
			let tasks: ITask[] =
				await this._issueService.findExternalByEmployee(
					currentEmployeeId(),
					['taskStatus']
				);

			if (target_date) {
				const { dueDateFrom, dueDateTo } =
					widgetTargetDateTransformer(target_date);

				tasks = await this._issueService.findByStartAndDueDate({
					dueDateFrom,
					dueDateTo,
					relations: ['members'],
					employeeId: currentEmployeeId()
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
	async findRecentIssueActivity(
		length?: number,
		employeeId?: ID
	): Promise<any> {
		try {
			const activityLogs = await this._activityService.findAll({
				entity: BaseEntityEnum.Task,
				creatorId: currentUserId() || employeeId
			});

			const issueActivities = await Promise.all(
				activityLogs.map(async (activityLog) => {
					const task = await this._issueService.getExternalIssue(
						activityLog.entityId,
						[
							'project.members.employee.user.role',
							'organizationSprint'
						]
					);

					if (task.projectId) {
						const { actor, issue, project, workspace } =
							await this._issueService.getIssueCommentDetails(
								task.id,
								task.projectId,
								activityLog.employeeId,
								task,
								task.project
							);

						const transformedActivityLogs =
							issueActivityLogTransformer(
								activityLog,
								issue,
								actor,
								project,
								workspace,
								issue.cycle
							);

						return Array.isArray(transformedActivityLogs)
							? transformedActivityLogs
							: [transformedActivityLogs];
					}
				})
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
		issue_type?: DashboardIssueTypeEnum
	) {
		try {
			let tasks: (ITask | IIssue)[];
			const dateRangesRelations = [
				'taskStatus',
				'linkedIssues.taskTo',
				'linkedIssues.taskFrom'
			];
			const relations = [
				'members.user',
				'createdByUser',
				'project.members.employee.user.role',
				...dateRangesRelations
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
						employeeId: id // Explicitly specify employeeId
					});
				} else {
					tasks = await this._issueService.findByStartAndDueDate({
						dueDateFrom,
						dueDateTo,
						relations: dateRangesRelations,
						createdByUserId: id // Explicitly specify creatorId
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
						relations
					); // Directly pass the employeeId
				} else {
					tasks = await this._issueService.findAll(
						{ createdByUserId: id },
						relations
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
		issue_type?: DashboardIssueTypeEnum
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
	async findUserWorkSummary(employeeId: ID): Promise<IUserStatsResponse> {
		try {
			const assignedIssues =
				await this._issueService.findExternalByEmployee(employeeId, [
					'taskStatus'
				]);

			const subscribedIssues = await this.findUserSubscribedIssues([]);

			const {
				completedIssues,
				backlogIssues,
				startedIssues,
				unstartedIssues
			} = getTaskCounts(assignedIssues);

			const createdIssues = await this.findMyCreatedIssues();

			return {
				state_distribution: [
					{ state_group: 'backlog', state_count: backlogIssues },
					{ state_group: 'unstarted', state_count: unstartedIssues },
					{ state_group: 'started', state_count: startedIssues },
					{ state_group: 'completed', state_count: completedIssues }
				],
				priority_distribution: userIssuesByPriority(assignedIssues),
				created_issues: createdIssues.length,
				assigned_issues: assignedIssues.length,
				completed_issues: completedIssues,
				pending_issues: backlogIssues + startedIssues + unstartedIssues,
				subscribed_issues: subscribedIssues.length || 0,
				present_cycles: [],
				upcoming_cycles: []
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
	async findUserRecentActivity(
		per_page: number,
		employeeId: ID
	): Promise<any> {
		try {
			const activities = await this.findRecentIssueActivity(
				per_page,
				employeeId
			);
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
				results: activities
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
	async findUserProjectsData(
		employeeId: ID
	): Promise<IUserProjectsDataResponse> {
		try {
			const userId = currentUserId();
			const userProjects =
				await this._projectService.getExternalProjectsByEmployee(
					employeeId,
					['members.employee.user', 'tasks.members']
				);

			return userWorkProjectsTransformer(
				userProjects,
				employeeId,
				userId
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
						issueFilterSplitter(assignees)[0],
						relations,
						order_by
					);
			} else if (created_by) {
				const createdTasks = await this._issueService.findAllExternal(
					{
						createdByUserId: currentUserId()
					},
					relations,
					order_by
				);
				assignedIssues = createdTasks.items;
			} else if (subscriber) {
				assignedIssues = await this.findUserSubscribedIssues(
					relations,
					order_by
				);
			} else {
				assignedIssues = (
					await this._issueService.findAllExternal(
						{},
						relations,
						order_by
					)
				).items.filter((task) => task.projectId);
			}

			const issuesWithLinks = await Promise.all(
				(assignedIssues ?? []).map(async (issue) => {
					const issueLinks = await this._issueLinkService.findAll(
						issue.id
					);

					const transformedIssueLinks =
						issueLinkTransformer(issueLinks);

					return {
						issue,
						issueLinks: transformedIssueLinks
					};
				})
			);

			if (group_by === IssueGroupByEnum.STATE_GROUP) {
				return groupIssuesByStateGroup(issuesWithLinks);
			}

			if (group_by === IssueGroupByEnum.PRIORITY) {
				return groupIssuesByPriority(issuesWithLinks);
			}

			if (group_by === IssueGroupByEnum.PROJECT_ID) {
				return groupIssuesByProjectId(issuesWithLinks);
			}

			if (group_by === IssueGroupByEnum.LABEL_ID) {
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
		order_by?: IssueOrderByField
	) {
		const tasks = await this._issueService.findAllExternal(
			{},
			relations,
			order_by
		);

		const subscriptions = await this._subscriptionService.findAll({
			entity: BaseEntityEnum.Task,
			userId: currentUserId()
		});
		const subscribedTaskIds = subscriptions.map(
			(subscription) => subscription.entityId
		);
		return tasks.items.filter((task) =>
			subscribedTaskIds.includes(task.id)
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
				'statuses'
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
				'modules'
			]);

			const modules = projects.map((project) => project.modules).flat();

			const transformedModules = modulesTransformer(
				Array.isArray(modules) ? modules : [modules]
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
				'organizationSprints'
			]);

			const cycles = projects
				.map((project) => project.organizationSprints)
				.flat();

			const transformedSprints = cycleTransformer(
				Array.isArray(cycles) ? cycles : [cycles]
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
				'tags'
			]);

			const labels: IIssueLabel[] = projects
				.map((project) => {
					const transformed = issueLabelsTransformer(
						project.tags,
						project.id
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

	/*
	|--------------------------------------------------------------------------
	| DRAFT ISSUES
	|--------------------------------------------------------------------------
	*/

	/**
	 * Creates a new draft issue.
	 * @param {IIssueCreateInput} input - The input data required to create a draft issue.
	 * @returns {Promise<IIssue>} A promise that resolves to the newly created draft issue.
	 */
	async createDraftIssue(input: IIssueCreateInput): Promise<IIssue> {
		return await this._draftIssueService.create(input);
	}

	/**
	 * Updates an issue with the given ID and input data, ensuring it remains a draft.
	 *
	 * @param {ID} id - The unique identifier of the issue to update.
	 * @param {IIssueUpdateInput} input - The data to update the issue with.
	 * @returns {Promise<IIssue>} A promise that resolves to the updated issue.
	 */
	async updateDraftIssue(id: ID, input: IIssueUpdateInput): Promise<IIssue> {
		return await this._draftIssueService.update(id, input);
	}

	/**
	 * Retrieves all draft issues.
	 *
	 * @returns {Promise<any>} A promise that resolves to a list of transformed issues.
	 */
	async findDraftIssues(): Promise<any> {
		return await this._draftIssueService.findAll();
	}

	async draftToIssue(id: ID, input: IIssueUpdateInput): Promise<IIssue> {
		return await this._draftIssueService.dratfToIssue(id, input);
	}

	/*
	|--------------------------------------------------------------------------
	| GLOBAL SEARCH
	|--------------------------------------------------------------------------
	*/

	/**
	 * Finds global entities based on search criteria across various domains.
	 *
	 * @param {IGlabalEntitiesFindInput} options - Search options, including project ID and search term.
	 * @returns {Promise<IGlobalEntitiesResponse>} A response containing filtered results across multiple entities.
	 * @throws {BadRequestException} Throws if the operation fails.
	 */
	async findGlobalEntitiesBySearch(
		options: IGlabalEntitiesFindInput
	): Promise<IGlobalEntitiesResponse> {
		try {
			// Retrieve and serialize projects
			const projects = await this._projectService.getExternalProjects([]);
			const serializedProjects = getProjectsResponse(projects);

			// Retrieve and serialize tasks (issues)
			const issues = await this._issueService.findAllExternal(
				options.project_id ? { projectId: options.project_id } : {},
				['project', 'tenant']
			);
			const serializedIssues = issues.items.map((task) =>
				issueTransformer(task)
			);

			// Retrieve and serialize cycles
			const cycles = await this._cycleService.findAll(options.project_id);
			const serializedCycles = Array.isArray(cycles) ? cycles : [cycles];

			// Retrieve and serialize project modules
			const modules =
				await this._projectModuleService.getAllModulesByProject(
					options.project_id
				);
			const serializedModules = Array.isArray(modules)
				? modules
				: [modules];

			// Retrieve and serialize views
			const views = await this._issueViewService.findAll(
				options.project_id
			);
			const serializedViews = Array.isArray(views) ? views : [views];

			const searchTerm = options.search.toLowerCase();

			return {
				results: {
					workspace: [], // TODO : Integrate workspaces APIs
					project: this.filterByName(searchTerm, serializedProjects),
					issue: this.filterByName(searchTerm, serializedIssues),
					cycle: this.filterByName(searchTerm, serializedCycles),
					module: this.filterByName(searchTerm, serializedModules),
					issue_view: this.filterByName(searchTerm, serializedViews),
					page: [] // Placeholder for future integration
				}
			};
		} catch (error: any) {
			console.log(error.respoonse);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Filters entities based on a search term in a specified key.
	 * @param searchTerm The term to search for.
	 * @param entities The array of entities to filter.
	 * @param key The key in each entity object where the search will be performed. Default is 'name'.
	 * @returns Filtered array of entities.
	 */
	private filterByName(
		searchTerm: string,
		entities: any[],
		key: string = 'name'
	) {
		return entities.filter((entity) =>
			entity[key]?.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}

	/**
	 * Performs an entity search based on the provided options.
	 *
	 * Currently, this function supports the `user_mention` query type, which retrieves
	 * project members and maps their details into a simplified format for user mentions.
	 *
	 * @param {IEntitySearchFindInput} options - The search options containing `project_id`
	 * and `query_type`.
	 * @returns {Promise<any>} A promise resolving to an object containing the user mention details.
	 * @throws {BadRequestException} Throws a BadRequestException if an error occurs during the process.
	 */
	async entitySearch(options: IEntitySearchFindInput): Promise<any> {
		try {
			const { project_id, query_type } = options;

			if (query_type === 'user_mention') {
				const project = await this._projectService.getProject(
					project_id,
					['members.employee.user']
				);
				const members = project.members;

				return {
					user_mention: members.map((member) => ({
						member__display_name: member.member__display_name,
						member__id: member.member_id,
						member__avatar_url: member.member__avatar
					}))
				};
			}
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/*
	|--------------------------------------------------------------------------
	| VIEWS
	|--------------------------------------------------------------------------
	*/

	/**
	 * Retrieves issues based on the provided options and the referer.
	 *
	 * If a `viewId` can be extracted from the referer, the function retrieves all issues
	 * associated with a specific project using the `_issueService`. If no `viewId` is found,
	 * the function fetches issues grouped by user assignment.
	 *
	 * @async
	 * @param {IIssueFindInput} options - The search options for filtering issues.
	 * @param {string} referer - The referer URL, used to extract a workspace view ID.
	 * @returns A promise resolving to the issues, either grouped by user
	 * assignment or retrieved by project.
	 * @throws {BadRequestException} Throws a BadRequestException if an error occurs during
	 * the process.
	 */
	async findViewIssues(options: IIssueFindInput, referer: string) {
		try {
			// Extract the view ID from the referer if it exists
			const viewId = extractWorkspaceViewIdFromReferer(referer);

			if (!viewId) {
				return this.findUserGroupedIssueAssigned(options);
			}

			return this._issueService.getAllIssuesByProject(
				null,
				options,
				referer
			);
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error.response);
		}
	}

	/*
	|--------------------------------------------------------------------------
	| NOTIFICATIONS ROUTES
	|--------------------------------------------------------------------------
	*/
	/**
	 * Fetches the notifications for the current user.
	 *
	 * @async
	 * @returns {Promise<INotificationResponse>} A promise that resolves to the notification response.
	 */
	async findUserNotification(): Promise<INotificationResponse> {
		try {
			const employeeId = currentEmployeeId();

			const userNotifications = await this._notificationService.findAll({
				receiverId: employeeId,
				entity: BaseEntityEnum.Task
			});

			const notifications = await Promise.all(
				(userNotifications ?? []).map(async (notification) => {
					const task = await this._issueService.getExternalIssue(
						notification.entityId,
						['members', 'project.members.employee.user']
					);

					const tranformedNotification = notificationTranformer(
						notification,
						task
					);

					return Array.isArray(tranformedNotification)
						? tranformedNotification
						: [tranformedNotification];
				})
			);

			const results = notifications.flat();

			return {
				grouped_by: null,
				sub_grouped_by: null,
				total_count: results.length,
				next_cursor: '300:1:0',
				prev_cursor: '300:-1:1',
				next_page_results: false,
				prev_page_results: false,
				count: results.length,
				total_pages: 1,
				total_results: results.length,
				extra_stats: null,
				results
			};
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Fetches the unread notifications for the current user.
	 *
	 * @async
	 * @returns {Promise<IUnreadNotificationResponse>} A promise that resolves to the unread notification data.
	 */
	async findUnreadNotifications(): Promise<IUnreadNotificationResponse> {
		try {
			const receiverId = currentEmployeeId();
			const userNotifications = await this._notificationService.findAll({
				receiverId,
				entity: BaseEntityEnum.Task,
				isRead: false
			});

			return unreadNotificationData(userNotifications);
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Updates a notification to be on hold until a specified date.
	 *
	 * @async
	 * @param {ID} id - The ID of the notification to update.
	 * @param {INotification} input - The input object containing the snoozed_till date.
	 * @returns {Promise<any>} A promise that resolves to the result of the update operation.
	 */
	async holdNotification(id: ID, input: INotification): Promise<any> {
		return await this._notificationService.update(id, {
			onHoldUntil: input.snoozed_till ?? null
		});
	}

	/**
	 * Marks all notifications as read.
	 *
	 * @async
	 * @returns {Promise<any>} A promise that resolves to the response data.
	 */
	async markAllAsRead(): Promise<any> {
		return await this._notificationService.markAllAsRead();
	}

	/**
	 * Archives a notification.
	 *
	 * @async
	 * @param {ID} id - The ID of the notification to archive.
	 * @returns {Promise<any>} A promise that resolves to the result of the archive operation.
	 */
	async archiveNotification(id: ID): Promise<any> {
		return this._toggleNotificationStatus(id, 'isArchived', true);
	}

	/**
	 * Unarchives a notification.
	 *
	 * @async
	 * @param {ID} id - The ID of the notification to unarchive.
	 * @returns {Promise<any>} A promise that resolves to the result of the unarchive operation.
	 */
	async unArchiveNotification(id: ID): Promise<any> {
		return this._toggleNotificationStatus(id, 'isArchived', false);
	}

	/**
	 * Marks a notification as read and returns the updated notification.
	 *
	 * @async
	 * @param {ID} id - The ID of the notification to mark as read.
	 * @returns {Promise<INotification>} A promise that resolves to the updated notification.
	 */
	async readNotification(id: ID): Promise<INotification> {
		return this._toggleNotificationStatus(id, 'isRead', true);
	}

	/**
	 * Marks a notification as unread and returns the updated notification.
	 *
	 * @async
	 * @param {ID} id - The ID of the notification to mark as read.
	 * @returns {Promise<INotification>} A promise that resolves to the updated notification.
	 */
	async unreadNotification(id: ID): Promise<INotification> {
		return this._toggleNotificationStatus(id, 'isRead', false);
	}

	/**
	 * Toggles the status of a notification.
	 *
	 * @private
	 * @async
	 * @param {ID} id - The ID of the notification to toggle.
	 * @param {'isRead' | 'isArchived'} statusKey - The key of the status to toggle.
	 * @param {boolean} statusValue - The value of the status to toggle.
	 * @returns {Promise<INotification>} A promise that resolves to the updated notification.
	 */
	private async _toggleNotificationStatus(
		id: ID,
		statusKey: 'isRead' | 'isArchived',
		statusValue: boolean
	): Promise<INotification> {
		try {
			const timestampKey =
				statusKey === 'isRead' ? 'readAt' : 'archivedAt';

			await this._notificationService.update(id, {
				[statusKey]: statusValue,
				[timestampKey]: statusValue ? new Date() : null
			});

			const updatedNotification =
				await this._notificationService.findOne(id);
			const task = await this._issueService.getExternalIssue(
				updatedNotification.entityId,
				['members', 'project.members.employee.user']
			);

			const transformedNotification = notificationTranformer(
				updatedNotification,
				task
			);

			return Array.isArray(transformedNotification)
				? transformedNotification[0]
				: transformedNotification;
		} catch (error) {
			console.error(error);
			throw new BadRequestException(error);
		}
	}
}
