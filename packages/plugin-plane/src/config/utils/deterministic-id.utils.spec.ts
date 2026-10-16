/// <reference types="jest" />
import { deterministicUuid } from './deterministic-id.utils';

describe('deterministicUuid', () => {
	it('is stable for the same parts', () => {
		expect(deterministicUuid('intake-state', 'p1')).toBe(
			deterministicUuid('intake-state', 'p1')
		);
	});

	it('differs between projects and kinds', () => {
		const ids = new Set([
			deterministicUuid('intake-state', 'p1'),
			deterministicUuid('intake-state', 'p2'),
			deterministicUuid('other', 'p1')
		]);
		expect(ids.size).toBe(3);
	});

	it('is a version 5, RFC 4122 UUID', () => {
		expect(deterministicUuid('intake-state', 'p1')).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
		);
	});
});
