import {
	BaseEntityEnum,
	ID,
	ISubscriber,
	ISubscription,
	ISubscriptionCreateInput,
	ISubscriptionFindInput,
	SubscriptionTypeEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import { currentEmployeeId, currentUserId } from '../../credentials';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

/**
 * Transforms the given entity ID into a subscription creation input.
 *
 * @param {ID} entityId - The unique identifier of the entity (task) to associate with the subscription.
 * @param {ID} employeeId - The employee subscribing to the task; Gauzy subscriptions belong to an employee.
 * @returns {ISubscriptionCreateInput} The transformed subscription creation input object.
 *
 * @example
 * const entityId = 'taskId123';
 * const subscriptionInput = createSubscriptionTransformer(entityId);
 * // Output: { entity: 'Task', entityId: 'taskId123', type: 'manual', employeeId: currentEmployeeId }
 */
export function createSubscriptionTransformer(
	entityId: ID,
	employeeId: ID = currentEmployeeId()!
): ISubscriptionCreateInput {
	return {
		entity: BaseEntityEnum.Task,
		entityId,
		type: SubscriptionTypeEnum.MANUAL,
		employeeId
	};
}

/**
 * Transforms subscription(s) into subscriber format.
 *
 * @param {ISubscription | ISubscription[]} subscriptions - A single subscription or an array of subscriptions.
 * @param {ID} [projectId] - Optional project ID to include in the transformed data.
 * @returns {ISubscriber | ISubscriber[]} Transformed subscriber(s).
 */
export function subscriptionTransformer(
	subscriptions: ISubscription | ISubscription[],
	projectId?: ID
): ISubscriber | ISubscriber[] {
	const transformSubscription = (
		subscription: ISubscription
	): ISubscriber => {
		const userId = subscriberUserId(subscription);
		return {
			id: subscription.id!,
			created_at: subscription.createdAt,
			updated_at: subscription.updatedAt,
			deleted_at: subscription.deletedAt,
			created_by: userId,
			updated_by: undefined,
			project: projectId,
			workspace: subscription.organizationId,
			issue: subscription.entityId,
			subscriber: userId
		};
	};

	if (Array.isArray(subscriptions)) {
		return subscriptions.map(transformSubscription);
	}

	return transformSubscription(subscriptions);
}

export const getSubscriptionQuery = (
	options: ISubscriptionFindInput
): Record<string, any> => {
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	if (options?.entity) {
		query['where[entity]'] = options.entity;
	}

	if (options?.entityId) {
		query['where[entityId]'] = options.entityId;
	}

	// Gauzy's EntitySubscription belongs to an employee and refuses a `userId` filter with a 500.
	if (options?.employeeId) {
		query['where[employeeId]'] = options.employeeId;
	}

	return query;
};

/**
 * The user a subscription belongs to, which is what Plane calls the subscriber: the subscribed employee's
 * user, else the current user when the subscription is the current employee's (Gauzy's create response
 * carries `employeeId` without the employee), else a legacy `userId`.
 *
 * @param subscription - A Gauzy subscription.
 * @returns The subscriber's user id, if known.
 */
export function subscriberUserId(subscription: ISubscription): ID | undefined {
	if (subscription.employee?.userId) {
		return subscription.employee.userId;
	}
	if (
		subscription.employeeId &&
		subscription.employeeId === currentEmployeeId()
	) {
		return currentUserId() ?? undefined;
	}
	return subscription.userId;
}
