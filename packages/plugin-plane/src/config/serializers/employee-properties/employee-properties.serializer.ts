import { IFindUserPropertiesInput } from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

export const getEmployeeSettingQuery = (
	options: IFindUserPropertiesInput
): Record<string, any> => {
	const { employeeId, entity, entityId, settingType } = options;

	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	query['where[employeeId]'] = employeeId;

	if (entity) {
		query['where[entity]'] = entity;
	}

	if (entityId) {
		query['where[entityId]'] = entityId;
	}

	if (settingType) {
		query['where[settingType]'] = settingType;
	}

	query['relations[0]'] = 'employee';

	return query;
};
