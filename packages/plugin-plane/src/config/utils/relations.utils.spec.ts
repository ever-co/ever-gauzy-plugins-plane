/// <reference types="jest" />
import {
	fetchWithSplitRelations,
	groupRelationsByRoot
} from './relations.utils';

describe('groupRelationsByRoot', () => {
	it('keeps nested paths with their root relation', () => {
		expect(
			groupRelationsByRoot([
				'members',
				'members.employee.user.role',
				'modules',
				'organizationSprints'
			])
		).toEqual([
			['members', 'members.employee.user.role'],
			['modules'],
			['organizationSprints']
		]);
	});

	it('returns no groups for no relations', () => {
		expect(groupRelationsByRoot([])).toEqual([]);
	});
});

describe('fetchWithSplitRelations', () => {
	const projects = [{ id: 'a' }, { id: 'b' }];

	const fakeFetch = jest.fn(async (relations: string[]) =>
		projects.map((project) => {
			const loaded: Record<string, unknown> = { ...project };
			for (const relation of relations) {
				loaded[relation.split('.')[0]] = [`${project.id}:${relation}`];
			}
			return loaded as { id: string } & Record<string, unknown>;
		})
	);

	beforeEach(() => fakeFetch.mockClear());

	it('makes one request per root relation and merges every root onto the entities', async () => {
		const result = await fetchWithSplitRelations(
			['members', 'members.employee', 'modules', 'tasks'],
			fakeFetch
		);

		expect(fakeFetch).toHaveBeenCalledTimes(3);
		expect(fakeFetch.mock.calls.map(([relations]) => relations)).toEqual([
			['members', 'members.employee'],
			['modules'],
			['tasks']
		]);
		expect(result).toEqual([
			{
				id: 'a',
				members: ['a:members.employee'],
				modules: ['a:modules'],
				tasks: ['a:tasks']
			},
			{
				id: 'b',
				members: ['b:members.employee'],
				modules: ['b:modules'],
				tasks: ['b:tasks']
			}
		]);
	});

	it('makes a single request when there is at most one root', async () => {
		await fetchWithSplitRelations(
			['members', 'members.employee'],
			fakeFetch
		);
		await fetchWithSplitRelations([], fakeFetch);

		expect(fakeFetch.mock.calls.map(([relations]) => relations)).toEqual([
			['members', 'members.employee'],
			[]
		]);
	});

	it('leaves a root unset when a request did not return the entity', async () => {
		type Project = { id: string; members?: string[]; modules?: string[] };
		const result = await fetchWithSplitRelations(
			['members', 'modules'],
			async (relations): Promise<Project[]> =>
				relations[0] === 'modules'
					? [{ id: 'a', modules: ['m'] }]
					: projects.map((p) => ({ ...p, members: [] }))
		);

		expect(result).toEqual([
			{ id: 'a', members: [], modules: ['m'] },
			{ id: 'b', members: [] }
		]);
	});
});
