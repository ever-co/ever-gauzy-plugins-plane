import { ID, IState, ITaskStatus, TaskStatusEnum } from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../../';

function capitalizeWords(word: string) {
	return word
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

const stateGroup = (state: ITaskStatus) => {
	const templateOrValue = state.template || state.value;

	if (!templateOrValue) return undefined;

	const groupMapping: { [key: string]: string } = {
		[TaskStatusEnum.BACKLOG]: TaskStatusEnum.BACKLOG,
		'to do': 'unstarted',
		[TaskStatusEnum.OPEN]: 'unstarted',
		[TaskStatusEnum.IN_PROGRESS]: 'started',
		[TaskStatusEnum.READY_FOR_REVIEW]: 'started',
		[TaskStatusEnum.IN_REVIEW]: 'started',
		[TaskStatusEnum.BLOCKED]: 'started',
		[TaskStatusEnum.DONE]: TaskStatusEnum.COMPLETED,
		[TaskStatusEnum.COMPLETED]: TaskStatusEnum.COMPLETED,
	};

	return groupMapping[templateOrValue];
};

export function getStatesTransformer(statuses: ITaskStatus[]): IState[] {
	return statuses.map((status, i) => {
		const group = stateGroup(status);
		return {
			id: status.id,
			project_id:
				status.projectId ?? '8e8e12b9-d8d9-4305-b673-466f632d6a93',
			workspace_id: status.tenantId,
			name: capitalizeWords(status.name.replace('-', ' ')),
			color: status.color,
			group,
			default: false,
			description: status.description,
			sequence: 25000.0 + i * 10000, // TO DO : Should try to adjust this
		};
	});
}

export const getStatesQuery = (id: ID): Record<string, string> => {
	return { ...baseGetItemsWhereQuery, 'where[projectId]': id };
};
