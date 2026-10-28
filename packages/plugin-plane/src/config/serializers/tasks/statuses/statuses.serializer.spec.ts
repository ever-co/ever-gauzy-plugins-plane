/// <reference types="jest" />
import { getStatesTransformer } from './statuses.serializer';

const status = (id: string, projectId: string | null) =>
	({
		id,
		name: 'open',
		value: 'open',
		projectId,
		organizationId: 'org'
	}) as any;

/**
 * Gauzy answers a project without statuses of its own with the shared system statuses (`projectId` null).
 * Plane draws only the states whose `project_id` is the project, so its work-item lists were blank.
 */
describe('getStatesTransformer — project of shared statuses', () => {
	it('gives shared statuses the project they were read for', () => {
		expect(
			getStatesTransformer([status('s1', null)], 'p1')[0].project_id
		).toBe('p1');
	});

	it('keeps a project status’s own project (control)', () => {
		expect(
			getStatesTransformer([status('s1', 'own')], 'p1')[0].project_id
		).toBe('own');
	});

	it('leaves shared statuses without a project when none was asked for', () => {
		expect(
			getStatesTransformer([status('s1', null)])[0].project_id
		).toBeNull();
	});
});
