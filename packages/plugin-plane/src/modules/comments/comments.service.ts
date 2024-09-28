import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	CommentEntityEnum,
	IComment,
	ICommentFindInput,
	ICreateCommentInput,
	ID,
	IPagination,
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	createCommentInputTransformer,
	defaultOrganizationId,
	getCommentsQuery,
} from '../../config';

@Injectable()
export class CommentsService extends ApiFetchService {
	private readonly path = '/comment';

	/**
	 * @description Create comment
	 * @param {ICreateCommentInput} input body request for comment creation
	 * @param {CommentEntityEnum} entity commented entity type
	 * @param {ID} entityId commented entity ID
	 * @returns A promise resolved to created comment
	 * @memberof CommentsService
	 */
	async create(
		input: ICreateCommentInput,
		entity: CommentEntityEnum,
		entityId: ID,
	): Promise<IComment> {
		try {
			const body = createCommentInputTransformer(input, entity, entityId);

			const comment: IComment = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body: { ...body, organizationId: defaultOrganizationId },
				})
			).data;

			return comment;
		} catch (error) {
			console.log(error);
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
		input: Partial<ICreateCommentInput>,
	): Promise<IComment> {
		try {
			const comment: IComment = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body: input,
				})
			).data;

			console.log({ comment });

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
	 * @description Delete comment
	 * @param {ID} id - The issue ID to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof CommentsService
	 */
	async delete(id: ID): Promise<any> {
		return (
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${id}`,
			})
		).data;
	}
}
