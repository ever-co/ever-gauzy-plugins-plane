/// <reference types="jest" />
jest.mock('../../credentials', () => ({
	...jest.requireActual('../../credentials'),
	currentEmployeeId: () => 'me-employee',
	currentUserId: () => 'me-user'
}));
import {
	createSubscriptionTransformer,
	getSubscriptionQuery,
	subscriberUserId,
	subscriptionTransformer
} from './subscription.serializer';

/**
 * Opening a work item failed with 500 `Property "userId" was not found in "EntitySubscription"`: Gauzy's
 * subscriptions belong to an employee, and the proxy still filtered, created and read them by `userId`.
 */
describe('subscription serializer — employee-owned subscriptions', () => {
	it('filters by employee, never by user', () => {
		const query = getSubscriptionQuery({
			entityId: 't1',
			employeeId: 'e1',
			userId: 'u1'
		} as any);

		expect(query['where[employeeId]']).toBe('e1');
		expect(query['where[entityId]']).toBe('t1');
		expect(Object.keys(query).some((key) => key.includes('userId'))).toBe(
			false
		);
	});

	it('subscribes the current employee by default', () => {
		const input = createSubscriptionTransformer('t1');

		expect(input).toMatchObject({
			entityId: 't1',
			employeeId: 'me-employee'
		});
		expect(input).not.toHaveProperty('userId');
	});

	it.each([
		[
			'the subscribed employee’s user',
			{ employeeId: 'e1', employee: { userId: 'u1' } },
			'u1'
		],
		[
			'the current user for the current employee’s subscription',
			{ employeeId: 'me-employee' },
			'me-user'
		],
		['a legacy userId', { userId: 'legacy' }, 'legacy'],
		[
			'nobody for another employee without the relation',
			{ employeeId: 'e2' },
			undefined
		]
	])('names %s as the subscriber', (_label, subscription, user) => {
		expect(subscriberUserId(subscription as any)).toBe(user);
		expect(
			(
				subscriptionTransformer({
					id: 's',
					...subscription
				} as any) as any
			).subscriber
		).toBe(user);
	});
});
