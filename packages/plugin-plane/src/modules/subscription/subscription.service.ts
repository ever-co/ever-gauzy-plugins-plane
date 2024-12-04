import { BadRequestException, Injectable } from '@nestjs/common';
import { ID, ISubscription } from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	createSubscriptionTransformer,
	defaultOrganizationId,
} from '../../config';

@Injectable()
export class SubscriptionService extends ApiFetchService {
	private readonly path = '/subscription';

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
}
