import {
	EstimateSystemEnum,
	ID,
	IEstimate,
	IEstimatePoint,
	ITask,
	ITaskSize
} from '@ever-gauzy/plugin-integration-plane-models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

/**
 * ever-gauzy fork: Plane "estimates" are Ever Gauzy task sizes.
 *
 * Gauzy gives every project its own task sizes (Tiny … X-Large, editable per project, falling back to the global
 * defaults) and a task points at one through `taskSizeId` (with the size's value in `size`). In the Plane UI a project
 * therefore has exactly one estimate system, always active: its task sizes. The estimate's id is the project's id
 * (there is no separate Gauzy row) and each estimate point is one task size.
 */
export const TASK_SIZE_ESTIMATE_NAME = 'Task sizes';

/**
 * Order of Gauzy's default sizes, smallest first (Plane lists estimate points in ascending order).
 */
const DEFAULT_SIZE_ORDER = ['tiny', 'small', 'medium', 'large', 'x-large'];

const isNumeric = (value?: string): boolean =>
	value !== undefined && value.trim() !== '' && !Number.isNaN(Number(value));

/**
 * Sorts task sizes the way Plane lists estimate points: numeric sizes by value, Gauzy's default sizes smallest first,
 * then any other size by creation date.
 *
 * @param sizes - The project's task sizes.
 * @returns A new, sorted array.
 */
export function sortTaskSizes(sizes: ITaskSize[]): ITaskSize[] {
	const rank = (size: ITaskSize) => {
		const index = DEFAULT_SIZE_ORDER.indexOf(
			(size.value ?? size.name ?? '').toLowerCase()
		);
		return index === -1 ? DEFAULT_SIZE_ORDER.length : index;
	};

	return [...(sizes ?? [])].sort((a, b) => {
		if (isNumeric(a.name) && isNumeric(b.name)) {
			return Number(a.name) - Number(b.name);
		}
		return (
			rank(a) - rank(b) ||
			new Date(a.createdAt ?? 0).getTime() -
				new Date(b.createdAt ?? 0).getTime() ||
			(a.name ?? '').localeCompare(b.name ?? '')
		);
	});
}

/**
 * Plane estimate type for a set of sizes: "points" when every size is a number (e.g. a Fibonacci set), otherwise
 * "categories" (e.g. Gauzy's default T-shirt sizes).
 *
 * @param sizes - The project's task sizes.
 */
export function estimateTypeOfSizes(sizes: ITaskSize[]): EstimateSystemEnum {
	return (sizes ?? []).length > 0 &&
		(sizes ?? []).every((size) => isNumeric(size.name))
		? EstimateSystemEnum.POINTS
		: EstimateSystemEnum.CATEGORIES;
}

/**
 * Transforms a project's task sizes into its (single, active) Plane estimate.
 *
 * @param projectId - The project.
 * @param sizes - The project's task sizes, as Gauzy returns them (project sizes, or the defaults when it has none).
 * @param workspaceId - The workspace (Gauzy organization) id.
 * @returns The Plane estimate.
 */
export function estimateTransformer(
	projectId: ID,
	sizes: ITaskSize[],
	workspaceId?: ID
): IEstimate {
	const sorted = sortTaskSizes(sizes);
	const latest = sorted.reduce<Date | undefined>((acc, size) => {
		const updatedAt = size.updatedAt ? new Date(size.updatedAt) : undefined;
		return updatedAt && (!acc || updatedAt > acc) ? updatedAt : acc;
	}, undefined);

	return {
		id: projectId,
		name: TASK_SIZE_ESTIMATE_NAME,
		description: 'The Ever Gauzy task sizes of this project',
		type: estimateTypeOfSizes(sorted),
		points: sorted.map((size, index) =>
			estimatePointTransformer(size, index, projectId, workspaceId)
		),
		workspace: workspaceId,
		project: projectId,
		last_used: true,
		created_at: sorted[0]?.createdAt,
		updated_at: latest,
		created_by: undefined,
		updated_by: undefined
	};
}

/**
 * Transforms one task size into a Plane estimate point.
 *
 * @param size - The task size.
 * @param index - Its position in the sorted sizes (Plane's `key` is 1-based).
 * @param projectId - The project (also the estimate id).
 * @param workspaceId - The workspace (Gauzy organization) id.
 */
export function estimatePointTransformer(
	size: ITaskSize,
	index: number,
	projectId: ID,
	workspaceId?: ID
): IEstimatePoint {
	return {
		id: size.id,
		key: index + 1,
		value: size.name,
		description: size.description,
		workspace: workspaceId,
		project: projectId,
		estimate: projectId,
		created_at: size.createdAt,
		updated_at: size.updatedAt,
		created_by: undefined,
		updated_by: undefined
	};
}

/**
 * The estimate point (task size id) of a task. Tasks created by older Gauzy clients only carry the size's value in
 * `size`, so that is matched against the project's sizes by value or name, ignoring case.
 *
 * @param task - The task.
 * @param sizes - The task's project sizes, when known.
 * @returns The task size id, or `undefined` when the task has no size.
 */
export function resolveEstimatePointId(
	task: Pick<ITask, 'taskSizeId' | 'size'>,
	sizes?: ITaskSize[]
): ID | undefined {
	if (task?.taskSizeId) {
		return task.taskSizeId;
	}
	const size = task?.size?.toString().toLowerCase();
	if (!size) {
		return undefined;
	}
	return (sizes ?? []).find(
		(candidate) =>
			candidate.value?.toLowerCase() === size ||
			candidate.name?.toLowerCase() === size
	)?.id;
}

/**
 * Gauzy's `value` for a size named in the Plane UI: lower case, words joined by dashes ("X Large" → "x-large").
 *
 * @param name - The estimate point value typed in Plane.
 */
export function taskSizeValueOf(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Query for a project's task sizes (`GET /task-sizes`). Gauzy answers with the project's own sizes, or the global
 * defaults when the project has none.
 *
 * @param projectId - The project.
 */
export function getTaskSizesQuery(projectId: ID): Record<string, string> {
	const where = baseGetItemsWhereQuery();
	return {
		tenantId: where['where[tenantId]'],
		organizationId: where['where[organizationId]'],
		projectId
	};
}
