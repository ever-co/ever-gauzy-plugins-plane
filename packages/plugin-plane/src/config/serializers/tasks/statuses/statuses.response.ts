import { ID, IState, ITaskStatus } from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../../';

function capitalizeWords(word: string) {
	return word
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export function getStatesTransformer(statuses: ITaskStatus[]): IState[] {
	return statuses.map((status, i) => ({
		id: status.id,
		project_id: status.projectId,
		workspace_id: status.tenantId,
		name: capitalizeWords(status.name.replace('-', ' ')),
		color: status.color,
		group: '',
		default: false,
		description: status.description,
		sequence: 25000.0 + i * 10000, // TO DO : Should try to adjust this
	}));
}

export const getStatesQuery = (id: ID): Record<string, string> => {
	return { ...baseGetItemsWhereQuery, 'where[projectId]': id };
};
