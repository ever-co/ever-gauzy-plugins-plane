import {
	BaseEntityEnum,
	ID,
	ISubscriptionCreateInput,
	SubscriptionTypeEnum,
} from '@plane-plugin/models';
import { defaultUserId } from '../../credentials';

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
 * // Output: { entity: 'Task', entityId: 'taskId123', type: 'manual', userId: defaultUserId }
 */
export function createSubscriptionTransformer(
	entityId: ID,
	userId: ID = defaultUserId(),
): ISubscriptionCreateInput {
	return {
		entity: BaseEntityEnum.Task,
		entityId,
		type: SubscriptionTypeEnum.MANUAL,
		userId,
	};
}
