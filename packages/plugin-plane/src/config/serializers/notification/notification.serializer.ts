import {
	BaseEntityEnum,
	ID,
	IEmployee,
	IIssue,
	INotification,
	IUnreadNotificationResponse,
	IUserNotification,
	UserNotificationTypeEnum
} from '@plane-plugin/models';
import { actorDetailsTransformer } from '../user';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

/**
 * Transforms a user notification into a notification object.
 *
 * @param {IUserNotification} userNotifications - The user notification to transform.
 * @param {IIssue} issue - The issue associated with the notification.
 * @param {IEmployee} actor - The actor who triggered the notification.
 * @param {ID} employeeId - The of employee ID of receiver .
 * @returns {INotification} The transformed notification object.
 */
export function notificationTranformer(
	userNotifications: IUserNotification[] | IUserNotification,
	issue: IIssue,
	actor: IEmployee,
	employeeId?: ID
): INotification | INotification[] {
	const tranformUserNotification = (
		userNotification: IUserNotification
	): INotification => {
		const notificationTitle =
			userNotification.type === UserNotificationTypeEnum.ASSIGNMENT
				? 'added assignee '
				: '';

		return {
			id: userNotification.id,
			triggered_by_details: actorDetailsTransformer(actor),
			is_inbox_issue: true,
			is_intake_issue: true,
			is_mentioned_notification:
				userNotification.type === UserNotificationTypeEnum.MENTION,
			created_at: userNotification.createdAt,
			updated_at: userNotification.updatedAt,
			deleted_at: userNotification.deletedAt,
			data: {
				issue,
				issue_activity: null // TODO : improve this
			},
			entity_identifier: userNotification.entityId,
			entity_name:
				userNotification.entity === BaseEntityEnum.Task ? 'issue' : '',
			title: notificationTitle,
			message: userNotification.message,
			message_stripped: userNotification.message,
			message_html: userNotification.message,
			sender: '',
			read_at: userNotification.readAt,
			snoozed_till: userNotification.onHoldUntil,
			archived_at: userNotification.archivedAt,
			created_by: userNotification.sentById,
			workspace: userNotification.organizationId,
			project: issue.project_id,
			triggered_by: actor.id,
			receiver: employeeId
		};
	};

	if (Array.isArray(userNotifications)) {
		return userNotifications.map(tranformUserNotification);
	}

	return tranformUserNotification(userNotifications);
}

/**
 * Calculates the unread notification data from a list of notifications.
 *
 * @param {IUserNotification[]} notifications - The list of notifications.
 * @returns {IUnreadNotificationResponse} An object containing the total unread notification count and the mention unread notification count.
 */
export function unreadNotificationData(
	notifications: IUserNotification[]
): IUnreadNotificationResponse {
	const unreadNotifications = notifications.filter(
		(notification) => !notification.isRead
	).length;

	return {
		total_unread_notifications_count: unreadNotifications,
		mention_unread_notifications_count: notifications.filter(
			(notification) =>
				notification.type === UserNotificationTypeEnum.MENTION &&
				!notification.isRead
		).length
	};
}

export function getUserNotificationsQuery(
	options: Partial<IUserNotification>
): Record<string, any> {
	const relations = ['sentBy', 'receiver'];

	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	if (options?.receiverId) {
		query['where[receiverId]'] = options?.receiverId;
	}

	if (options?.isRead) {
		query['where[isRead]'] = options?.isRead;
	}

	if (options?.entityId) {
		query['where[entityId]'] = options?.entityId;
	}

	if (options?.entity) {
		query['where[entity]'] = options?.entity;
	}

	relations.forEach((relation, i) => {
		query[`relations[${i}]`] = relation;
	});

	return query;
}
