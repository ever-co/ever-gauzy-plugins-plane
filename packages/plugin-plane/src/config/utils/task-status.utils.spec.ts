/// <reference types="jest" />
import { normalizeStatusValue, resolveTaskStatusId } from './task-status.utils';

/** The six statuses Gauzy gives a project (its own copies, or the shared system ones). */
const STATUSES = [
	{ id: 'open-id', value: 'open', name: 'open' },
	{ id: 'progress-id', value: 'in-progress', name: 'in-progress' },
	{ id: 'ready-id', value: 'ready-for-review', name: 'ready-for-review' },
	{ id: 'review-id', value: 'in-review', name: 'in-review' },
	{ id: 'blocked-id', value: 'blocked', name: 'blocked' },
	{ id: 'done-id', value: 'completed', name: 'Completed' }
];

/**
 * 1,087 Ever Tech tasks carried only a status string (`open`, `in-progress`, …) and no `taskStatusId`, so they
 * fitted no Plane state and vanished from every list grouped by state.
 */
describe('resolveTaskStatusId', () => {
	it.each([
		['open', 'open-id'],
		['in-progress', 'progress-id'],
		['In Progress', 'progress-id'],
		['in_review', 'review-id'],
		['Todo', 'open-id'],
		['closed', 'done-id'],
		['Completed', 'done-id']
	])('places a task with status %j', (status, id) => {
		expect(
			resolveTaskStatusId({ taskStatusId: null, status }, STATUSES)
		).toBe(id);
	});

	it('keeps a task’s own status id', () => {
		expect(
			resolveTaskStatusId(
				{ taskStatusId: 'own-id', status: 'open' },
				STATUSES
			)
		).toBe('own-id');
	});

	it('matches a status by name when no value matches', () => {
		expect(
			resolveTaskStatusId({ status: 'Waiting' }, [
				{ id: 'w', value: 'custom-1', name: 'Waiting' }
			])
		).toBe('w');
	});

	it('leaves a task it cannot place without a status', () => {
		expect(
			resolveTaskStatusId({ status: 'something' }, STATUSES)
		).toBeUndefined();
		expect(resolveTaskStatusId({ status: '' }, STATUSES)).toBeUndefined();
		expect(resolveTaskStatusId({}, STATUSES)).toBeUndefined();
	});

	it('normalizes case, spaces, underscores and aliases', () => {
		expect(normalizeStatusValue(' Ready For_Review ')).toBe(
			'ready-for-review'
		);
		expect(normalizeStatusValue('To Do')).toBe('open');
		expect(normalizeStatusValue('done')).toBe('completed');
		expect(normalizeStatusValue(undefined)).toBe('');
	});
});
