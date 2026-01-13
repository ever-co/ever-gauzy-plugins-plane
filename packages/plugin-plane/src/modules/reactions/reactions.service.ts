import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ICreateReactionInput,
	ID,
	IPagination,
	IReaction,
	ReactionEntityEnum
} from '@plane-plugin/models';
import {
	createReactionInputTransformer,
	getCurrentOrganizationSlug,
	getReactionsQuery
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class ReactionsService extends ApiFetchService {
	private readonly path = '/reaction';

	/**
	 * @description Create reaction
	 * @param {ICreateReactionInput} input Body Request data for reaction creation
	 * @param {ReactionEntityEnum} entity Reacted entity type
	 * @param {ID} entityId reacted entity ID
	 * @returns A promise resolved to created reaction
	 * @memberof ReactionsService
	 */
	async create(
		input: ICreateReactionInput,
		entity: ReactionEntityEnum,
		entityId: ID
	): Promise<IReaction> {
		try {
			const body = {
				...createReactionInputTransformer(input, entity, entityId),
				organizationId: getCurrentOrganizationSlug()
			};

			const reaction: IReaction = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body
				})
			).data;

			return reaction;
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Find reactions
	 * @param {Partial<IReaction>} options Filter options
	 * @returns A promise resolved to fetched reactions
	 * @memberof ReactionsService
	 */
	async findAll(options: Partial<IReaction>): Promise<IReaction[]> {
		try {
			const { entity, entityId, emoji } = options;

			const query = qs.stringify(
				getReactionsQuery(entityId, entity, emoji)
			);

			const reactions: IPagination<IReaction> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;

			return reactions.items;
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException();
		}
	}

	/**
	 * @description Find one reaction
	 * @param {ID} id - Reaction ID
	 * @param {Partial<IReaction>} options - Filter options
	 * @returns A promise resolved to found reaction
	 * @memberof ReactionsService
	 */
	async findOne(id: ID, options: Partial<IReaction>): Promise<IReaction> {
		try {
			const { entity, entityId } = options;

			const query = qs.stringify(getReactionsQuery(entityId, entity));

			const reaction: IReaction = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/${id}`,
					query
				})
			).data;

			return reaction;
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Delete reaction by Emoji. This method will attempt to create same reaction
	 * for same entity type and same Entity ID for same user.
	 * That should delete reaction as it works here as a toggle
	 *
	 * @param {string} reaction Reaction input
	 * @param {ReactionEntityEnum} entity Reaction entity type
	 * @param {ID} entityId Reaction associated entity ID
	 * @returns A promise resolved to deleted reaction
	 * @memberof ReactionsService
	 */
	async deleteByEmoji(
		reaction: string,
		entity: ReactionEntityEnum,
		entityId: ID
	): Promise<any> {
		return await this.create({ reaction }, entity, entityId);
	}

	/**
	 * @description Delete reaction
	 * @param {ID} id The reaction ID to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof ReactionsService
	 */
	async delete(id: ID): Promise<any> {
		return (
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${id}`
			})
		).data;
	}
}
