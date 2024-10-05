import { Injectable, BadRequestException } from '@nestjs/common';
import qs from 'qs';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	CommentEntityEnum,
	ICommentFindInput,
	ICreateCommentInput,
	ICreateReactionInput,
	ID,
	IIssue,
	IIssueComment,
	IIssueCreateInput,
	IIssueFindInput,
	IIssueRelationResponse,
	IIssueUpdateInput,
	IPagination,
	IReactionData,
	IssueActivityTypeEnum,
	ISubIssueResponse,
	ITask,
	ReactionEntityEnum,
	TaskStatusEnum,
} from '@plane-plugin/models';
import {
	createIssueInputTransformer,
	getIssueRelationType,
	getTaskDistribution,
	getTaskQuery,
	groupIssuesByStateId,
	issueCommentTrasnsformer,
	issueTransformer,
	reactionTransformer,
	updateIssueInputTransformer,
} from '../../config';
import { StatesService } from '../states/states.service';
import { CommentsService } from '../comments/comments.service';
import { ProjectService } from '../project/project.service';
import { ReactionsService } from '../reactions/reactions.service';

@Injectable()
export class IssuesService extends ApiFetchService {
	constructor(
		private readonly _stateSerive: StatesService,
		private readonly _commentService: CommentsService,
		private readonly _reactionService: ReactionsService,
		private readonly _projectService: ProjectService,
		private readonly _serverFetchService: ApiFetchService,
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/tasks';

	/**
	 * @description - Get remode API issue
	 * @private
	 * @param {ID} id - The issue ID
	 * @returns - A promise that resolved after getting issue
	 * @memberof IssuesService
	 */
	private async getExternalIssue(id: ID): Promise<ITask> {
		const query = qs.stringify(getTaskQuery());
		return (
			await this.apiFetch({
				path: `${this.path}/${id}`,
				method: 'GET',
				query,
			})
		).data;
	}

	/**
	 * @description - Find issue by Id
	 * @param {ID} id - The issue ID to search
	 * @returns - A promise that resolves after issue fetched
	 * @memberof IssuesService
	 */
	async findOne(id: ID): Promise<IIssue> {
		try {
			const issue = await this.getExternalIssue(id);

			if (!issue) {
				throw new BadRequestException('Issue cnot found');
			}
			return issueTransformer(issue);
		} catch (error) {
			console.log(error);
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
			const state = await this._stateSerive.getOne(input.state_id);

			const body = createIssueInputTransformer(
				input,
				state.name as TaskStatusEnum,
			);

			const issue: ITask = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body,
				})
			).data;

			return issueTransformer(issue);
		} catch (error: any) {
			console.log(error);
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
	async update(id: ID, input: IIssueUpdateInput): Promise<IIssue> {
		try {
			// Extract modules to be added and removed from the input
			const { modules: added_modules = [], removed_modules = [] } = input;

			// Fetch the state only if a state_id is provided
			const state = input.state_id
				? await this._stateSerive.getOne(input.state_id)
				: undefined;

			// Retrieve the existing issue and external issue details simultaneously
			const [issue, externalIssue] = await Promise.all([
				this.findOne(id),
				this.getExternalIssue(id),
			]);

			if (!issue) {
				throw new BadRequestException('Issue not found');
			}

			// Calculate the final set of modules after additions and removals
			const existingModules =
				externalIssue?.modules.map((module) => module.id) || [];
			const modules = new Set([...existingModules, ...added_modules]);
			removed_modules.forEach((module) => modules.delete(module)); // Remove the modules marked for deletion

			// Transform the input data for the update request
			const body = updateIssueInputTransformer(
				input,
				state?.name as TaskStatusEnum,
				Array.from(modules),
			);

			const task = (
				await this.apiFetch({
					path: `${this.path}/${id}`,
					method: 'PUT',
					body: {
						...body,
						title: input.name ?? issue.name,
						status: state?.name || externalIssue.status,
					},
				})
			).data;

			const updatedTask = await this.getExternalIssue(task.id);

			return issueTransformer(updatedTask);
		} catch (error) {
			console.log(error);
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
		input: Pick<IIssueUpdateInput, 'sub_issue_ids'>,
	): Promise<ISubIssueResponse> {
		try {
			const { sub_issue_ids } = input;
			const tasks: ITask[] = [];
			const subIssues: IIssue[] = await Promise.all(
				sub_issue_ids.map(async (issueId) => {
					const issue = await this.getExternalIssue(issueId);

					await this.apiFetch({
						path: `${this.path}/${issueId}`,
						method: 'PUT',
						body: {
							...issue,
							parentId: id,
						},
					});
					tasks.push(issue);

					return issueTransformer(issue);
				}),
			);

			const stateDistribution = getTaskDistribution(tasks);

			return {
				sub_issues: subIssues,
				state_distribution: stateDistribution,
			};
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	async getAllIssuesByProject(projectId: ID, options?: IIssueFindInput) {
		try {
			const query = qs.stringify(getTaskQuery(projectId, options));

			let path = '';
			if (options.module) {
				path = 'module';
			}

			const issues: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/${path}`,
					query,
				})
			).data;

			return groupIssuesByStateId(issues.items);
		} catch (error: any) {
			console.log(error);
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
			const issue = await this.getExternalIssue(id);
			if (!issue) {
				throw new BadRequestException('Issue could not be found');
			}
			if (issue.children.length > 0) {
				const children = issue.children;
				children.forEach((task) =>
					sub_issues.push(issueTransformer(task)),
				);
			}

			const stateDistribution = getTaskDistribution(issue.children);

			return { sub_issues, state_distribution: stateDistribution };
		} catch (error) {
			console.log(error);
			throw new BadRequestException();
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
			const relatedIssues: IIssueRelationResponse = {
				blocked_by: [],
				blocking: [],
				duplicate: [],
				relates_to: [],
			};
			const issue = await this.getExternalIssue(id);
			if (!issue) {
				throw new BadRequestException('Issue could not be found');
			}
			const linkedIssues = issue.linkedIssues;

			linkedIssues.forEach((linkedIssue) => {
				const relation_type = getIssueRelationType(linkedIssue.action);
				if (relation_type) {
					if (linkedIssue.taskFrom) {
						relatedIssues[relation_type].push(
							issueTransformer(linkedIssue.taskFrom),
						);
					}
				}
			});

			return relatedIssues;
		} catch (error) {
			console.log(error);
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
				path: `${this.path}/${id}`,
			})
		).data;
	}

	/**
	 * @description Create issue comment
	 * @param {ID} entityId - Issue ID for creating comment
	 * @param {ID} projectId - Project ID for returning project data
	 * @param {ICreateCommentInput} input - Body request
	 * @returns A promise resoved to comment created and returned related data
	 * @memberof IssuesService
	 */
	async createComment(
		entityId: ID,
		projectId: ID,
		input: ICreateCommentInput,
	): Promise<IIssueComment> {
		try {
			// Create comment
			const comment = await this._commentService.create(
				input,
				CommentEntityEnum.Task,
				entityId,
			);

			const { actor, issue, project, workspace } =
				await this.getIssueCommentDetails(
					entityId,
					projectId,
					comment.creatorId,
				);

			const transformedComment = issueCommentTrasnsformer(
				comment,
				issue,
				actor,
				project,
				workspace,
			);

			return Array.isArray(transformedComment)
				? transformedComment[0]
				: transformedComment;
		} catch (error) {
			console.log(error);
			throw new BadRequestException();
		}
	}

	/**
	 * @description Create issue comment
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
		entityId: ID,
	): Promise<IIssueComment> {
		try {
			// Update comment
			const options: ICommentFindInput = {
				entity: CommentEntityEnum.Task,
				entityId,
			};
			await this._commentService.update(id, options, input);

			const updatedComment = await this._commentService.findOne(
				id,
				options,
			);

			const { actor, issue, project, workspace } =
				await this.getIssueCommentDetails(
					updatedComment.entityId,
					projectId,
					updatedComment.creatorId,
				);

			const transformedComment = issueCommentTrasnsformer(
				updatedComment,
				issue,
				actor,
				project,
				workspace,
			);

			return Array.isArray(transformedComment)
				? transformedComment[0]
				: transformedComment;
		} catch (error: any) {
			console.log(error.response);
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
		projectId: ID,
	): Promise<any> {
		try {
			const comments = await this._commentService.findAll(options);

			const issueComments: IIssueComment[] = await Promise.all(
				comments.map(async (comment) => {
					const { actor, issue, project, workspace } =
						await this.getIssueCommentDetails(
							options.entityId,
							projectId,
							comment.creatorId,
						);
					const transformedComment = issueCommentTrasnsformer(
						comment,
						issue,
						actor,
						project,
						workspace,
					);
					return Array.isArray(transformedComment)
						? transformedComment[0]
						: transformedComment;
				}),
			);

			return issueComments;
		} catch (error) {
			console.log(error);
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
		input: ICreateReactionInput,
	): Promise<IReactionData> {
		try {
			// Create reaction
			const reaction = await this._reactionService.create(
				input,
				ReactionEntityEnum.Task,
				entityId,
			);

			// Reaction details
			const { actor, project, workspace } =
				await this.getIssueCommentDetails(
					entityId,
					projectId,
					reaction.creatorId,
				);

			// Transform Reaction
			const transformedReaction = reactionTransformer(
				reaction,
				actor,
				project,
				workspace,
			);

			return Array.isArray(transformedReaction)
				? transformedReaction[0]
				: transformedReaction;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
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
		activity_type: IssueActivityTypeEnum,
	): Promise<any> {
		try {
			if (activity_type === IssueActivityTypeEnum.COMMENT) {
				return await this.getIssueComments(
					{ entityId: id, entity: CommentEntityEnum.Task },
					projectId,
				);
			}
			return []; // TODO: Implement activity log APIs
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Get Issue comment details
	 * @param {ID} id - Issue ID
	 * @param {ID} projectId - Project ID
	 * @param {ID} creatorId Creator ID for returning actor details
	 * @returns - A promise resolced afet got details
	 * @memberof IssuesService
	 */
	async getIssueCommentDetails(id: ID, projectId: ID, creatorId: ID) {
		try {
			// remote issue to find creator member
			const task = await this.getExternalIssue(id);

			// Commented issue
			const issue = issueTransformer(task);

			// Find project
			const project =
				await this._projectService.getExternalProject(projectId);

			// Workspace details
			const tenant = project.tenant;
			const workspace = {
				name: tenant?.name,
				id: tenant?.id,
				slug: tenant?.name.toLowerCase(),
			};

			// Find actor by userId
			const actor = project.members.find(
				(member) => member.employee.userId === creatorId,
			)?.employee;

			return { issue, project, workspace, actor };
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
