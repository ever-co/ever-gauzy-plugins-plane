import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	EmployeeSettingTypeEnum,
	ID,
	IEmployeeSetting,
	IEmployeeSettingCreateInput,
	IEmployeeSettingUpdateInput,
	IFindUserPropertiesInput,
	IPagination
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { defaultOrganizationId } from '../../config';
import { getEmployeeSettingQuery } from '../../config';

@Injectable()
export class EmployeePropertiesService extends ApiFetchService {
	private path = '/employee-settings';

	/**
	 * Creates a new employee setting.
	 *
	 * @param {IEmployeeSettingCreateInput} input - The input data for creating the employee setting.
	 * @returns {Promise<IEmployeeSetting>} A promise that resolves to the created EmployeeSetting.
	 * @throws {BadRequestException} Throws an error if the creation fails.
	 */
	async create(
		input: IEmployeeSettingCreateInput
	): Promise<IEmployeeSetting> {
		try {
			const employeeSetting: IEmployeeSetting = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body: {
						...input,
						settingType: EmployeeSettingTypeEnum.TASK_VIEWS,
						organizationId: defaultOrganizationId()
					}
				})
			).data;

			return employeeSetting;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Updates an existing employee setting.
	 *
	 * @param {ID} id - The unique identifier of the employee setting to update.
	 * @param {IEmployeeSettingUpdateInput} input - The input data for updating the employee setting.
	 * @returns {Promise<IEmployeeSetting>} A promise that resolves to the updated EmployeeSetting.
	 * @throws {BadRequestException} Throws an error if the update fails.
	 */
	async update(
		id: ID,
		input: IEmployeeSettingUpdateInput
	): Promise<IEmployeeSetting> {
		try {
			const employeeSetting: IEmployeeSetting = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body: { ...input, organizationId: defaultOrganizationId() }
				})
			).data;

			return employeeSetting;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Finds a single employee setting based on the provided options.
	 *
	 * @param {IFindUserPropertiesInput} options - The search criteria for finding the employee setting.
	 * @returns {Promise<IEmployeeSetting>} A promise that resolves to the first matching EmployeeSetting.
	 * @throws {BadRequestException} Throws an error if the operation fails.
	 */
	async findOneByOptions(
		options: IFindUserPropertiesInput
	): Promise<IEmployeeSetting> {
		try {
			const query = qs.stringify(getEmployeeSettingQuery(options));

			const employeeSetting: IPagination<IEmployeeSetting> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			return employeeSetting.items[0];
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}
}
