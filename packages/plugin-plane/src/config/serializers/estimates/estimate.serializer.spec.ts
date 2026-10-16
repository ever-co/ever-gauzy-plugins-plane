/// <reference types="jest" />
import {
	EstimateSystemEnum,
	ITaskSize
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	estimateTransformer,
	estimateTypeOfSizes,
	getTaskSizesQuery,
	resolveEstimatePointId,
	sortTaskSizes,
	taskSizeValueOf
} from './estimate.serializer';

const size = (
	id: string,
	name: string,
	value = name.toLowerCase(),
	extra: Partial<ITaskSize> = {}
): ITaskSize => ({ id, name, value, ...extra }) as ITaskSize;

describe('estimate serializer (Plane estimates = Gauzy task sizes)', () => {
	const defaults = [
		size('xl', 'X-Large', 'x-large'),
		size('m', 'Medium'),
		size('t', 'Tiny'),
		size('l', 'Large'),
		size('s', 'Small')
	];

	it('sorts Gauzy default sizes smallest first', () => {
		expect(sortTaskSizes(defaults).map((s) => s.id)).toEqual([
			't',
			's',
			'm',
			'l',
			'xl'
		]);
	});

	it('sorts numeric sizes by value and others after the defaults by creation date', () => {
		expect(
			sortTaskSizes([
				size('b', '8'),
				size('a', '3'),
				size('c', '13')
			]).map((s) => s.id)
		).toEqual(['a', 'b', 'c']);
		const custom = [
			size('late', 'Huge', 'huge', { createdAt: new Date('2026-02-01') }),
			size('early', 'Epic', 'epic', {
				createdAt: new Date('2026-01-01')
			}),
			size('t', 'Tiny')
		];
		expect(sortTaskSizes(custom).map((s) => s.id)).toEqual([
			't',
			'early',
			'late'
		]);
	});

	it('reports numeric size sets as points and named ones as categories', () => {
		expect(estimateTypeOfSizes([size('a', '1'), size('b', '2')])).toBe(
			EstimateSystemEnum.POINTS
		);
		expect(estimateTypeOfSizes(defaults)).toBe(
			EstimateSystemEnum.CATEGORIES
		);
		expect(estimateTypeOfSizes([])).toBe(EstimateSystemEnum.CATEGORIES);
	});

	it('builds one active estimate per project whose id is the project id', () => {
		const estimate = estimateTransformer('p1', defaults, 'org1');
		expect(estimate).toMatchObject({
			id: 'p1',
			project: 'p1',
			workspace: 'org1',
			last_used: true,
			type: EstimateSystemEnum.CATEGORIES
		});
		expect(
			estimate.points!.map((p) => [p.id, p.key, p.value, p.estimate])
		).toEqual([
			['t', 1, 'Tiny', 'p1'],
			['s', 2, 'Small', 'p1'],
			['m', 3, 'Medium', 'p1'],
			['l', 4, 'Large', 'p1'],
			['xl', 5, 'X-Large', 'p1']
		]);
	});

	it('takes the estimate point from taskSizeId, else matches the size value or name ignoring case', () => {
		expect(
			resolveEstimatePointId(
				{ taskSizeId: 'fk', size: 'medium' as any },
				defaults
			)
		).toBe('fk');
		expect(
			resolveEstimatePointId({ size: 'MEDIUM' as any }, defaults)
		).toBe('m');
		expect(
			resolveEstimatePointId({ size: 'x-large' as any }, defaults)
		).toBe('xl');
		expect(
			resolveEstimatePointId({ size: 'gigantic' as any }, defaults)
		).toBeUndefined();
		expect(resolveEstimatePointId({}, defaults)).toBeUndefined();
	});

	it('derives the Gauzy size value from a Plane point value', () => {
		expect(taskSizeValueOf('X Large')).toBe('x-large');
		expect(taskSizeValueOf('  XS ')).toBe('xs');
	});

	it('queries the sizes of one project', () => {
		expect(getTaskSizesQuery('p1')).toEqual(
			expect.objectContaining({ projectId: 'p1' })
		);
	});
});
