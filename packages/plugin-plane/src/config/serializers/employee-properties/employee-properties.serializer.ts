import {
	BaseEntityEnum,
	IEmployeeSetting,
	IFindUserPropertiesInput,
	IUserViewProperties
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

/**
 * Serializes an EmployeeSetting object into a user view-friendly format.
 *
 * @param {IEmployeeSetting} employeeSetting - The EmployeeSetting object to serialize.
 * @returns {IUserViewProperties} A serialized object containing user-view properties.
 */
export function employeeSettingSerializer(
	employeeSetting: IEmployeeSetting
): IUserViewProperties {
	const { filters, display_filters, display_properties } =
		employeeSetting.data as Record<string, any>;

	return {
		id: employeeSetting.id,
		created_at: employeeSetting.createdAt,
		updated_at: employeeSetting.updatedAt,
		deleted_at: employeeSetting.deletedAt,
		filters,
		display_filters,
		display_properties,
		created_by: employeeSetting.employeeId,
		updated_by: employeeSetting.employeeId,
		project:
			employeeSetting.entity === BaseEntityEnum.OrganizationProject
				? employeeSetting.entityId
				: null,
		module:
			employeeSetting.entity === BaseEntityEnum.OrganizationProjectModule
				? employeeSetting.entityId
				: null,
		cycle:
			employeeSetting.entity === BaseEntityEnum.OrganizationSprint
				? employeeSetting.entityId
				: null,
		workspace: employeeSetting.tenantId,
		user: employeeSetting.employeeId
	};
}

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
