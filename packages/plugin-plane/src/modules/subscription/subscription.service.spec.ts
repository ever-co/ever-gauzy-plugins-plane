/// <reference types="jest" />
// Only what the service imports from config, so the test does not load the models package (unbuilt in a fresh
// checkout) through the rest of config.
jest.mock('../../config', () => ({
	createSubscriptionTransformer: jest.fn(),
	getCurrentOrganizationSlug: () => 'org-1',
	getSubscriptionQuery: jest.fn()
}));
import 'reflect-metadata';
import { SubscriptionService } from './subscription.service';

type Call = { method: string; path: string; query?: string };

/**
 * Unsubscribing from a work item failed with 400 "organization must be an object": Gauzy validates the
 * delete query as a tenant-organization input, and the proxy sent only the entity.
 */
describe('SubscriptionService.unsubscribe', () => {
	it('names the organization on the delete', async () => {
		const calls: Call[] = [];
		const service = Object.create(
			SubscriptionService.prototype
		) as SubscriptionService;
		Object.defineProperty(service, 'logger', {
			value: { error: () => undefined }
		});
		Object.assign(service, {
			path: '/entity-subscription',
			findAll: async () => [{ id: 'sub-1' }],
			apiFetch: async (call: Call) => {
				calls.push(call);
				return { data: { affected: 1 } };
			}
		});

		await service.unsubscribe({
			entity: 'Task',
			entityId: 't1',
			employeeId: 'e1'
		} as any);

		expect(calls).toHaveLength(1);
		expect(calls[0].method).toBe('DELETE');
		expect(calls[0].path).toBe('/entity-subscription/sub-1');
		expect(new URLSearchParams(calls[0].query)).toEqual(
			new URLSearchParams({
				entity: 'Task',
				entityId: 't1',
				organizationId: 'org-1'
			})
		);
	});
});
