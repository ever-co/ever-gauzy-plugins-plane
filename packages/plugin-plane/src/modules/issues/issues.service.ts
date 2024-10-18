import { Injectable, BadRequestException } from '@nestjs/common';
import qs from 'qs';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
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
	IIssueComment,
	IIssueCreateInput,
	IIssueFindInput,
	IIssueLink,
	IIssueUpdateInput,
	IPagination,
	IReaction,
	IReactionData,
	IssueActivityTypeEnum,
	IssueGroupBy,
	IState,
	ISubIssueResponse,
	ITask,
	ReactionEntityEnum,
	TaskStatusEnum,
} from '@plane-plugin/models';
import {
	createIssueInputTransformer,
	getTaskDistribution,
	getTaskQuery,
	groupIssuesByStateId,
	groupIssuesByTargetDate,
	issueCommentTrasnsformer,
	issueLinkTransformer,
	issueTransformer,
	nonGroupedIssues,
	reactionTransformer,
	updateIssueInputTransformer,
} from '../../config';
import { StatesService } from '../states/states.service';
import { CommentsService } from '../comments/comments.service';
import { ProjectService } from '../project/project.service';
import { ReactionsService } from '../reactions/reactions.service';
import { IssueRelationsService } from '../issue-relations/issue-relations.service';
import { IssueLinksService } from '../issue-links/issue-links.service';

@Injectable()
export class IssuesService extends ApiFetchService {
	constructor(
		private readonly _stateSerive: StatesService,
		private readonly _commentService: CommentsService,
		private readonly _reactionService: ReactionsService,
		private readonly _issueLinkService: IssueLinksService,
		private readonly _projectService: ProjectService,
		private readonly _issueRelationService: IssueRelationsService,
		private readonly _serverFetchService: ApiFetchService,
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
	async getExternalIssue(id: ID): Promise<ITask> {
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
				throw new BadRequestException('Issue not found');
			}

			// Find Issue Reactions
			const reactions = await this.findIssueReactions(
				{
					entityId: id,
					entity: ReactionEntityEnum.Task,
				},
				issue.projectId,
			);

			// Find issue links
			const links = await this.findIssueLinks(id, issue.projectId);

			return issueTransformer(issue, reactions, links);
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
			const { state_id } = input;

			// Set default status
			let state: IState = { name: TaskStatusEnum.BACKLOG };
			if (state_id) {
				state = await this._stateSerive.getOne(input.state_id);
			}

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
		} catch (error: any) {
			console.log(error.response);
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
			const { group_by, module } = options;
			const query = qs.stringify(getTaskQuery(projectId, options));

			let path = '';
			if (module) {
				path = 'module';
			}

			const tasks: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/${path}`,
					query,
				})
			).data;

			const issues = tasks.items;

			switch (group_by) {
				case IssueGroupBy.STATE:
					return groupIssuesByStateId(issues);
				case IssueGroupBy.TARGET_DATE:
					return groupIssuesByTargetDate(issues);
				default:
					return nonGroupedIssues(issues);
			}
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
	 * @description Create issue relations.
	 * @param {ID} taskToId Issue ID for whom to create main relations.
	 * @param {ICreateIssueRelationInput} input - Body request data for creating main and inversed relations.
	 * @returns A promise resolved to created and transformed main relations.
	 * @memberof IssuesService
	 */
	async createIssueRelations(
		taskToId: ID,
		input: ICreateIssueRelationInput,
	): Promise<ICreatedIssueRelation[]> {
		try {
			const { issues, relation_type } = input;
			return await this._issueRelationService.create(
				taskToId,
				issues,
				relation_type,
			);
		} catch (error) {
			console.log(error);
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
		input: IDeleteRelationInput,
	): Promise<any> {
		try {
			return await this._issueRelationService.delete(id, input);
		} catch (error: any) {
			console.log(error.response);
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
				BaseEntityEnum.Task,
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
				[], // On creation, comment has no reaction yet
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
		entityId: ID,
	): Promise<IIssueComment> {
		try {
			// Update comment
			const options: ICommentFindInput = {
				entity: BaseEntityEnum.Task,
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

			const reactions = await this._commentService.findCommentReactions(
				{
					entityId: updatedComment.id,
					entity: ReactionEntityEnum.Comment,
				},
				projectId,
			);

			const transformedComment = issueCommentTrasnsformer(
				updatedComment,
				issue,
				actor,
				project,
				workspace,
				reactions,
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
					const reactions =
						await this._commentService.findCommentReactions(
							{
								entityId: comment.id,
								entity: ReactionEntityEnum.Comment,
							},
							projectId,
						);

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
						reactions,
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
	 * @description Find issue reactions with associated data
	 * @param {Partial<IReaction>} options Find options filter
	 * @param {ID} projectId - Project ID for returning data
	 * @returns A promise resolved to found and transformed reactions
	 * @memberof IssuesService
	 */
	async findIssueReactions(
		options: Partial<IReaction>,
		projectId: ID,
	): Promise<any> {
		try {
			const reactions = await this._reactionService.findAll(options);

			const issueReactions: IReactionData[] = await Promise.all(
				reactions.map(async (reaction) => {
					const { actor, project, workspace } =
						await this.getIssueCommentDetails(
							options.entityId,
							projectId,
							reaction.creatorId,
						);

					const transformedReaction = reactionTransformer(
						reaction,
						actor,
						project,
						workspace,
					);

					return Array.isArray(transformedReaction)
						? transformedReaction[0]
						: transformedReaction;
				}),
			);

			return issueReactions;
		} catch (error: any) {
			console.log(error.response);
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
		entityId: ID,
	): Promise<any> {
		return await this._reactionService.deleteByEmoji(
			reaction,
			ReactionEntityEnum.Task,
			entityId,
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
		activity_type: IssueActivityTypeEnum,
	): Promise<any> {
		try {
			if (activity_type === IssueActivityTypeEnum.COMMENT) {
				return await this.getIssueComments(
					{ entityId: id, entity: BaseEntityEnum.Task },
					projectId,
				);
			}
			return []; // TODO: Implement activity log APIs
		} catch (error: any) {
			console.log(error.response.data);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Get Issue comment and reaction details
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
		input: ICreateIssueLink,
	): Promise<IIssueLink> {
		try {
			// Create link
			const link = await this._issueLinkService.create(input, id);

			// Link Details
			const { actor, project } = await this.getIssueCommentDetails(
				id,
				projectId,
				link.creatorId,
			);

			// Transform Link
			const transformedLink = issueLinkTransformer(link, actor, project);

			return Array.isArray(transformedLink)
				? transformedLink[0]
				: transformedLink;
		} catch (error) {
			console.log(error);
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
		input: ICreateIssueLink,
	): Promise<IIssueLink> {
		try {
			// Update link
			const link = await this._issueLinkService.update(
				id,
				issueId,
				input,
			);

			// Link Details
			const { actor, project } = await this.getIssueCommentDetails(
				id,
				projectId,
				link.creatorId,
			);

			// Transform Link
			const transformedLink = issueLinkTransformer(link, actor, project);

			return Array.isArray(transformedLink)
				? transformedLink[0]
				: transformedLink;
		} catch (error) {
			console.log(error);
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
	async findIssueLinks(id: ID, projectId: ID): Promise<any> {
		try {
			const links = await this._issueLinkService.findAll(id);

			const issueLinks: IIssueLink[] = await Promise.all(
				links.map(async (link) => {
					const { actor, project } =
						await this.getIssueCommentDetails(
							id,
							projectId,
							link.creatorId,
						);

					const transformedLink = issueLinkTransformer(
						link,
						actor,
						project,
					);
					return Array.isArray(transformedLink)
						? transformedLink[0]
						: transformedLink;
				}),
			);

			return issueLinks;
		} catch (error: any) {
			console.log(error.response);
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
}
