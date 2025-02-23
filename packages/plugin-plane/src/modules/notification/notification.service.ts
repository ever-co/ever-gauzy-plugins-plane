import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	INotificationUpdateInput,
	IPagination,
	IUserNotification
} from '@plane-plugin/models';
import { getUserNotificationsQuery } from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class NotificationService extends ApiFetchService {
	private readonly path = '/employee-notification';

	/**
	 * Updates a notification with the specified ID.
	 *
	 * @async
	 * @param {ID} id - The ID of the notification to update.
	 * @param {INotificationUpdateInput} input - The updated notification information.
	 * @returns {Promise<IUserNotification>} A promise that resolves to the updated notification.
	 */
	async update(
		id: ID,
		input: INotificationUpdateInput
	): Promise<IUserNotification> {
		try {
			const response = await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: input
			});
			return response.data;
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

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

	/**
	 * Fetches a notification with the specified ID.
	 *
	 * @async
	 * @param {ID} id - The ID of the notification to fetch.
	 * @param {IUserNotification} [options] - Optional query options.
	 * @returns {Promise<IUserNotification>} A promise that resolves to the notification.
	 */
	async findOne(
		id: ID,
		options?: IUserNotification
	): Promise<IUserNotification> {
		try {
			const query = qs.stringify(getUserNotificationsQuery(options));
			const response = await this.apiFetch({
				method: 'GET',
				path: `${this.path}/${id}`,
				query
			});
			return response.data;
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Marks all notifications as read.
	 *
	 * @async
	 * @returns {Promise<any>} A promise that resolves to the response data.
	 */
	async markAllAsRead(): Promise<any> {
		try {
			const response = await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/mark-all-read`
			});
			return response.data;
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
