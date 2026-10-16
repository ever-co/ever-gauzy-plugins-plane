/// <reference types="jest" />
// `uuid` is ESM-only and this package's Jest config does not transform node_modules; nothing here needs real ids.
jest.mock('uuid', () => ({
	v4: () => '00000000-0000-4000-8000-000000000000',
	validate: () => true
}));
import 'reflect-metadata';
import { EmployeeSettingDataOperationEnum } from '@ever-gauzy/plugin-integration-plane-models';
import { WorkspacePreferencesService } from './workspace-preferences.service';

const { SET } = EmployeeSettingDataOperationEnum;

/**
 * The preferences now reach Gauzy as key-level patches: each PATCH from the Plane UI becomes `set` operations on
 * exactly the keys it changes, never a rewrite of the whole record.
 */
describe('WorkspacePreferencesService saves key-level patches', () => {
	let patches: Array<{ id: string; operations: any[] }>;
	let service: WorkspacePreferencesService;

	beforeEach(() => {
		patches = [];
		const employeeProperties = {
			findOneByOptions: async () => ({ id: 's1', data: {} }),
			patchData: async (id: string, operations: any[]) => {
				patches.push({ id, operations });
				return { id, data: {} };
			},
			update: jest.fn(),
			create: jest.fn()
		};
		service = new WorkspacePreferencesService(employeeProperties as any);
	});

	it('one sidebar item: only its sent fields', async () => {
		await service.updateSidebarPreference('views', { is_pinned: false });

		expect(patches).toEqual([
			{
				id: 's1',
				operations: [
					{
						op: SET,
						path: ['sidebar_preferences', 'views', 'is_pinned'],
						value: false
					}
				]
			}
		]);
	});

	it('several sidebar items in one patch', async () => {
		await service.updateSidebarPreferences([
			{ key: 'views', is_pinned: true, sort_order: 1 },
			{ key: 'pages', sort_order: 2 }
		]);

		expect(patches[0].operations).toEqual([
			{
				op: SET,
				path: ['sidebar_preferences', 'views', 'is_pinned'],
				value: true
			},
			{
				op: SET,
				path: ['sidebar_preferences', 'views', 'sort_order'],
				value: 1
			},
			{
				op: SET,
				path: ['sidebar_preferences', 'pages', 'sort_order'],
				value: 2
			}
		]);
	});

	it('a home widget: sent fields only, config replaced whole', async () => {
		await service.updateHomePreference('my_stickies', {
			is_enabled: false,
			config: { limit: 3 }
		});

		expect(patches[0].operations).toEqual([
			{
				op: SET,
				path: ['home_preferences', 'my_stickies', 'is_enabled'],
				value: false
			},
			{
				op: SET,
				path: ['home_preferences', 'my_stickies', 'config'],
				value: { limit: 3 }
			}
		]);
	});

	it('user properties: each sent section replaces the stored one', async () => {
		await service.updateUserProperties({
			rich_filters: {},
			navigation_project_limit: 5
		});

		expect(patches[0].operations).toEqual([
			{ op: SET, path: ['rich_filters'], value: {} },
			{ op: SET, path: ['navigation_project_limit'], value: 5 }
		]);
	});

	it('writes nothing for a PATCH without changes', async () => {
		await service.updateSidebarPreference('views', {});
		expect(patches).toEqual([]);
	});
});
