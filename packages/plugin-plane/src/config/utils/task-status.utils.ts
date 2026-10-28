import { ID } from '@ever-gauzy/plugin-integration-plane-models';

/**
 * Status strings Gauzy tasks carry that name no status value as they are.
 */
const STATUS_ALIASES: Record<string, string> = {
	todo: 'open',
	'to-do': 'open',
	closed: 'completed',
	done: 'completed'
};

/**
 * A status string or value in comparable form: lower case, spaces and underscores as hyphens
 * (`In Progress` → `in-progress`).
 *
 * @param value - A task's `status`, or a status's `value` or `name`.
 * @returns The comparable form, or an empty string.
 */
export function canonicalStatusValue(value?: string | null): string {
	return (value ?? '')
		.trim()
		.toLowerCase()
		.replace(/[\s_]+/g, '-');
}

/**
 * {@link canonicalStatusValue} with the aliases above applied (`Todo` → `open`). Only a task's status string is
 * aliased: a project's own statuses are compared as they are, so two of them never merge.
 *
 * @param value - A task's `status`.
 * @returns The comparable form, or an empty string.
 */
export function normalizeStatusValue(value?: string | null): string {
	const canonical = canonicalStatusValue(value);
	return STATUS_ALIASES[canonical] ?? canonical;
}

/**
 * The status a task is shown in.
 *
 * A task created through the Gauzy API may carry only a `status` string and no `taskStatusId`. Plane places
 * a work item by its state id, so such a task fitted no state and disappeared from every state-grouped list.
 * It is placed by the status whose value, or else name, matches its status string.
 *
 * @param task - The task's status id and status string.
 * @param statuses - The statuses of the task's project.
 * @returns The task's status id, the matching status's id, or `undefined` when nothing matches.
 */
export function resolveTaskStatusId(
	task: { taskStatusId?: ID | null; status?: string | null },
	statuses: { id?: ID; value?: string | null; name?: string | null }[]
): ID | undefined {
	if (task.taskStatusId) {
		return task.taskStatusId;
	}
	return findTaskStatusByString(task.status, statuses)?.id;
}

/**
 * The project status a status string names: the status whose value, else name, is the string as it is; failing
 * that, the one it aliases to (see {@link normalizeStatusValue}).
 *
 * @param status - A task's status string.
 * @param statuses - The statuses of the task's project.
 * @returns The matching status, or `undefined`.
 */
export function findTaskStatusByString<
	S extends { value?: string | null; name?: string | null }
>(status: string | null | undefined, statuses: S[]): S | undefined {
	const exact = canonicalStatusValue(status);
	if (!exact) {
		return undefined;
	}
	const matching = (wanted: string) =>
		statuses.find(
			(candidate) => canonicalStatusValue(candidate.value) === wanted
		) ??
		statuses.find(
			(candidate) => canonicalStatusValue(candidate.name) === wanted
		);
	const aliased = normalizeStatusValue(status);
	return (
		matching(exact) ?? (aliased !== exact ? matching(aliased) : undefined)
	);
}
