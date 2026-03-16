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
 * From external API, transform template to group
 */
export function stateGroup(state: ITaskStatus) {
	const templateOrValue = state?.template || state?.value;

	if (!templateOrValue) return undefined;

	const groupMapping: { [key: string]: string } = {
		[TaskStatusEnum.BACKLOG]: TaskStatusEnum.BACKLOG,
		'to-do': 'unstarted',
		[TaskStatusEnum.OPEN]: 'unstarted',
		[TaskStatusEnum.IN_PROGRESS]: 'started',
		[TaskStatusEnum.READY_FOR_REVIEW]: 'started',
		[TaskStatusEnum.IN_REVIEW]: 'started',
		[TaskStatusEnum.BLOCKED]: 'started',
		[TaskStatusEnum.DONE]: TaskStatusEnum.COMPLETED,
		[TaskStatusEnum.COMPLETED]: TaskStatusEnum.COMPLETED
	};

	return groupMapping[templateOrValue] || TaskStatusEnum.CUSTOM;
}

// Transform group to template

export const mapGroupToTemplate = (group: string): TaskStatusEnum => {
	const groupToTemplateMapping: { [key: string]: TaskStatusEnum } = {
		backlog: TaskStatusEnum.BACKLOG,
		unstarted: TaskStatusEnum.OPEN,
		started: TaskStatusEnum.IN_PROGRESS, // Default for 'started' group
		completed: TaskStatusEnum.COMPLETED,
		custom: TaskStatusEnum.CUSTOM
	};

	return groupToTemplateMapping[group] || TaskStatusEnum.CUSTOM; // if not found, return 'custom'
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
	const template = mapGroupToTemplate(input.group);
	return {
		name: input.name,
		value: input.name.toLocaleLowerCase(),
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
