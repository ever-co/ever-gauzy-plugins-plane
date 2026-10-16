/// <reference types="jest" />
import { EmployeeSettingDataOperationEnum } from '@ever-gauzy/plugin-integration-plane-models';
import {
	applyEmployeeSettingDataOperations,
	setOperations
} from './employee-setting-data.utils';

const { SET, UNSET } = EmployeeSettingDataOperationEnum;

describe('setOperations', () => {
	it('writes each defined key under the path and skips undefined ones', () => {
		expect(
			setOperations(['sidebar_preferences', 'views'], {
				is_pinned: false,
				sort_order: undefined
			})
		).toEqual([
			{
				op: SET,
				path: ['sidebar_preferences', 'views', 'is_pinned'],
				value: false
			}
		]);
	});

	it('writes root keys for an empty path and nothing for no values', () => {
		expect(setOperations([], { filters: { state: [] } })).toEqual([
			{ op: SET, path: ['filters'], value: { state: [] } }
		]);
		expect(setOperations([], undefined)).toEqual([]);
	});
});

describe('applyEmployeeSettingDataOperations (fallback for a Gauzy without the patch route)', () => {
	it('sets nested keys, replaces subtrees and unsets, keeping the rest and the input', () => {
		const data = {
			rich_filters: { and: [{ a: 1 }] },
			sidebar_preferences: { home: { is_pinned: true } }
		};

		const result = applyEmployeeSettingDataOperations(data, [
			{ op: SET, path: ['rich_filters'], value: {} },
			{
				op: SET,
				path: ['sidebar_preferences', 'views', 'is_pinned'],
				value: false
			},
			{ op: UNSET, path: ['sidebar_preferences', 'home'] }
		]);

		expect(result).toEqual({
			rich_filters: {},
			sidebar_preferences: { views: { is_pinned: false } }
		});
		expect(data.sidebar_preferences.home).toEqual({ is_pinned: true });
	});

	it('refuses prototype keys and paths through scalars', () => {
		expect(() =>
			applyEmployeeSettingDataOperations({}, [
				{ op: SET, path: ['__proto__', 'x'], value: 1 }
			])
		).toThrow();
		expect(() =>
			applyEmployeeSettingDataOperations({ a: 1 }, [
				{ op: SET, path: ['a', 'b'], value: 1 }
			])
		).toThrow();
	});
});
