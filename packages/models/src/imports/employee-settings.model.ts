import { IBasePerEntityType, IBasePerTenantAndOrganizationEntityModel, JsonData } from './base-entity.model';
import { IEmployee, IEmployeeEntityInput } from './employee.model';

export interface IEmployeeSetting
	extends IBasePerTenantAndOrganizationEntityModel,
		Required<IEmployeeEntityInput>,
		Partial<IBasePerEntityType> {
	month?: number;
	year?: number;
	settingType?: EmployeeSettingTypeEnum;
	value?: number;
	currency?: string;
	data?: JsonData;
	defaultData?: JsonData;
}

export interface IEmployeeSettingCreateInput extends IEmployeeSetting {}

export interface IEmployeeSettingUpdateInput extends Omit<IEmployeeSettingCreateInput, 'employee' | 'employeeId'> {}

/**
 * What one operation of an employee-setting data patch does (Gauzy `PATCH /employee-settings/:id/data`).
 */
export enum EmployeeSettingDataOperationEnum {
	/** Writes `value` at `path`, creating the missing objects on the way. */
	SET = 'set',
	/** Removes the key at `path`; a path that is not there is left alone. */
	UNSET = 'unset'
}

/**
 * One change to the `data` of an employee setting: `path` lists the object keys from the root of `data`.
 */
export interface IEmployeeSettingDataOperation {
	op: EmployeeSettingDataOperationEnum;
	path: string[];
	/** The value `set` writes; ignored by `unset`. */
	value?: unknown;
}

export interface IEmployeeSettingFindInput {
	employeeId?: string;
	employee?: IEmployee;
	month?: number;
	year?: number;
	currency?: string;
}

export enum EmployeeSettingTypeEnum {
	NORMAL = 'Normal',
	TASK_VIEWS = 'Task-View',
	CUSTOM = 'Custom'
}
