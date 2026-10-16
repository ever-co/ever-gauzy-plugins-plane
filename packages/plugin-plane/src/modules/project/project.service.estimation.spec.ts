/// <reference types="jest" />
// `uuid` is ESM-only and this package's Jest config does not transform node_modules; nothing here needs real ids.
jest.mock('uuid', () => ({
	v4: () => '00000000-0000-4000-8000-000000000000',
	validate: () => true
}));
import 'reflect-metadata';
import { getProjectsResponse } from '../../config';
import { ProjectService } from './project.service';

type Call = { method: string; path: string; body?: any };

/**
 * Plane's per-project "Estimates" switch is `PATCH project { estimate: <id> | null }`; it maps onto Gauzy's
 * `isTaskSizeEstimationEnabled` project setting.
 */
describe('project estimates switch', () => {
	const stored = {
		id: 'p1',
		name: 'P',
		organizationId: 'o1',
		members: [] as any[]
	};

	function serviceWith(settingsAnswer: (body: any) => any) {
		const calls: Call[] = [];
		const service = Object.create(
			ProjectService.prototype
		) as ProjectService;
		Object.defineProperty(service, 'logger', {
			value: { error: () => undefined, warn: () => undefined }
		});
		Object.assign(service, {
			path: '/organization-projects',
			apiFetch: async (call: Call) => {
				calls.push(call);
				if (call.path === '/organization-projects/setting/p1') {
					return { data: settingsAnswer(call.body) };
				}
				if (call.method === 'PUT') {
					return { data: { ...stored, ...call.body } };
				}
				return { data: stored };
			}
		});
		return { service, calls };
	}

	it('reads a missing setting (an older Gauzy) as on, and off as no estimate', () => {
		const [missing, on, off] = getProjectsResponse([
			{ ...stored },
			{ ...stored, isTaskSizeEstimationEnabled: true },
			{ ...stored, isTaskSizeEstimationEnabled: false }
		] as any);

		expect(missing.estimate).toBe('p1');
		expect(on.estimate).toBe('p1');
		expect(off.estimate).toBeNull();
	});

	it('turning estimates off writes only the setting, never the whole project', async () => {
		const { service, calls } = serviceWith((body) => ({
			...stored,
			...body
		}));

		const project = await service.update('p1', { estimate: null } as any);

		expect(
			calls.filter((c) => c.method === 'PUT').map((c) => c.path)
		).toEqual(['/organization-projects/setting/p1']);
		expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({
			isTaskSizeEstimationEnabled: false
		});
		expect(project.estimate).toBeNull();
	});

	it('turning estimates on stores true', async () => {
		const { service, calls } = serviceWith((body) => ({
			...stored,
			...body
		}));

		const project = await service.update('p1', { estimate: 'p1' } as any);

		expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({
			isTaskSizeEstimationEnabled: true
		});
		expect(project.estimate).toBe('p1');
	});

	it('a PATCH with other fields updates the project without writing back a stale switch', async () => {
		const { service, calls } = serviceWith((body) => ({
			...stored,
			...body
		}));

		await service.update('p1', { name: 'Renamed', estimate: null } as any);

		const puts = calls.filter((c) => c.method === 'PUT');
		expect(puts.map((c) => c.path)).toEqual([
			'/organization-projects/p1',
			'/organization-projects/setting/p1'
		]);
		expect(puts[0].body.isTaskSizeEstimationEnabled).toBeUndefined();
		expect(puts[0].body.name).toBe('Renamed');
	});

	it('an older Gauzy that ignores the setting keeps the estimate on', async () => {
		const { service } = serviceWith(() => ({ ...stored }));

		const project = await service.update('p1', { estimate: null } as any);

		expect(project.estimate).toBe('p1');
	});
});
