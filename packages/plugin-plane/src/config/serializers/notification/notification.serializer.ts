import {
	BaseEntityEnum,
	INotification,
	ITask,
	IUnreadNotificationResponse,
	IEmployeeNotification,
	EmployeeNotificationTypeEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import { actorDetailsTransformer } from '../user';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { issueTransformer } from '../tasks';

/**
 * Transforms a user notification into a notification object.
 *
 * @param {IEmployeeNotification} employeeNotifications - The user notification to transform.
 * @param {IIssue} issue - The issue associated with the notification.
 * @returns {INotification} The transformed notification object.
 */
export function notificationTranformer(
	employeeNotifications: IEmployeeNotification[] | IEmployeeNotification,
	issue: ITask
): INotification | INotification[] {
	const tranformemployeeNotification = (
		employeeNotification: IEmployeeNotification
	): INotification => {
		const notificationTitle =
			employeeNotification.type ===
			EmployeeNotificationTypeEnum.ASSIGNMENT
				? 'added assignee '
				: '';

		const isComment =
			employeeNotification.type ===
				EmployeeNotificationTypeEnum.MENTION ||
			employeeNotification.type === EmployeeNotificationTypeEnum.COMMENT;

		const isAssignement =
			employeeNotification.type ===
			EmployeeNotificationTypeEnum.ASSIGNMENT;

		return {
			id: employeeNotification.id,
			triggered_by_details: actorDetailsTransformer(
				employeeNotification.sentBy
			),
			is_inbox_issue: true,
			is_intake_issue: true,
			is_mentioned_notification:
				employeeNotification.type ===
				EmployeeNotificationTypeEnum.MENTION,
			created_at: employeeNotification.createdAt,
			updated_at: employeeNotification.updatedAt,
			deleted_at: employeeNotification.deletedAt,
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
						? `${employeeNotification.receiver.fullName}`
						: 'In Progress',
					old_value: 'None',
					new_identifier: '72ba61b5-a1aa-4c19-9b61-b13278c637e3',
					old_identifier: '0bfe1e3d-69c3-433f-9cbf-60c84c135e84'
				}
			},
			entity_identifier: employeeNotification.entityId,
			entity_name:
				employeeNotification.entity === BaseEntityEnum.Task
					? 'issue'
					: '',
			title: notificationTitle,
			message: `${employeeNotification.sentBy.fullName} ${employeeNotification.title}`,
			message_stripped: employeeNotification.message,
			message_html: employeeNotification.message,
			sender: '',
			read_at: employeeNotification.readAt,
			snoozed_till: employeeNotification.onHoldUntil,
			archived_at: employeeNotification.archivedAt,
			created_by: employeeNotification.sentById,
			workspace: employeeNotification.organizationId,
			project: issue.projectId,
			triggered_by: employeeNotification.sentById,
			receiver: employeeNotification.receiverId
		};
	};

	if (Array.isArray(employeeNotifications)) {
		return employeeNotifications.map(tranformemployeeNotification);
	}

	return tranformemployeeNotification(employeeNotifications);
}

/**
 * Calculates the unread notification data from a list of notifications.
 *
 * @param {IEmployeeNotification[]} notifications - The list of notifications.
 * @returns {IUnreadNotificationResponse} An object containing the total unread notification count and the mention unread notification count.
 */
export function unreadNotificationData(
	notifications?: IEmployeeNotification[]
): IUnreadNotificationResponse {
	if (Array.isArray(notifications) && notifications.length > 0) {
		const unreadNotifications = notifications.filter(
			(notification) => !notification.isRead
		).length;

		return {
			total_unread_notifications_count: unreadNotifications,
			mention_unread_notifications_count: notifications.filter(
				(notification) =>
					notification.type ===
						EmployeeNotificationTypeEnum.MENTION &&
					!notification.isRead
			).length
		};
	}

	return {
		total_unread_notifications_count: 0,
		mention_unread_notifications_count: 0
	};
}

/**
 * Builds a query object for fetching employee notifications with optional filters and predefined relations.
 *
 * This function generates a query object formatted for APIs that accept filtering via
 * nested query parameters like `where[field]=value` and `relations[index]=relation`.
 *
 * @param {Partial<IEmployeeNotification>} options - Optional filters for the notifications query.
 * - `receiverId`: Filters by the receiver employee's ID.
 * - `isRead`: Filters by read status.
 * - `entityId`: Filters by the related entity ID.
 * - `entity`: Filters by the related entity type.
 *
 * @returns {Record<string, any>} A query object that can be used in an HTTP request (e.g., for RESTful endpoints).
 */
export function getEmployeeNotificationsQuery(
	options: Partial<IEmployeeNotification>
): Record<string, any> {
	const relations = ['sentByEmployee.user', 'receiverEmployee.user'];

	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	if (options?.receiverId) {
		query['where[receiverEmployeeId]'] = options?.receiverId;
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
