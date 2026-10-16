/// <reference types="jest" />
import { articleToPage, articlesToPages } from './page.serializer';

describe('articleToPage actor fields', () => {
	const employees = new Map([
		['user-creator', 'emp-creator'],
		['user-editor', 'emp-editor']
	]);

	it('resolves owner, creator and editor independently', () => {
		const page = articleToPage(
			{
				id: 'p1',
				ownedById: 'emp-owner',
				createdByUserId: 'user-creator',
				updatedByUserId: 'user-editor'
			},
			employees
		);

		expect(page.owned_by).toBe('emp-owner');
		expect(page.created_by).toBe('emp-creator');
		expect(page.updated_by).toBe('emp-editor');
	});

	it('falls back to the creator employee for the owner when the page has none', () => {
		const page = articleToPage(
			{
				id: 'p2',
				ownedById: null,
				createdByUserId: 'user-creator',
				updatedByUserId: 'user-creator'
			},
			employees
		);

		expect(page.owned_by).toBe('emp-creator');
		expect(page.created_by).toBe('emp-creator');
		expect(page.updated_by).toBe('emp-creator');
	});

	it('keeps an unmappable recorded editor null instead of crediting the owner', () => {
		const page = articleToPage(
			{
				id: 'p3',
				ownedById: 'emp-owner',
				createdByUserId: 'user-creator',
				updatedByUserId: 'user-gone'
			},
			employees
		);

		expect(page.owned_by).toBe('emp-owner');
		expect(page.updated_by).toBeNull();
	});

	it('keeps null (never the string "null") when nothing maps', () => {
		const page = articleToPage({
			id: 'p4',
			ownedById: null,
			createdByUserId: 'user-unknown'
		});

		expect(page.owned_by).toBeNull();
		expect(page.created_by).toBeNull();
		expect(page.updated_by).toBeNull();
	});

	it('uses the owner for created_by on rows without a recorded creator', () => {
		const page = articleToPage({ id: 'p5', ownedById: 'emp-owner' });

		expect(page.created_by).toBe('emp-owner');
		expect(page.updated_by).toBe('emp-owner');
	});

	it('articlesToPages does not pass the array index as the employee map', () => {
		const pages = articlesToPages([
			{ id: 'a', ownedById: 'emp-a' },
			{ id: 'b', ownedById: 'emp-b' }
		]) as ReturnType<typeof articleToPage>[];

		expect(pages.map((page) => page.owned_by)).toEqual(['emp-a', 'emp-b']);
	});
});
