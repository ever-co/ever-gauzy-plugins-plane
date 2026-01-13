import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IEmployeeNotificationUpdateInput,
	IPagination,
	IEmployeeNotification
} from '@plane-plugin/models';
import { getEmployeeNotificationsQuery } from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class NotificationService extends ApiFetchService {
	private readonly path = '/employee-notification';

	/**
	 * Updates a notification with the specified ID.
	 *
	 * @async
	 * @param {ID} id - The ID of the notification to update.
	 * @param {IEmployeeNotificationUpdateInput} input - The updated notification information.
	 * @returns {Promise<IEmployeeNotification>} A promise that resolves to the updated notification.
	 */
	async update(
		id: ID,
		input: IEmployeeNotificationUpdateInput
	): Promise<IEmployeeNotification> {
		try {
			const response = await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: input
			});
			return response.data;
		} catch (error: any) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
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
		options?: Partial<IEmployeeNotification>
	): Promise<IEmployeeNotification[]> {
		try {
			const query = qs.stringify(getEmployeeNotificationsQuery(options));
			const notifications: IPagination<IEmployeeNotification> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;

			return notifications.items;
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Fetches a notification with the specified ID.
	 *
	 * @async
	 * @param {ID} id - The ID of the notification to fetch.
	 * @param {IEmployeeNotification} [options] - Optional query options.
	 * @returns {Promise<IEmployeeNotification>} A promise that resolves to the notification.
	 */
	async findOne(
		id: ID,
		options?: IEmployeeNotification
	): Promise<IEmployeeNotification> {
		try {
			const query = qs.stringify(getEmployeeNotificationsQuery(options));
			const response = await this.apiFetch({
				method: 'GET',
				path: `${this.path}/${id}`,
				query
			});
			return response.data;
		} catch (error: any) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
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
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}
}
