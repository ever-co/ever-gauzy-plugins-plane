import { Injectable, BadRequestException } from '@nestjs/common';
import qs from 'qs';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	CommentEntityEnum,
	ICommentFindInput,
	ICreateCommentInput,
	ID,
	IIssue,
	IIssueComment,
	IIssueCreateInput,
	IIssueRelationResponse,
	IIssueUpdateInput,
	IPagination,
	IssueActivityTypeEnum,
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

	/**
	 * @description Create issue comment
	 * @author GloireMutaliko
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
			const task = await this.getRemoteIssue(id);

			// Commented issue
			const issue = issueTransformer(task);

			// Find project
			const project =
				await this._projectService.getRemoteProject(projectId);

			// Workspace details
			const tenant = project.tenant;
			const workspace = {
				name: tenant?.name,
				id: tenant?.id,
				slug: tenant?.name.toLowerCase(),
			};

			/**
			 * Should be refacted and implement APIs for members
			 */
			// Find actor by userId
			const member = project.members.find(
				(member) => member.employee.userId === creatorId,
			);

			const actor = {
				id:
					member?.employeeId ||
					'b7165202-4fcb-4351-b6c6-a2ce299ea10b',
				first_name: member?.employee.user.firstName || 'Salva',
				last_name: member?.employee.user.lastName || 'Cardano',
				avatar:
					member?.employee.user.imageUrl ||
					'https://lh3.googleusercontent.com/a/ACg8ocJrkjUa3xiRgBrYPZSQ53906R4CPFcwCnQIE4SarJjw4IRZDQ=s96-c',
				is_bot: false,
				display_name: member?.employee?.fullName || 'salva.cardano1',
			};

			return { issue, project, workspace, actor };
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
