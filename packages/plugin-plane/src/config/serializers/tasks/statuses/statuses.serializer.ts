import {
	ICreateStateInput,
	ID,
	IState,
	ITaskStatus,
	ITaskStatusCreateInput,
	TaskStatusEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	currentTenantId,
	getCurrentOrganizationSlug
} from '../../../credentials';

function capitalizeWords(word: string) {
	return word
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * From external API, transform template to group.
 * Gauzy does not persist the template field — it only stores the workflow flags
 * (isTodo, isInProgress, isDone). We first try an exact match on template/value,
 * then fall back to those flags so the group survives page reloads.
 */
export function stateGroup(state: ITaskStatus) {
	const templateOrValue = state?.template || state?.value;

	const groupMapping: { [key: string]: string } = {
		[TaskStatusEnum.BACKLOG]: 'backlog',
		'to-do': 'unstarted',
		[TaskStatusEnum.OPEN]: 'unstarted',
		[TaskStatusEnum.IN_PROGRESS]: 'started',
		[TaskStatusEnum.READY_FOR_REVIEW]: 'started',
		[TaskStatusEnum.IN_REVIEW]: 'started',
		[TaskStatusEnum.BLOCKED]: 'started',
		[TaskStatusEnum.DONE]: 'completed',
		[TaskStatusEnum.COMPLETED]: 'completed',
		[TaskStatusEnum.CANCELLED]: 'cancelled'
	};

	if (templateOrValue && groupMapping[templateOrValue]) {
		return groupMapping[templateOrValue];
	}

	// Derive group from persisted workflow flags
	if (state?.isInProgress) return 'started';
	if (state?.isDone) return 'completed';
	if (state?.isTodo) return 'unstarted';

	return TaskStatusEnum.CUSTOM;
}

// Transform group to template

export const mapGroupToTemplate = (group: string): TaskStatusEnum => {
	const groupToTemplateMapping: { [key: string]: TaskStatusEnum } = {
		backlog: TaskStatusEnum.BACKLOG,
		unstarted: TaskStatusEnum.OPEN,
		started: TaskStatusEnum.IN_PROGRESS,
		completed: TaskStatusEnum.COMPLETED,
		cancelled: TaskStatusEnum.CANCELLED,
		custom: TaskStatusEnum.CUSTOM
	};

	return groupToTemplateMapping[group] || TaskStatusEnum.CUSTOM;
};

export function getStatesTransformer(statuses: ITaskStatus[]): IState[] {
	return statuses.map((status, i) => {
		const group = stateGroup(status);
		return {
			id: status.id,
			project_id: status.projectId,
			workspace_id: status.organizationId,
			name: capitalizeWords(
				status.name.replace('-', ' ')
			) as TaskStatusEnum,
			color: status.color,
			group,
			default: false,
			description: status.description,
			sequence: 25000.0 + i * 10000 // TO DO : Should try to adjust this
		};
	});
}

export function createStateInputTransformer(
	input: ICreateStateInput
): ITaskStatusCreateInput {
	const template = mapGroupToTemplate(input.group!);
	return {
		name: input.name!,
		value: input.name!.toLocaleLowerCase(),
		description: input.description,
		color: input.color,
		template,
		projectId: input.project_id,
		tenantId: currentTenantId(),
		organizationId: getCurrentOrganizationSlug()
	};
}

export const getStatesQuery = (id?: ID): Record<string, string> => {
	const query = {
		organizationId: getCurrentOrganizationSlug(),
		tenantId: currentTenantId()
	};

	if (id) {
		query['projectId'] = id;
	}

	return query;
};
