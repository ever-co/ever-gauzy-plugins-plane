import {
	BaseEntityEnum,
	IEmployeeSetting,
	IFindUserPropertiesInput,
	IUserViewProperties
} from '@ever-gauzy/plugin-integration-plane-models';
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
	const { filters, display_filters, display_properties, rich_filters } =
		(employeeSetting?.data as Record<string, any>) || {};

	return {
		id: employeeSetting?.id!,
		created_at: employeeSetting?.createdAt,
		updated_at: employeeSetting?.updatedAt,
		deleted_at: employeeSetting?.deletedAt,
		filters,
		display_filters,
		display_properties,
		rich_filters,
		created_by: employeeSetting?.employeeId,
		updated_by: employeeSetting?.employeeId,
		project:
			employeeSetting?.entity === BaseEntityEnum.OrganizationProject
				? employeeSetting?.entityId
				: undefined,
		module:
			employeeSetting?.entity === BaseEntityEnum.OrganizationProjectModule
				? employeeSetting?.entityId
				: undefined,
		cycle:
			employeeSetting?.entity === BaseEntityEnum.OrganizationSprint
				? employeeSetting?.entityId
				: undefined,
		workspace: employeeSetting?.organizationId,
		user: employeeSetting?.employeeId
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

	query['relations[0]'] = 'employee.user.role';
	query['relations[1]'] = 'organization';

	return query;
};
