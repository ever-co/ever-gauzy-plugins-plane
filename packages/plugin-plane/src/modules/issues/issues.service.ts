import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	CommentEntityEnum,
	ICreateCommentInput,
	ID,
	IIssue,
	IIssueComment,
	IIssueCreateInput,
	IIssueRelationResponse,
	IIssueUpdateInput,
	IPagination,
	IState,
	ITask,
	TaskStatusEnum,
} from '@plane-plugin/models';
import {
	createIssueInputTransformer,
	getIssueRelationType,
	getTaskQuery,
	groupIssuesByStateId,
	issueCommentTrasnsformer,
	issueTransformer,
	updateIssueInputTransformer,
} from '../../config';
import { StatesService } from '../states/states.service';
import { CommentsService } from '../comments/comments.service';
import { ProjectService } from '../project/project.service';

@Injectable()
export class IssuesService extends ApiFetchService {
	constructor(
		private readonly _stateSerive: StatesService,
		private readonly _commentService: CommentsService,
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
	private async getRemoteIssue(id: ID): Promise<ITask> {
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
			const issue = await this.getRemoteIssue(id);

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
			let state: IState;
			if (input.state_id) {
				state = await this._stateSerive.getOne(input.state_id);
			}
			const issue = await this.findOne(id);

			const nativeIssue = await this.getRemoteIssue(id);

			if (!issue) {
				throw new BadRequestException('Issue not found');
			}

			const body = updateIssueInputTransformer(
				input,
				state?.name as TaskStatusEnum,
			);

			const task = (
				await this.apiFetch({
					path: `${this.path}/${id}`,
					method: 'PUT',
					body: {
						...body,
						title: input.name ?? issue.name,
						status: input.state_id
							? state.name
							: nativeIssue.status,
					},
				})
			).data;

			return issueTransformer(task);
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	async getAllIssuesByProject(projectId: ID) {
		try {
			const query = qs.stringify(getTaskQuery(projectId));
			const issues: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
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
	async findIssueChildren(
		id: ID,
	): Promise<{ sub_issues: IIssue[]; state_distribution: any }> {
		try {
			const sub_issues: IIssue[] = [];
			const issue = await this.getRemoteIssue(id);
			if (!issue) {
				throw new BadRequestException('Issue could not be found');
			}
			if (issue.children.length > 0) {
				const children = issue.children;
				children.forEach((task) =>
					sub_issues.push(issueTransformer(task)),
				);
			}

			return { sub_issues, state_distribution: {} };
		} catch (error) {
			console.log(error);
			throw new BadRequestException();
		}
	}

	async findIssueRelations(id: ID) {
		try {
			const relatedIssues: IIssueRelationResponse = {
				blocked_by: [],
				blocking: [],
				duplicate: [],
				relates_to: [],
			};
			const issue = await this.getRemoteIssue(id);
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
	 * @returns {*}  A promise resolved to delete result
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

	async createComment(
		entityId: ID,
		projectId: ID,
		input: ICreateCommentInput,
	): Promise<IIssueComment> {
		try {
			// remote issue to find creator member
			const task = await this.getRemoteIssue(entityId);

			// Commented issue
			const issue = issueTransformer(task);

			// Find project
			const project =
				await this._projectService.getRemoteProject(projectId);

			// Workspace details
			const tenant = project.tenant;
			const workspace = {
				name: tenant.name,
				id: tenant.id,
				slug: tenant.name.toLowerCase(),
			};

			// Create comment
			const comment = await this._commentService.create(
				input,
				CommentEntityEnum.Task,
				entityId,
			);

			// Find actor by userId
			const actor = task.members.find(
				(member) => (member.userId = comment.creatorId),
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
}
