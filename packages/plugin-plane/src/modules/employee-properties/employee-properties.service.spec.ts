/// <reference types="jest" />
// `uuid` is ESM-only and this package's Jest config does not transform node_modules; nothing here needs real ids.
jest.mock('uuid', () => ({
	v4: () => '00000000-0000-4000-8000-000000000000',
	validate: () => true
}));
import 'reflect-metadata';
import { AxiosError, AxiosHeaders } from 'axios';
import {
	BaseEntityEnum,
	EmployeeSettingDataOperationEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import { EmployeePropertiesService } from './employee-properties.service';

const { SET } = EmployeeSettingDataOperationEnum;

type Call = { method: string; path: string; body?: any };

/** A Gauzy 404 the way axios hands it over. */
const notFound = (message: string) =>
	new AxiosError('Not Found', '404', undefined, undefined, {
		status: 404,
		statusText: 'Not Found',
		headers: {},
		config: { headers: new AxiosHeaders() },
		data: { statusCode: 404, message }
	});

function serviceWith(
	respond: (call: Call) => any,
	calls: Call[] = []
): EmployeePropertiesService {
	const service = Object.create(
		EmployeePropertiesService.prototype
	) as EmployeePropertiesService;
	Object.defineProperty(service, 'logger', {
		value: { error: () => undefined, warn: () => undefined }
	});
	Object.assign(service, {
		path: '/employee-settings',
		apiFetch: async (call: Call) => {
			calls.push(call);
			return { data: await respond(call) };
		}
	});
	return service;
}

describe('EmployeePropertiesService.patchData', () => {
	const operations = [
		{
			op: SET,
			path: ['sidebar_preferences', 'views', 'is_pinned'],
			value: true
		}
	];

	it('sends the operations to the atomic patch route', async () => {
		const calls: Call[] = [];
		const service = serviceWith(
			() => ({ id: 's1', data: { patched: true } }),
			calls
		);

		await expect(service.patchData('s1', operations)).resolves.toEqual({
			id: 's1',
			data: { patched: true }
		});
		expect(calls).toEqual([
			{
				method: 'PATCH',
				path: '/employee-settings/s1/data',
				body: { operations, organizationId: expect.any(String) }
			}
		]);
	});

	it('falls back to read + apply + PUT on a Gauzy without the route', async () => {
		const calls: Call[] = [];
		const service = serviceWith((call) => {
			if (call.method === 'PATCH') {
				throw notFound('Cannot PATCH /api/employee-settings/s1/data');
			}
			if (call.method === 'GET') {
				return {
					id: 's1',
					entity: BaseEntityEnum.Organization,
					entityId: 'org',
					settingType: 'Task-View',
					data: { display_filters: { layout: 'list' } }
				};
			}
			return { id: 's1', ...call.body };
		}, calls);

		const result = await service.patchData('s1', operations);

		expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
			'PATCH /employee-settings/s1/data',
			'GET /employee-settings/s1',
			'PUT /employee-settings/s1'
		]);
		expect(calls[2].body).toMatchObject({
			entity: BaseEntityEnum.Organization,
			entityId: 'org',
			data: {
				display_filters: { layout: 'list' },
				sidebar_preferences: { views: { is_pinned: true } }
			}
		});
		expect(result.data).toEqual(calls[2].body.data);
	});

	it('does not fall back when the setting itself is missing', async () => {
		const calls: Call[] = [];
		const service = serviceWith(() => {
			throw notFound('Employee Setting not found');
		}, calls);

		await expect(service.patchData('s1', operations)).rejects.toThrow();
		expect(calls).toHaveLength(1);
	});
});

describe('EmployeePropertiesService.saveViewProperties', () => {
	it('patches only the sections that were sent', async () => {
		const calls: Call[] = [];
		const service = serviceWith(
			(call) =>
				call.method === 'GET'
					? { items: [{ id: 's1', data: {} }] }
					: { id: 's1' },
			calls
		);

		await service.saveViewProperties(
			BaseEntityEnum.OrganizationProject,
			'p1',
			{
				display_filters: { layout: 'kanban' },
				rich_filters: {}
			} as any
		);

		const patch = calls.find((c) => c.method === 'PATCH');
		expect(patch?.path).toBe('/employee-settings/s1/data');
		expect(patch?.body.operations).toEqual([
			{ op: SET, path: ['rich_filters'], value: {} },
			{ op: SET, path: ['display_filters'], value: { layout: 'kanban' } }
		]);
		expect(calls.some((c) => c.method === 'PUT')).toBe(false);
	});

	it('creates the setting with the defaults first, then applies the first save', async () => {
		const calls: Call[] = [];
		const service = serviceWith((call) => {
			if (call.method === 'GET') return { items: [] };
			if (call.method === 'POST')
				return { id: 'new', data: call.body.data };
			return { id: 'new', data: { filters: { priority: ['high'] } } };
		}, calls);

		await service.saveViewProperties(
			BaseEntityEnum.OrganizationSprint,
			'c1',
			{
				filters: { priority: ['high'] }
			} as any
		);

		expect(calls.map((c) => c.method)).toEqual(['GET', 'POST', 'PATCH']);
		expect(calls[1].body).toMatchObject({
			entity: BaseEntityEnum.OrganizationSprint,
			entityId: 'c1'
		});
		expect(calls[2].body.operations).toEqual([
			{ op: SET, path: ['filters'], value: { priority: ['high'] } }
		]);
	});

	it('writes nothing when no section was sent', async () => {
		const calls: Call[] = [];
		const service = serviceWith(
			() => ({ items: [{ id: 's1', data: { kept: true } }] }),
			calls
		);

		await expect(
			service.saveViewProperties(
				BaseEntityEnum.OrganizationProject,
				'p1',
				{} as any
			)
		).resolves.toEqual({ id: 's1', data: { kept: true } });
		expect(calls.map((c) => c.method)).toEqual(['GET']);
	});
});
