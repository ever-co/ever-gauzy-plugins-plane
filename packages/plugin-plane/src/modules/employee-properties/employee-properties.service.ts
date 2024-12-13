import { BadRequestException, Injectable } from '@nestjs/common';
import {
	EmployeeSettingTypeEnum,
	IEmployeeSetting,
	IEmployeeSettingCreateInput,
	IEmployeeSettingUpdateInput
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { defaultOrganizationId } from '../../config';

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
		input: IEmployeeSettingUpdateInput
	): Promise<IEmployeeSetting> {
		try {
			const employeeSetting: IEmployeeSetting = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body: { ...input, organizationId: defaultOrganizationId() }
				})
			).data;

			return employeeSetting;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}
}
