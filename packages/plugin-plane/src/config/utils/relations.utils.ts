import { ID } from '@ever-gauzy/plugin-integration-plane-models';

/**
 * Groups relation paths by their root relation, e.g.
 * `['members', 'members.employee.user', 'modules']` → `[['members', 'members.employee.user'], ['modules']]`.
 *
 * @param relations - The relation paths, in Gauzy's dotted form.
 * @returns One group per root relation, in first-seen order.
 */
export function groupRelationsByRoot(relations: string[]): string[][] {
	const groups = new Map<string, string[]>();

	for (const relation of relations) {
		const root = relation.split('.')[0];
		groups.set(root, [...(groups.get(root) ?? []), relation]);
	}

	return Array.from(groups.values());
}

/**
 * ever-gauzy fork: loads entities with one request per root relation and merges the results.
 *
 * Gauzy loads `relations` with LEFT JOINs, so asking for several one-to-many relations in one request returns
 * their cartesian product (members × sprints × modules × tasks …). For real projects that is tens of thousands of
 * wide rows, and hydrating them blocked the Gauzy API's event loop for minutes. Each request made here joins a
 * single relation tree, so the rows only add up.
 *
 * @param relations - The relation paths to load.
 * @param fetch - Loads the entities with the given relation paths. Every call must select the same entities.
 * @returns The entities of the first request, each carrying every requested root relation.
 */
export async function fetchWithSplitRelations<T extends { id?: ID }>(
	relations: string[],
	fetch: (relations: string[]) => Promise<T[]>
): Promise<T[]> {
	const groups = groupRelationsByRoot(relations);

	if (groups.length <= 1) {
		return fetch(relations);
	}

	const [primary, ...others] = await Promise.all(
		groups.map((group) => fetch(group))
	);

	const lookups = others.map(
		(entities) =>
			new Map((entities ?? []).map((entity) => [entity.id, entity]))
	);
	const roots = groups.slice(1).map(([relation]) => relation.split('.')[0]);

	return (primary ?? []).map((entity) => {
		const merged: Record<string, unknown> = { ...entity };

		lookups.forEach((lookup, index) => {
			const other = lookup.get(entity.id) as
				| Record<string, unknown>
				| undefined;
			if (other && roots[index] in other) {
				merged[roots[index]] = other[roots[index]];
			}
		});

		return merged as T;
	});
}
