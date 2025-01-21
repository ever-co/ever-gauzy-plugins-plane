import {
	BaseEntityEnum,
	ID,
	ISubscriber,
	ISubscription,
	ISubscriptionCreateInput,
	ISubscriptionFindInput,
	SubscriptionTypeEnum
} from '@plane-plugin/models';
import { currentUserId } from '../../credentials';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

/**
 * Transforms the given entity ID into a subscription creation input.
 *
 * @param {ID} entityId - The unique identifier of the entity (task) to associate with the subscription.
 * @param {ID} userId - The user identifier who is subscribing to the task.
 * @returns {ISubscriptionCreateInput} The transformed subscription creation input object.
 *
 * @example
 * const entityId = 'taskId123';
 * const subscriptionInput = createSubscriptionTransformer(entityId);
 * // Output: { entity: 'Task', entityId: 'taskId123', type: 'manual', userId: currentUserId }
 */
export function createSubscriptionTransformer(
	entityId: ID,
	userId: ID = currentUserId()
): ISubscriptionCreateInput {
	return {
		entity: BaseEntityEnum.Task,
		entityId,
		type: SubscriptionTypeEnum.MANUAL,
		userId
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
	): ISubscriber => ({
		id: subscription.id,
		created_at: subscription.createdAt,
		updated_at: subscription.updatedAt,
		deleted_at: subscription.deletedAt,
		created_by: subscription.userId,
		updated_by: null,
		project: projectId,
		workspace: subscription.organizationId,
		issue: subscription.entityId,
		subscriber: subscription.userId
	});

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

	if (options?.userId) {
		query['where[userId]'] = options.userId;
	}

	return query;
};
