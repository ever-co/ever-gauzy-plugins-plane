import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable
} from '@nestjs/common';
import qs from 'qs';
import {
	BaseEntityEnum,
	IComment,
	ICommentFindInput,
	ICreateCommentInput,
	ICreateReactionInput,
	ID,
	IEmployee,
	IPagination,
	IReaction,
	IReactionData,
	ReactionEntityEnum
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	createCommentInputTransformer,
	getCurrentOrganizationSlug,
	getCommentsQuery,
	reactionTransformer,
	updateCommentInputTransformer
} from '../../config';
import { ProjectService } from '../project/project.service';
import { ReactionsService } from '../reactions/reactions.service';

@Injectable()
export class CommentsService extends ApiFetchService {
	constructor(
		@Inject(forwardRef(() => ProjectService))
		private readonly _projectService: ProjectService,
		private readonly _reactionService: ReactionsService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/comment';

	/**
	 * @description Create comment
	 * @param {ICreateCommentInput} input body request for comment creation
	 * @param {BaseEntityEnum} entity commented entity type
	 * @param {ID} entityId commented entity ID
	 * @param {IEmployee[]} employees - Optional mentioned employees
	 * @returns A promise resolved to created comment
	 * @memberof CommentsService
	 */
	async create(
		input: ICreateCommentInput,
		entity: BaseEntityEnum,
		entityId: ID,
		employees?: IEmployee[]
	): Promise<IComment> {
		try {
			const body = createCommentInputTransformer(
				input,
				entity,
				entityId,
				employees
			);

			const comment: IComment = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body: {
						...body,
						organizationId: getCurrentOrganizationSlug()
					}
				})
			).data;

			return comment;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Update comment
	 * @param {ID} id Comment ID to be updated
	 * @param {Partial<ICreateCommentInput>} input Body Request data for updating
	 * @returns A Promise resolved to updated comment
	 * @memberof CommentsService
	 */
	async update(
		id: ID,
		options: ICommentFindInput,
		input: ICreateCommentInput
	): Promise<IComment> {
		try {
			const existingComment = await this.findOne(id, options);

			if (!existingComment) {
				throw new BadRequestException('Comment Not Found');
			}

			const body = updateCommentInputTransformer(input, existingComment);

			const comment: IComment = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body
				})
			).data;

			return comment;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Find comments
	 * @param {Partial<ICommentFindInput>} options Filter options
	 * @returns A promise resolved to fetched comments
	 * @memberof CommentsService
	 */
	async findAll(options: Partial<ICommentFindInput>): Promise<IComment[]> {
		try {
			const { entity, entityId } = options;

			const query = qs.stringify(getCommentsQuery(entityId, entity));

			const comments: IPagination<IComment> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			return comments.items;
		} catch (error) {
			console.log(error);
			throw new BadRequestException();
		}
	}

	/**
	 * @description Find one comment
	 * @param {ID} id - Comment ID
	 * @param {ICommentFindInput} options - find filter options
	 * @returns A promise resolved to found comment
	 * @memberof CommentsService
	 */
	async findOne(id: ID, options: ICommentFindInput): Promise<IComment> {
		try {
			const { entity, entityId } = options;

			const query = qs.stringify(getCommentsQuery(entityId, entity));

			const comment: IComment = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/${id}`,
					query
				})
			).data;

			return comment;
		} catch (error) {
			console.log(error);
			throw new BadRequestException();
		}
	}

	/**
	 * @description Delete comment
	 * @param {ID} id - The comment ID to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof CommentsService
	 */
	async delete(id: ID): Promise<any> {
		return (
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${id}`
			})
		).data;
	}

	/**
	 * @description Create Reaction to comment
	 * @param {ID} entityId - Comment ID for whom create reaction
	 * @param {ID} projectId - The project ID for returning project data
	 * @param {ICreateReactionInput} input - Body request data
	 * @returns A promise resolved to created and transformed reaction
	 * @memberof CommentsService
	 */
	async createReaction(
		entityId: ID,
		projectId: ID,
		input: ICreateReactionInput
	): Promise<IReactionData> {
		try {
			// Create reaction
			const reaction = await this._reactionService.create(
				input,
				ReactionEntityEnum.Comment,
				entityId
			);

			// Reaction details
			const { project, workspace } = await this.getCommentReactionDetails(
				projectId,
				reaction.employeeId
			);

			// Transform Reaction
			const transformedReaction = reactionTransformer(
				reaction,
				project,
				workspace
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
	 * @description Get comment reaction details
	 * @param {ID} projectId - Project ID
	 * @param {ID} creatorId Creator ID for returning actor details
	 * @returns - A promise resolced afet got details
	 * @memberof CommentsService
	 */
	async getCommentReactionDetails(projectId: ID, creatorId: ID) {
		try {
			// Find project
			const project = await this._projectService.getExternalProject(
				projectId,
				['tenant', 'members.employee.user']
			);

			// Workspace details
			const tenant = project.tenant;
			const workspace = {
				name: tenant?.name,
				id: tenant?.id,
				slug: tenant?.name.toLowerCase()
			};

			// Find actor by userId
			const actor = project.members.find(
				(member) => member.employee.userId === creatorId
			)?.employee;

			return { project, workspace, actor };
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Find comment reactions with associated data
	 * @param {Partial<IReaction>} options Find options filter
	 * @param {ID} projectId - Project ID for returning data
	 * @returns A promise resolved to found and transformed reactions
	 * @memberof CommentsService
	 */
	async findCommentReactions(
		options: Partial<IReaction>,
		projectId: ID
	): Promise<any> {
		try {
			const reactions = await this._reactionService.findAll(options);

			const commentReactions: IReactionData[] = await Promise.all(
				reactions.map(async (reaction) => {
					const { project, workspace } =
						await this.getCommentReactionDetails(
							projectId,
							reaction.employeeId
						);

					const transformedReaction = reactionTransformer(
						reaction,
						project,
						workspace
					);

					return Array.isArray(transformedReaction)
						? transformedReaction[0]
						: transformedReaction;
				})
			);

			return commentReactions;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Delete Comment Reaction By Emoji.
	 * @param {string} reaction - Emoji
	 * @param {ID} entityId - Comment ID from whom to delete reaction
	 * @returns A promise resolved to deleted result
	 * @memberof CommentsService
	 */
	async deleteCommentReactionByEmoji(
		reaction: string,
		entityId: ID
	): Promise<any> {
		return await this._reactionService.deleteByEmoji(
			reaction,
			ReactionEntityEnum.Comment,
			entityId
		);
	}
}
