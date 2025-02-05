import {
	BaseEntityEnum,
	ID,
	IEmployee,
	INotification,
	ITask,
	IUnreadNotificationResponse,
	IUserNotification,
	UserNotificationTypeEnum
} from '@plane-plugin/models';
import { actorDetailsTransformer } from '../user';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { issueTransformer } from '../tasks';

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
	issue: ITask,
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

		const isComment =
			userNotification.type === UserNotificationTypeEnum.MENTION ||
			userNotification.type === UserNotificationTypeEnum.COMMENT;

		const isAssignement =
			userNotification.type === UserNotificationTypeEnum.ASSIGNMENT;

		const currentEmployee = issue.members.find(
			(member) => member.id === employeeId
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
				issue: issueTransformer(issue),
				issue_activity: {
					verb: isComment ? 'created' : 'updated',
					actor: 'None',
					field: isComment
						? 'comment'
						: isAssignement
							? 'assignees'
							: 'None',
					new_value: isAssignement
						? `${currentEmployee.fullName}`
						: 'In Progress',
					old_value: 'None',
					new_identifier: '72ba61b5-a1aa-4c19-9b61-b13278c637e3',
					old_identifier: '0bfe1e3d-69c3-433f-9cbf-60c84c135e84'
				}
			},
			entity_identifier: userNotification.entityId,
			entity_name:
				userNotification.entity === BaseEntityEnum.Task ? 'issue' : '',
			title: notificationTitle,
			message: `${actor.fullName} ${userNotification.title}`,
			message_stripped: userNotification.message,
			message_html: userNotification.message,
			sender: '',
			read_at: userNotification.readAt,
			snoozed_till: userNotification.onHoldUntil,
			archived_at: userNotification.archivedAt,
			created_by: userNotification.sentById,
			workspace: userNotification.organizationId,
			project: issue.projectId,
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
