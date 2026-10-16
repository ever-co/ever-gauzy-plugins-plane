import {
	EmployeeSettingDataOperationEnum,
	IEmployeeSettingDataOperation
} from '@ever-gauzy/plugin-integration-plane-models';

type JsonObject = Record<string, unknown>;

/** Keys that would reach an object's prototype instead of the object itself. */
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/** Whether `key` is the object's own key (not an inherited member such as `toString`). */
const hasOwn = (object: JsonObject, key: string): boolean =>
	Object.prototype.hasOwnProperty.call(object, key);

const isPlainObject = (value: unknown): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * `set` operations writing each given key at `path` (e.g. `['sidebar_preferences', 'views']`), for the keys whose
 * value is not `undefined`.
 *
 * @param path Where the keys live in the setting's data (`[]` for the root).
 * @param values The keys to write.
 */
export function setOperations(
	path: string[],
	values: Record<string, unknown> | undefined | null
): IEmployeeSettingDataOperation[] {
	return Object.entries(values ?? {})
		.filter(([, value]) => value !== undefined)
		.map(([key, value]) => ({
			op: EmployeeSettingDataOperationEnum.SET,
			path: [...path, key],
			value
		}));
}

/**
 * ever-gauzy fork: applies data-patch operations to an employee setting's `data` the way Gauzy's
 * `PATCH /employee-settings/:id/data` does — used only against a Gauzy that does not have that route yet, where the
 * proxy has to write the whole `data` back itself. The input is not modified.
 *
 * - `set` writes `value` at `path`, creating missing objects (or replacing `null`) on the way.
 * - `unset` removes the key at `path`; a path that is not there is a no-op.
 *
 * @param data The stored data (a missing or non-object value starts from `{}`).
 * @param operations The operations, applied in order.
 * @returns The data with every operation applied.
 * @throws Error when a path is empty, uses a prototype key, or runs through a value that is not an object.
 */
export function applyEmployeeSettingDataOperations(
	data: unknown,
	operations: IEmployeeSettingDataOperation[]
): JsonObject {
	const result: JsonObject = isPlainObject(data) ? structuredClone(data) : {};

	for (const { op, path, value } of operations ?? []) {
		if (
			!Array.isArray(path) ||
			path.length === 0 ||
			path.some((key) => FORBIDDEN_KEYS.has(key))
		) {
			throw new Error(
				`Invalid employee setting data path: ${JSON.stringify(path)}`
			);
		}
		const parent = path.slice(0, -1);
		const key = path[path.length - 1];

		if (op === EmployeeSettingDataOperationEnum.SET) {
			const target = parent.reduce<JsonObject>((node, segment) => {
				// Own keys only: an inherited member (`toString`, `valueOf`, …) is not stored data.
				const child = hasOwn(node, segment) ? node[segment] : undefined;
				if (child === undefined || child === null) {
					return (node[segment] = {});
				}
				if (!isPlainObject(child)) {
					throw new Error(
						`Cannot set ${path.join(' > ')}: ${segment} is not an object.`
					);
				}
				return child;
			}, result);
			target[key] = structuredClone(value);
		} else if (op === EmployeeSettingDataOperationEnum.UNSET) {
			let node: unknown = result;
			for (const segment of parent) {
				node =
					isPlainObject(node) && hasOwn(node, segment)
						? node[segment]
						: undefined;
			}
			if (isPlainObject(node)) {
				delete node[key];
			}
		}
	}

	return result;
}
