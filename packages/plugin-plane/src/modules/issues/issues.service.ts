import {
	Injectable,
	BadRequestException,
	Inject,
	forwardRef
} from '@nestjs/common';
import qs from 'qs';
import {
	BaseEntityEnum,
	ICommentFindInput,
	ICreateCommentInput,
	ICreatedIssueRelation,
	ICreateIssueLink,
	ICreateIssueRelationInput,
	ICreateReactionInput,
	ID,
	IDeleteRelationInput,
	IIssue,
	IIssueActivity,
	IIssueComment,
	IIssueCreateInput,
	IIssueFindInput,
	IIssueLabel,
	IIssueLink,
	IIssueUpdateInput,
	IOrganizationProject,
	IPagination,
	IReaction,
	IReactionData,
	IssueActivityTypeEnum,
	IssueGroupByEnum,
	IssueOrderByField,
	IState,
	ISubIssueResponse,
	ISubscriber,
	ITask,
	ITaskDateFilterInput,
	IEmployee,
	ReactionEntityEnum,
	TaskStatusEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	createIssueInputTransformer,
	currentUserId,
	extractViewIdFromReferer,
	extractWorkspaceViewIdFromReferer,
	filterIssuesByActiveType,
	filterIssuesByPriorityNames,
	filterTasksByDateCriteria,
	getFilteredByDatesTaskQuery,
	getTaskDistribution,
	getTaskQuery,
	groupIssuesByAssignee,
	groupIssuesByCreatorId,
	groupIssuesByCycleId,
	groupIssuesByLabel,
	groupIssuesByModule,
	groupIssuesByPriority,
	groupIssuesByStateId,
	groupIssuesByTargetDate,
	issueActivityLogTransformer,
	issueCommentTrasnsformer,
	issueFilterSplitter,
	issueLinksActivities,
	issueLinkTransformer,
	issueRelationActivities,
	issueTransformer,
	nonGroupedIssues,
	reactionTransformer,
	subscriptionTransformer,
	updateIssueInputTransformer
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { StatesService } from '../states/states.service';
import { CommentsService } from '../comments/comments.service';
import { ProjectService } from '../project/project.service';
import { ReactionsService } from '../reactions/reactions.service';
import { IssueRelationsService } from '../issue-relations/issue-relations.service';
import { IssueLinksService } from '../issue-links/issue-links.service';
import { ActivityService } from '../activity/activity.service';
import { IssueLabelsService } from './issue-labels/issue-labels.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { MentionService } from '../mention/mention.service';

@Injectable()
export class IssuesService extends ApiFetchService {
	constructor(
		@Inject(forwardRef(() => ProjectService))
		private readonly _projectService: ProjectService,
		private readonly _stateSerive: StatesService,
		private readonly _issueLabelService: IssueLabelsService,
		private readonly _commentService: CommentsService,
		private readonly _reactionService: ReactionsService,
		private readonly _issueLinkService: IssueLinksService,
		private readonly _issueRelationService: IssueRelationsService,
		private readonly _activityService: ActivityService,
		private readonly _subscriptionService: SubscriptionService,
		private readonly _mentionService: MentionService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/tasks';

	/**
	 * @description - Get remode API issue
	 * @param {ID} id - The issue ID
	 * @returns - A promise that resolved after getting issue
	 * @memberof IssuesService
	 */
	async getExternalIssue(
		id: ID,
		relations?: string[],
		isDraft?: boolean
	): Promise<ITask> {
		const query = qs.stringify(
			getTaskQuery(undefined, {}, relations, undefined, isDraft)
		);
		return (
			await this.apiFetch({
				path: `${this.path}/${id}`,
				method: 'GET',
				query
			})
		).data;
	}

	/**
	 * Retrieves all tasks from an external source with optional filters.
	 *
	 * Sends a GET request to an external API to fetch tasks based on the provided options.
	 *
	 * @param {ITask} options - Optional task filters or configurations to customize the query.
	 * @returns {Promise<IPagination<ITask>>} A promise that resolves to an array of tasks.
	 * @throws {BadRequestException} If an error occurs during the fetch.
	 */
	async findAllExternal(
		options: IIssueFindInput,
		relations?: string[],
		orderByField?: IssueOrderByField,
		isDraft: boolean = false
	): Promise<IPagination<ITask>> {
		try {
			const query = qs.stringify(
				getTaskQuery(undefined, options, relations, orderByField, isDraft)
			);

			return (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves tasks assigned to a specific employee from an external source.
	 *
	 * Sends a GET request to fetch tasks for the specified employee ID.
	 *
	 * @param {ID} employeeId - The ID of the employee for whom the tasks are being retrieved.
	 * @returns {Promise<ITask[]>} A promise that resolves to an array of tasks assigned to the specified employee.
	 * @throws {BadRequestException} If an error occurs during the fetch.
	 */
	async findExternalByEmployee(
		employeeId: ID,
		relations?: string[],
		orderByField?: IssueOrderByField
	): Promise<ITask[]> {
		try {
			// Build query for task retrieval
			const query = qs.stringify(
				getTaskQuery(undefined, {}, relations, orderByField, false)
			);

			// Fetch tasks for the authenticated employee
			const tasks: ITask[] = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/employee/${employeeId}`,
					query
				})
			).data;

			return tasks;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves tasks based on the provided start and due date filters.
	 *
	 * This method builds a query dynamically based on the provided `ITaskDateFilterInput` options.
	 * It sends a GET request to fetch tasks filtered by the specified
	 * start and due date ranges or other applicable criteria.
	 *
	 * @param {ITaskDateFilterInput} options - The filtering options including start date, due date, and other possible filters.
	 * @returns {Promise<ITask[]>} A promise that resolves with an array of tasks that match the filtering criteria.
	 * @throws {BadRequestException} Throws an error if the API request fails or if the options are invalid.
	 */
	async findByStartAndDueDate(
		options: ITaskDateFilterInput
	): Promise<ITask[]> {
		try {
			// Build query for task retrieval
			const query = qs.stringify(getFilteredByDatesTaskQuery(options));

			const tasks: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/filter-by-date`,
					query
				})
			).data;

			return tasks.items;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Find issue by Id
	 * @param {ID} id - The issue ID to search
	 * @returns - A promise that resolves after issue fetched
	 * @memberof IssuesService
	 */
	async findOne(id: ID, isDraft?: boolean): Promise<IIssue> {
		try {
			const issue = await this.getExternalIssue(
				id,
				[
					'tags',
					'members.user',
					'createdByUser',
					'project.members.employee.user.role',
					'organizationSprint',
					'modules'
				],
				isDraft
			);

			if (!issue) {
				throw new BadRequestException('Issue not found');
			}

			// Find Issue Reactions
			const reactions = await this.findIssueReactions(
				{
					entityId: id,
					entity: ReactionEntityEnum.Task
				},
				issue.projectId!,
				isDraft
			);

			//Check current user subscription.
			const subscriptions = await this._subscriptionService.findAll({
				entity: BaseEntityEnum.Task,
				entityId: issue.id,
				userId: currentUserId() ?? undefined
			});
			const isSubscribed = subscriptions && subscriptions.length > 0;

			// Find issue links
			const links = await this.findIssueLinks(id, issue.projectId!, issue);

			return issueTransformer(issue, reactions, links, isSubscribed);
		} catch (error: any) {
			this.logger.error(
				`Failed to find issue: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Create issue
	 * @param {IIssueCreateInput} input - data for creating new issue
	 * @returns - A promise that resolves after issue created
	 * @memberof IssuesService
	 */
	async create(input: IIssueCreateInput): Promise<IIssue> {
		try {
			const { state_id } = input;

			// Set default status
			let state: IState = { name: TaskStatusEnum.BACKLOG };
			if (state_id && state_id.length > 0) {
				state = await this._stateSerive.getOne(input.state_id!);
			}

			const body = createIssueInputTransformer(
				input,
				state.name as TaskStatusEnum
			);

			const issue: ITask = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body
				})
			).data;

			return issueTransformer(issue);
		} catch (error: any) {
			this.logger.error(
				`Failed to create issue: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Update issue
	 * @param {IIssueCreateInput} input - data for updating issue
	 * @param {ID} id - The issue ID to be updated
	 * @returns - A promise that resolves after issue updated
	 * @memberof IssuesService
	 */
	async update(
		id: ID,
		input: IIssueUpdateInput,
		isDraft: boolean
	): Promise<IIssue> {
		try {
			// Extract modules to be added and removed from the input
			const {
				modules: added_modules = [],
				removed_modules = [],
				module_ids = []
			} = input;

			// Fetch the state only if a state_id is provided
			let state: IState | undefined;

			try {
				if (input.state_id) {
					state = await this._stateSerive.getOne(input.state_id!);
				}
			} catch (error: any) {
				this.logger.warn(
					`Failed to fetch state: ${error?.response?.data?.message || error.message}`
				);
			}

			// Retrieve the existing issue and external issue details simultaneously
			const [issue, externalIssue] = await Promise.all([
				this.findOne(id, isDraft),
				this.getExternalIssue(id, undefined, isDraft)
			]);

			if (!issue) {
				throw new BadRequestException('Issue not found');
			}

			// Find labels
			const labelResult =
				await this._issueLabelService.getProjectIssueLabels(
					issue.project_id!
				);
			const labels: IIssueLabel[] = Array.isArray(labelResult)
				? labelResult
				: [labelResult];

			// Find project
			const project = await this._projectService.getExternalProject(
				issue.project_id!,
				['modules', 'members.employee']
			);

			// Calculate the final set of modules after additions and removals
			const existingModules =
				externalIssue?.modules?.map((module) => module.id) || [];
			const modules = new Set([
				...existingModules,
				...added_modules.concat(module_ids)
			]);
			removed_modules.forEach((module) => modules.delete(module)); // Remove the modules marked for deletion

			// Transform the input data for the update request
			const body = updateIssueInputTransformer(
				input,
				state?.name as TaskStatusEnum,
				project.members?.map((member) => member.employee) as IEmployee[] | undefined,
				labels,
			Array.from(modules) as string[],
			project.modules
			);

			const task = (
				await this.apiFetch({
					path: `${this.path}/${id}`,
					method: 'PUT',
					body: {
						...body,
						title: input.name ?? issue.name,
						status: state?.name || externalIssue.status
					}
				})
			).data;

			const updatedTask = await this.getExternalIssue(task.id, undefined);

			return issueTransformer(updatedTask);
		} catch (error: any) {
			this.logger.error(
				`Failed to update issue: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Updates the parent-child relationship between a parent task and multiple sub-tasks.
	 *
	 * @param {ID} id - The ID of the parent task.
	 * @param {Pick<IIssueUpdateInput, 'sub_issue_ids'>} input - Object containing the IDs of the sub-tasks (`sub_issue_ids`).
	 * @returns {Promise<ITask[]>} - A promise that resolves to an array of updated tasks
	 * @throws {BadRequestException} - Throws an exception in case of an update error.
	 */
	async updateRelationnalIssueParent(
		id: ID,
		input: Pick<IIssueUpdateInput, 'sub_issue_ids'>
	): Promise<ISubIssueResponse> {
		try {
			const { sub_issue_ids } = input;
			const tasks: ITask[] = [];
			const subIssues: IIssue[] = await Promise.all(
				(sub_issue_ids ?? []).map(async (issueId) => {
					const issue = await this.getExternalIssue(
						issueId,
						undefined,
						false
					);

					await this.apiFetch({
						path: `${this.path}/${issueId}`,
						method: 'PUT',
						body: {
							...issue,
							parentId: id
						}
					});
					tasks.push(issue);

					return issueTransformer(issue);
				})
			);

			const stateDistribution = getTaskDistribution(tasks);

			return {
				sub_issues: subIssues,
				state_distribution: stateDistribution
			};
		} catch (error: any) {
			this.logger.error(
				`Failed to update relational issue parent: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves all issues related to a specific project, with optional filters and grouping.
	 *
	 * This function fetches issues based on the project ID, using optional parameters such as
	 * filter options and the referer to detect if the request comes from a view page.
	 * Depending on the `group_by` option, the issues are grouped accordingly before being returned.
	 *
	 * @param {ID} projectId - The ID of the project for which to retrieve issues.
	 * @param {IIssueFindInput} [options] - Optional filters and grouping options for the query.
	 * @param {string} [referer] - The referer URL, used to extract the view ID if the request is from a view page.
	 * @returns {Promise<any>} A promise that resolves to the grouped or non-grouped issues.
	 * @throws {BadRequestException} If there is an error during the API fetch or data processing.
	 */
	async getAllIssuesByProject(
		projectId?: ID,
		options?: IIssueFindInput,
		referer?: string
	): Promise<any> {
		try {
			// Extract the view ID from the referer if it exists
			const viewId =
				extractViewIdFromReferer(referer!) ??
				extractWorkspaceViewIdFromReferer(referer!);

			// Destructure options for group_by and module if provided
			const {
				group_by,
				sub_group_by,
				mentions,
				module,
				priority,
				start_date,
				target_date,
				type
			} = options!;

			// Create the query string based on the provided options and projectId
			const query = qs.stringify(
				getTaskQuery(projectId, options, undefined, undefined, false)
			);

			let path = '';
			// If a module is specified, modify the path accordingly
			if (module && !module.includes(',')) {
				path = 'module';
			}

			// Fetch tasks from the API, using the viewId if available, otherwise default to module or the base path
			const tasks: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: !viewId
						? `${this.path}/${path}` // Use module path if no viewId
						: `${this.path}/view/${viewId}`, // Use view path if viewId is present
					query
				})
			).data;

			// Extract the issues from the API response
			let issues = tasks.items;

			// Optional filter tasks by priority criteria
			if (priority) {
				const priorities = issueFilterSplitter(priority);
				issues = filterIssuesByPriorityNames(issues, priorities);
			}

			// Optional filter tasks by type (Active or Backlog)
			if (type) {
				issues = filterIssuesByActiveType(issues, type);
			}

			// Optional filter tasks by start_date string
			if (start_date) {
				issues = filterTasksByDateCriteria(
					issues,
					'startDate',
					start_date
				);
			}

			// Optional filter tasks by start_date string
			if (target_date) {
				issues = filterTasksByDateCriteria(
					issues,
					'dueDate',
					target_date
				);
			}

			if (mentions) {
				const mentionIds = issueFilterSplitter(mentions);

				try {
					const [taskParentMentionedUsers, taskMentionedUsers] =
						await Promise.all([
							this._mentionService.findAll({
								parentEntityType: BaseEntityEnum.Task
							}),
							this._mentionService.findAll({
								entity: BaseEntityEnum.Task
							})
						]);

					const taskIds = new Set([
						...taskMentionedUsers.map(
							(mention) => mention.entityId
						),
						...taskParentMentionedUsers.map(
							(mention) => mention.parentEntityId
						)
					]);

					const mentionedUserIds = new Set([
						...taskMentionedUsers.map(
							(mention) => mention.mentionedUserId
						),
						...taskParentMentionedUsers.map(
							(mention) => mention.mentionedUserId
						)
					]);

					// Filtrage des issues
					issues = issues.filter(
						(task) =>
							taskIds.has(task.id) &&
							task.members!.some(
								(member) =>
									mentionIds.includes(member.id!) &&
									mentionedUserIds.has(member.userId!)
							)
					);
				} catch (error) {
					this.logger.error(
						'Error filtering issues by mentions',
						error instanceof Error ? error.stack : String(error)
					);
				}
			}

			// Group the issues based on the group_by option, or return non-grouped issues by default
			const issuesWithLinks = await Promise.all(
				(issues ?? []).map(async (issue) => {
					const issueLinks = await this._issueLinkService.findAll(
						BaseEntityEnum.Task,
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

			const project = await this._projectService.getExternalProject(
				projectId!,
				['members.employee']
			);
			const employees = project.members!.map((member) => member.employee) as IEmployee[];
			switch (group_by) {
				case IssueGroupByEnum.STATE:
					return groupIssuesByStateId(
						issuesWithLinks,
						sub_group_by,
						employees
					); // Group issues by their state
				case IssueGroupByEnum.TARGET_DATE:
					return groupIssuesByTargetDate(issues); // Group issues by their target date
				case IssueGroupByEnum.PRIORITY:
					return groupIssuesByPriority(
						issuesWithLinks,
						sub_group_by,
						employees
					); // Group issues by their priority
				case IssueGroupByEnum.CYCLE_ID:
					return groupIssuesByCycleId(
						issuesWithLinks,
						sub_group_by,
						employees
					); // Group issues by their cycle
				case IssueGroupByEnum.MODULE_ID:
					return groupIssuesByModule(
						issuesWithLinks,
						sub_group_by,
						employees
					); // Group issues by their modules
				case IssueGroupByEnum.LABEL_ID:
					return groupIssuesByLabel(
						issuesWithLinks,
						sub_group_by,
						employees
					); // Group issues by their labels
				case IssueGroupByEnum.ASSIGNEE_ID:
					return groupIssuesByAssignee(
						issuesWithLinks,
						sub_group_by,
						employees
					); // Group issues by their assignees
				case IssueGroupByEnum.CREATED_BY:
					return groupIssuesByCreatorId(
						issuesWithLinks,
						sub_group_by,
						employees
					); // Group issues by their creator
				default:
					return nonGroupedIssues(issues); // Return issues as they are if no group_by is specified
			}
		} catch (error: any) {
			this.logger.error(
				`Failed to get all issues by project: ${error?.message}`,
				error.stack
			);
			throw new BadRequestException();
		}
	}

	/**
	 * @description Find issu children
	 * @param {ID} id - Issue ID to search
	 * @returns A promise that resolves after found issue children
	 * @memberof IssuesService
	 */
	async findIssueChildren(id: ID): Promise<ISubIssueResponse> {
		try {
			const sub_issues: IIssue[] = [];
			const issue = await this.getExternalIssue(
				id,
				['children.taskStatus', 'children.members'],
				false
			);
			if (!issue) {
				throw new BadRequestException('Issue could not be found');
			}
			if (issue.children!.length > 0) {
				const children = issue.children;
				children!.forEach((task) =>
					sub_issues.push(issueTransformer(task))
				);
			}

			const stateDistribution = getTaskDistribution(issue.children!);

			return { sub_issues, state_distribution: stateDistribution };
		} catch (error) {
			this.logger.error(
				'Failed to find issue children',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException();
		}
	}

	/**
	 * Retrieves all tasks with optional filters and options.
	 *
	 * Sends a GET request to fetch tasks with the provided query options, and
	 * transforms each task into the issue format. Returns a list of transformed tasks.
	 *
	 * @param {ITask} [options] - Optional filters or configurations for fetching tasks.
	 * @returns {Promise<IIssue[]>} A promise that resolves to a list of transformed issues.
	 * @throws {BadRequestException} If an error occurs during the fetch.
	 */
	async findAll(
		options?: ITask,
		relations?: string[],
		isDraft: boolean = false
	): Promise<IIssue[]> {
		try {
			const query = qs.stringify(
				getTaskQuery(undefined, options, relations, undefined, isDraft)
			);

			const tasks: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;

			return tasks.items?.map((task) => issueTransformer(task));
		} catch (error) {
			this.logger.error(
				'Failed to find all issues',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves tasks assigned to a specific employee.
	 *
	 * Sends a GET request to fetch tasks based on the provided employee ID,
	 * applies a transformation to each task, and returns the transformed list.
	 *
	 * @param {ID} employeeId - The ID of the employee whose tasks are to be fetched.
	 * @returns {Promise<ITask[]>} A promise that resolves to a list of transformed tasks.
	 * @throws {BadRequestException} If an error occurs during the fetch.
	 */
	async findByEmployee(
		employeeId: ID,
		relations?: string[]
	): Promise<IIssue[]> {
		try {
			const tasks = await this.findExternalByEmployee(
				employeeId,
				relations
			);

			return tasks.map((task) => issueTransformer(task));
		} catch (error: any) {
			this.logger.error(
				`Failed to find issues by employee: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Create issue relations.
	 * @param {ID} taskToId Issue ID for whom to create main relations.
	 * @param {ICreateIssueRelationInput} input - Body request data for creating main and inversed relations.
	 * @returns A promise resolved to created and transformed main relations.
	 * @memberof IssuesService
	 */
	async createIssueRelations(
		taskToId: ID,
		input: ICreateIssueRelationInput
	): Promise<ICreatedIssueRelation[]> {
		try {
			const { issues, relation_type } = input;
			return await this._issueRelationService.create(
				taskToId,
				issues,
				relation_type
			);
		} catch (error) {
			this.logger.error(
				'Failed to create issue relations',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Delete main and inverse relations
	 * @param {ID} id - Main Issue ID for delete the main relation
	 * @param {IDeleteRelationInput} input - Body Request data for related issue and relation type
	 * @returns - Delete Result
	 * @memberof IssuesService
	 */
	async deleteIssueRelation(
		id: ID,
		input: IDeleteRelationInput
	): Promise<any> {
		try {
			return await this._issueRelationService.delete(id, input);
		} catch (error: any) {
			this.logger.error(
				`Failed to delete issue relation: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Find issue relation (Issues associates)
	 * @param {ID} id - Issue ID
	 * @returns A promise resolved to fetched issue relations
	 * @memberof IssuesService
	 */
	async findIssueRelations(id: ID) {
		try {
			return await this._issueRelationService.findRelationsByIssueId(id);
		} catch (error) {
			this.logger.error(
				'Failed to find issue relations',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException();
		}
	}

	/**
	 * @description Delete issue
	 * @param {ID} id - The issue ID to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof IssuesService
	 */
	async delete(id: ID): Promise<any> {
		return (
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${id}/soft`
			})
		).data;
	}

	/**
	 * @description Create issue comment
	 * @param {ID} entityId - Issue ID for creating comment
	 * @param {ID} projectId - Project ID for returning project data
	 * @param {ICreateCommentInput} input - Body request
	 * @returns A promise resolved to comment created and returned related data
	 * @memberof IssuesService
	 */
	async createComment(
		entityId: ID,
		projectId: ID,
		input: ICreateCommentInput
	): Promise<IIssueComment> {
		try {
			const task = await this.getExternalIssue(
				entityId,
				['project.members.employee.user.role', 'project.organization'],
				false
			);

			const projectMembers = task.project!.members!.map(
				(member) => member.employee
			) as IEmployee[];

			// Create comment
			const comment = await this._commentService.create(
				{ ...input, entityName: task.title },
				BaseEntityEnum.Task,
				entityId,
				projectMembers
			);

			const { issue, project, workspace } =
				await this.getIssueCommentDetails(
					entityId,
					task.projectId!,
					comment.employee?.id!,
					task,
					task.project
				);

			const transformedComment = issueCommentTrasnsformer(
				comment,
				issue,
				project!,
				workspace,
				[], // On creation, comment has no reaction yet
				project!.members!
					.map((member) => member.employee!)
					.filter(
						(employee) =>
							employee!.userId === comment.createdByUserId
					)[0]
			);

			return Array.isArray(transformedComment)
				? transformedComment[0]
				: transformedComment;
		} catch (error) {
			this.logger.error(
				'Failed to create comment',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException();
		}
	}

	/**
	 * @description Update issue comment
	 * @param {ID} id - Comment ID to be updated
	 * @param {ID} projectId - Project ID for find details
	 * @param {ICreateCommentInput} input - Body Request data
	 * @param {ID} entityId
	 * @returns A promise resolved to updated comment and details
	 * @memberof IssuesService
	 */
	async updateComment(
		id: ID,
		projectId: ID,
		input: ICreateCommentInput,
		entityId: ID
	): Promise<IIssueComment> {
		try {
			// Update comment
			const options: ICommentFindInput = {
				entity: BaseEntityEnum.Task,
				entityId
			};
			const comment = await this._commentService.update(
				id,
				options,
				input
			);

			const updatedComment = await this._commentService.findOne(
				id,
				options
			);

			const { issue, project, workspace } =
				await this.getIssueCommentDetails(
					updatedComment.entityId,
					projectId,
					updatedComment.employeeId!
				);

			const reactions = await this._commentService.findCommentReactions(
				{
					entityId: updatedComment.id,
					entity: ReactionEntityEnum.Comment
				},
				projectId
			);

			const transformedComment = issueCommentTrasnsformer(
				updatedComment,
				issue,
				project!,
				workspace,
				reactions,
				project!.members!
					.map((member) => member.employee!)
					.filter(
						(employee) =>
							employee!.userId === comment.createdByUserId
					)[0]
			);

			return Array.isArray(transformedComment)
				? transformedComment[0]
				: transformedComment;
		} catch (error: any) {
			this.logger.error(
				`Failed to update comment: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Delete issue comment
	 * @param {ID} id -The issue comment ID to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof IssuesService
	 */
	async deleteComment(id: ID): Promise<any> {
		return await this._commentService.delete(id);
	}

	/**
	 * @description Get issues comments
	 * @param {Partial<ICommentFindInput>} options Option filters
	 * @param {ID} projectId - Project ID
	 * @returns A promise resolved after fetch comments
	 * @memberof IssuesService
	 */
	async getIssueComments(
		options: Partial<ICommentFindInput>,
		projectId: ID
	): Promise<any> {
		try {
			const comments = await this._commentService.findAll(options);

			const task = await this.getExternalIssue(
				options.entityId!,
				['project.members.employee.user.role', 'project.organization'],
				false
			);

			const projectMembers = task.project!.members!.map(
				(member) => member.employee
			) as IEmployee[];

			const issueComments: IIssueComment[] = await Promise.all(
				(comments ?? []).map(async (comment) => {
					const reactions =
						await this._commentService.findCommentReactions(
							{
								entityId: comment.id,
								entity: ReactionEntityEnum.Comment
							},
							projectId
						);

					const { issue, project, workspace } =
						await this.getIssueCommentDetails(
							options.entityId!,
							projectId,
							comment.employeeId!,
							task,
							task.project
						);
					const transformedComment = issueCommentTrasnsformer(
						comment,
						issue,
						project!,
						workspace,
						reactions,
						projectMembers.filter(
							(employee) =>
								employee!.userId === comment.createdByUserId
						)[0]
					);
					return Array.isArray(transformedComment)
						? transformedComment[0]
						: transformedComment;
				})
			);

			return issueComments;
		} catch (error) {
			this.logger.error(
				'Failed to get issue comments',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}

	async findIssueActivity(id: ID, projectId: ID): Promise<any> {
		try {
			const activityLogs = await this._activityService.findAll({
				entity: BaseEntityEnum.Task,
				entityId: id
			});

			const task = await this.getExternalIssue(
				id,
				[
					'project.members.employee.user.role',
					'project.organization',
					'organizationSprint',
					'taskSprintHistories.toSprint',
					'parent'
				],
				false
			);

			const projectEmployees = task.project!.members!.map(
				(member) => member.employee
			) as IEmployee[];

			// Collect all the IDs of parents mentioned in the logs
			const parentIds = new Set<string>();

			activityLogs?.forEach((log: any) => {
				if (log.updatedFields?.includes('parentId')) {
					log.updatedValues?.forEach((value: any) => {
						if ('parentId' in value && value.parentId) {
							parentIds.add(value.parentId);
						}
					});
					log.previousValues?.forEach((value: any) => {
						if ('parentId' in value && value.parentId) {
							parentIds.add(value.parentId);
						}
					});
				}
			});

			// Load all the parent tasks
			const parentTasks = new Map<string, any>();

			if (parentIds.size > 0) {
				const parents = await this.findAllExternal(
					{
						issues: Array.from(parentIds).join(',')
					},
					['project']
				);

				parents.items.forEach((parent) => {
					parentTasks.set(parent.id!, parent);
				});
			}

			const issueActivities = await Promise.all(
				(activityLogs ?? []).map(async (activityLog) => {
					const { actor, issue, project, workspace } =
						await this.getIssueCommentDetails(
							id,
							projectId,
							activityLog.employeeId!,
							task,
							task.project
						);

					// Check if updatedValues contains organizationSprintId
					const updatedSprintObj: any =
						activityLog.updatedValues?.find(
							(value) => 'organizationSprintId' in value
						);
					let updatedSprint = null;

					if (
						updatedSprintObj &&
						updatedSprintObj.organizationSprintId
					) {
					updatedSprint = (task.taskSprintHistories!.find(
						(sprint) =>
							sprint.toSprintId ===
							updatedSprintObj.organizationSprintId
					)?.toSprint ?? null) as any;
				}

				const transformedActivityLogs = issueActivityLogTransformer(
					activityLog,
					issue,
					actor!,
					project!,
						workspace,
						updatedSprint ? updatedSprint : task.organizationSprint!,
						projectEmployees.filter(
							(employee) =>
								employee!.userId === activityLog.createdByUserId
						)[0],
						projectEmployees,
						parentTasks
					);

					return Array.isArray(transformedActivityLogs)
						? transformedActivityLogs
						: [transformedActivityLogs];
				})
			);

			// Find links for logs
			const links = await this._issueLinkService.findAll(
				BaseEntityEnum.Task,
				id
			);

			const linkActivities = await Promise.all(
				(links ?? []).map(async (link) => {
					const logs = await this._activityService.findAll({
						entity: BaseEntityEnum.ResourceLink,
						entityId: link.id
					});

					const activities = await Promise.all(
						(logs ?? []).map(async (log) => {
							const { actor, issue, project, workspace } =
								await this.getIssueCommentDetails(
									id,
									projectId,
									log.employeeId!,
									task,
									task.project
								);

							return issueLinksActivities(
								logs,
								link,
								issue,
								actor!,
								project!,
								workspace,
								projectEmployees.filter(
									(employee) =>
										employee!.userId === log.createdByUserId
								)[0]
							);
						})
					);
					return activities;
				})
			);

			// Find issue relations activities logs
			const issueRelations =
				await this._issueRelationService.findAllByIssueId(id, true);

			const issueRelationsActivities = await Promise.all(
				(issueRelations ?? []).map(async (issueRelation) => {
					const logs = await this._activityService.findAll({
						entity: BaseEntityEnum.TaskLinkedIssue,
						entityId: issueRelation.id
					});

					const activities = await Promise.all(
						(logs ?? []).map(async (log) => {
							const { actor, issue, project, workspace } =
								await this.getIssueCommentDetails(
									id,
									projectId,
									log.employeeId!,
									task,
									task.project
								);

							return issueRelationActivities(
								logs,
								issueRelation,
								issue,
								actor!,
								project!,
								workspace,
								projectEmployees.filter(
									(employee) =>
										employee!.userId === log.createdByUserId
								)[0]
							);
						})
					);

					return activities;
				})
			);

			// Combined activities
			const flattenedActivities: IIssueActivity[] = issueActivities
				.flat()
				.concat(linkActivities.flat(2))
				.concat(issueRelationsActivities.flat(2));

			return flattenedActivities.filter(Boolean);
		} catch (error: any) {
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Create Reaction to issue
	 * @param {ID} entityId - Issue ID for whom create reaction
	 * @param {ID} projectId - The project ID for returning project data
	 * @param {ICreateReactionInput} input - Body request data
	 * @returns A promise resolved to created and transformed reaction
	 * @memberof IssuesService
	 */
	async createReaction(
		entityId: ID,
		projectId: ID,
		input: ICreateReactionInput
	): Promise<IReactionData> {
		try {
			const task = await this.getExternalIssue(
				entityId,
				['project.members.employee.user.role', 'project.organization'],
				false
			);

			// Create reaction
			const reaction = await this._reactionService.create(
				input,
				ReactionEntityEnum.Task,
				entityId
			);

			// Reaction details
			const { project, workspace } = await this.getIssueCommentDetails(
				entityId,
				projectId,
				reaction.employeeId!,
				task,
				task.project
			);

			// Transform Reaction
			const transformedReaction = reactionTransformer(
				reaction,
				project!,
				workspace
			);

			return Array.isArray(transformedReaction)
				? transformedReaction[0]
				: transformedReaction;
		} catch (error) {
			this.logger.error(
				'Failed to create reaction',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Find issue reactions with associated data
	 * @param {Partial<IReaction>} options Find options filter
	 * @param {ID} projectId - Project ID for returning data
	 * @returns A promise resolved to found and transformed reactions
	 * @memberof IssuesService
	 */
	async findIssueReactions(
		options: Partial<IReaction>,
		projectId: ID,
		isDraft?: boolean
	): Promise<any> {
		try {
			const task = await this.getExternalIssue(
				options.entityId!,
				['project.members.employee.user.role', 'project.organization'],
				isDraft
			);

			const reactions = await this._reactionService.findAll(options);

			const issueReactions: IReactionData[] = await Promise.all(
				(reactions ?? []).map(async (reaction) => {
					const { project, workspace } =
						await this.getIssueCommentDetails(
							options.entityId!,
							projectId,
							reaction.employeeId!,
							task,
							task.project
						);

					const transformedReaction = reactionTransformer(
						reaction,
						project!,
						workspace
					);

					return Array.isArray(transformedReaction)
						? transformedReaction[0]
						: transformedReaction;
				})
			);

			return issueReactions;
		} catch (error: any) {
			this.logger.error(
				`Failed to find issue reactions: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Delete Issue Reaction By Emoji.
	 * @param {string} reaction - Emoji
	 * @param {ID} entityId - Issue ID from whom to delete reaction
	 * @returns A promise resolved to deleted result
	 * @memberof IssuesService
	 */
	async deleteIssueReactionByEmoji(
		reaction: string,
		entityId: ID
	): Promise<any> {
		return await this._reactionService.deleteByEmoji(
			reaction,
			ReactionEntityEnum.Task,
			entityId
		);
	}

	/**
	 * @description Get issue activity and comments
	 * @param {ID} id - Issue ID
	 * @param {ID} projectId - Project ID
	 * @param {IssueActivityTypeEnum} activity_type Activity type
	 * @returns A promise resolved after got comments or Activity Logs
	 * @memberof IssuesService
	 */
	async findActivity(
		id: ID,
		projectId: ID,
		activity_type: IssueActivityTypeEnum
	): Promise<any> {
		try {
			if (activity_type === IssueActivityTypeEnum.COMMENT) {
				return await this.getIssueComments(
					{ entityId: id, entity: BaseEntityEnum.Task },
					projectId
				);
			}
			return await this.findIssueActivity(id, projectId);
		} catch (error: any) {
			this.logger.error(
				`Failed to find activity: ${error?.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Get Issue comment and reaction details
	 * @param {ID} id - Issue ID
	 * @param {ID} projectId - Project ID
	 * @param {ID} employeeId Creator ID for returning actor details
	 * @param {ITask} originalTask Optional task to avoid multiple API calls
	 * @param {IOrganizationProject} originalProject Optional project to avoid multiple API calls
	 * @returns - A promise resolced afet got details
	 * @memberof IssuesService
	 */
	async getIssueCommentDetails(
		id: ID,
		projectId: ID,
		employeeId: ID,
		originalTask?: ITask,
		originalProject?: IOrganizationProject
	) {
		try {
			let task = originalTask;
			let project = originalProject;

			// remote issue to find creator member if no task provided
			if (!task) {
				task = await this.getExternalIssue(id, undefined, false);
			}

			// Commented issue
			const issue = issueTransformer(task);

			// Find project if none is provided
			if (!originalProject && projectId) {
				project =
					await this._projectService.getExternalProject(projectId);
			}

			// Workspace details
			const organization = project?.organization;
			const workspace = {
				name: organization?.name,
				id: organization?.id,
				slug: organization?.id
			};

			// Find actor by userId
			const actor = project?.members?.find(
				(member) => member.employeeId === employeeId
			)?.employee;

			return { issue, project, workspace, actor };
		} catch (error) {
			this.logger.error(
				'Failed to get issue comment details',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Create Issue Link
	 * @param {ID} id - Issue ID for whom create link
	 * @param {ID} projectId - The project ID for returning project data
	 * @param {ICreateIssueLink} input - Body request data
	 * @returns A promise resolved to created and transformed link
	 * @memberof IssuesService
	 */
	async createLink(
		id: ID,
		projectId: ID,
		input: ICreateIssueLink
	): Promise<IIssueLink> {
		try {
			// Create link
			const link = await this._issueLinkService.create(input, id);
			const task = await this.getExternalIssue(id, [
				'tags',
				'members.user',
				'createdByUser',
				'project.members.employee.user.role',
				'organizationSprint'
			]);

			// Link Details
			const { actor, project } = await this.getIssueCommentDetails(
				id,
				projectId,
				link.employeeId!,
				task,
				task.project
			);

			// Transform Link
			const transformedLink = issueLinkTransformer(link, actor, project);

			return Array.isArray(transformedLink)
				? transformedLink[0]
				: transformedLink;
		} catch (error) {
			this.logger.error(
				'Failed to create link',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Update Issue Link
	 * @param {ID} id - Link ID to update update
	 * @param {ID} issueId - Issue ID for whom update link
	 * @param {ID} projectId - The project ID for returning project data
	 * @param {ICreateIssueLink} input - Body request data
	 * @returns A promise resolved to created and transformed link
	 * @memberof IssuesService
	 */
	async updateLink(
		id: ID,
		issueId: ID,
		projectId: ID,
		input: ICreateIssueLink
	): Promise<IIssueLink> {
		try {
			// Update link
			const link = await this._issueLinkService.update(
				id,
				issueId,
				'' as any,
				input,
				BaseEntityEnum.Task
			);

			// Link Details
			const { actor, project } = await this.getIssueCommentDetails(
				issueId,
				projectId,
				link.employeeId!
			);

			// Transform Link
			const transformedLink = issueLinkTransformer(link, actor, project);

			return Array.isArray(transformedLink)
				? transformedLink[0]
				: transformedLink;
		} catch (error) {
			this.logger.error(
				'Failed to update link',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Find issue links with associated data
	 * @param {ID} id - Issue ID
	 * @param {ID} projectId - Project ID for returning data
	 * @returns A promise resolved to found and transformed links
	 * @memberof IssuesService
	 */
	async findIssueLinks(id: ID, projectId: ID, issue: ITask): Promise<any> {
		try {
			const links = await this._issueLinkService.findAll(
				BaseEntityEnum.Task,
				id
			);

			const issueLinks: IIssueLink[] = await Promise.all(
				(links ?? []).map(async (link) => {
					const { actor, project } =
						await this.getIssueCommentDetails(
							id,
							projectId,
							link.employeeId!,
							issue,
							issue.project
						);

					const transformedLink = issueLinkTransformer(
						link,
						actor,
						project
					);
					return Array.isArray(transformedLink)
						? transformedLink[0]
						: transformedLink;
				})
			);

			return issueLinks;
		} catch (error: any) {
			this.logger.error(
				`Failed to find issue links: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Find issues by view with view filters
	 * @param {ID} viewId - The view ID for whom to search issues
	 * @param {*} query - View filters
	 * @returns A promise resolved to found and tranformed issues
	 * @memberof IssuesService
	 */
	async findViewIssues(viewId: ID, query: any): Promise<IIssue[]> {
		try {
			const issues: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/view/${viewId}`,
					query
				})
			).data;

			return issues.items?.map((issue) => issueTransformer(issue));
		} catch (error: any) {
			this.logger.error(
				`Failed to find view issues: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Delete Issue Link.
	 * @param {ID} id - Issue Link ID to delete
	 * @returns A promise resolved to deleted result
	 * @memberof IssuesService
	 */
	async deleteLink(id: ID): Promise<any> {
		return await this._issueLinkService.delete(id);
	}

	/**
	 * Subscribes to a specific issue within a project and returns the subscription details.
	 *
	 * @param {ID} issueId - The ID of the issue to subscribe to.
	 * @param {ID} projectId - The ID of the project where the issue exists.
	 * @returns {Promise<ISubscriber | ISubscriber[]>} A promise that resolves to the transformed subscription data, either a single subscriber or a list of subscribers.
	 */
	async subscribe(
		issueId: ID,
		projectId: ID
	): Promise<ISubscriber | ISubscriber[]> {
		const subscription = await this._subscriptionService.create(issueId);
		return subscriptionTransformer(subscription, projectId);
	}

	/**
	 * Unsubscribes the default user from a task subscription based on the provided issue ID.
	 *
	 * @param {ID} issueId - The unique identifier of the issue/task to unsubscribe from.
	 * @returns {Promise<any>} A promise that resolves to the response of the unsubscribe operation.
	 * @throws {BadRequestException} If the unsubscription fails or encounters an error.
	 */
	async unsubscribe(issueId: ID): Promise<any> {
		return await this._subscriptionService.unsubscribe({
			entity: BaseEntityEnum.Task,
			entityId: issueId,
			userId: currentUserId() ?? undefined
		});
	}

	/**
	 * Get issue meta
	 * @param {ID} issueId - Issue ID
	 * @returns {Promise<{ sequence_id: number; project_identifier: string }>} A promise that resolves to the issue meta
	 * @throws {BadRequestException} If the issue is not found
	 */
	async getIssueMeta(
		issueId: ID
	): Promise<{ sequence_id: number; project_identifier: string }> {
		try {
			const issue = await this.getExternalIssue(issueId, ['project']);

			if (!issue) {
				throw new BadRequestException('Issue not found');
			}

			return {
				sequence_id: issue.number!,
				project_identifier: issue.project!.code!
			};
		} catch (error) {
			this.logger.error(
				'Failed to get issue meta',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}
}
