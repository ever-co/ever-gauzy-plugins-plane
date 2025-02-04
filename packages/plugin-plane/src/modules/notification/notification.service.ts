import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { IPagination, IUserNotification } from '@plane-plugin/models';
import { getUserNotificationsQuery } from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class NotificationService extends ApiFetchService {
	private readonly path = '/user-notification';

	/**
	 * Fetches a list of all notifications from the API.
	 *
	 * @async
	 * @returns {Promise<INotification[]>} A promise that resolves to an array of notification objects.
	 */
	async findAll(
		options?: Partial<IUserNotification>
	): Promise<IUserNotification[]> {
		try {
			const query = qs.stringify(getUserNotificationsQuery(options));
			const notifications: IPagination<IUserNotification> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;

			return notifications.items;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}
}
