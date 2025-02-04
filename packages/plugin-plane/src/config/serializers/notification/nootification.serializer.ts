import {
	BaseEntityEnum,
	IEmployee,
	IIssue,
	INotification,
	IUnreadNotificationResponse,
	IUserNotification,
	UserNotificationTypeEnum
} from '@plane-plugin/models';
import { actorDetailsTransformer } from '../user';

/**
 * Transforms a user notification into a notification object.
 *
 * @param {IUserNotification} userNotification - The user notification to transform.
 * @param {IIssue} issue - The issue associated with the notification.
 * @param {IEmployee} actor - The actor who triggered the notification.
 * @param {IEmployee[]} employees - The list of employees.
 * @returns {INotification} The transformed notification object.
 */
export function notificationITranformer(
	userNotification: IUserNotification,
	issue: IIssue,
	actor: IEmployee,
	employees: IEmployee[]
): INotification {
	const receiver = employees.find(
		(employee) => employee.userId === userNotification.receiverId
	);

	const sentBy = employees.find(
		(employee) => employee.userId === userNotification.sentById
	);

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
		title: userNotification.title,
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
		triggered_by: sentBy.id,
		receiver: receiver.id
	};
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
