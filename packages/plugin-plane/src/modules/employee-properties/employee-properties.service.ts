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
