import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IPagination,
	ISubscription,
	ISubscriptionFindInput,
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	createSubscriptionTransformer,
	defaultOrganizationId,
	getSubscriptionQuery,
} from '../../config';

@Injectable()
export class SubscriptionService extends ApiFetchService {
	private readonly path = '/subscription';

	/**
	 * Creates a subscription for a given issue and optionally a specific user.
	 *
	 * @param {ID} issueId - The ID of the issue to subscribe to.
	 * @param {ID} [userId] - Optional ID of the user to associate with the subscription. Defaults to the current user if not provided.
	 * @returns {Promise<ISubscription>} A promise that resolves to the created subscription object.
	 * @throws {BadRequestException} If an error occurs during the creation process.
	 */
	async create(issueId: ID, userId?: ID): Promise<ISubscription> {
		try {
			const body = {
				...createSubscriptionTransformer(issueId, userId),
				organizationId: defaultOrganizationId(),
			};

			// Create Subscription
			const subscription: ISubscription = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body,
				})
			).data;

			return subscription;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves a list of subscriptions based on the specified options.
	 *
	 * @param {ISubscriptionFindInput} options - The filters and parameters for querying subscriptions.
	 *   These can include properties like `userId`, `entityId`, or `entity` to narrow down the search.
	 * @returns {Promise<ISubscription[]>} A promise that resolves to an array of subscriptions matching the query.
	 * @throws {BadRequestException} If there is an error during the API fetch or query construction.
	 */
	async findAll(options: ISubscriptionFindInput): Promise<ISubscription[]> {
		try {
			const query = qs.stringify(getSubscriptionQuery(options));
			const subscriptions: IPagination<ISubscription> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			return subscriptions.items;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}
}
