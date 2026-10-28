import { BadRequestException, Injectable } from '@nestjs/common';
import { isAxiosError } from 'axios';
import qs from 'qs';
import {
	BaseEntityEnum,
	EmployeeSettingTypeEnum,
	ID,
	IEmployeeSetting,
	IEmployeeSettingCreateInput,
	IEmployeeSettingDataOperation,
	IEmployeeSettingUpdateInput,
	IFindUserPropertiesInput,
	IPagination,
	IUpdateUserPropertiesInput
} from '@ever-gauzy/plugin-integration-plane-models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	applyEmployeeSettingDataOperations,
	currentEmployeeId,
	getCurrentOrganizationSlug,
	getEmployeeSettingQuery,
	MEMBER_DEFAULT_VIEW_PROPS,
	setOperations
} from '../../config';

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
		input: IEmployeeSettingCreateInput,
		token?: string,
		tenantId?: ID,
		organizationId?: ID
	): Promise<IEmployeeSetting> {
		try {
			const employeeSetting: IEmployeeSetting = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body: {
						...input,
						settingType: EmployeeSettingTypeEnum.TASK_VIEWS,
						organizationId:
							organizationId || getCurrentOrganizationSlug()
					},
					bearer_token: token,
					tenantId
				})
			).data;

			// ever-gauzy fork: Gauzy's create response can come back without `data`, and a member's first visit to
			// a project then got view properties without a layout, so Plane drew no work items. What was sent
			// is what was stored.
			return {
				...employeeSetting,
				data: employeeSetting?.data ?? input.data,
				defaultData: employeeSetting?.defaultData ?? input.defaultData
			};
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
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
					body: {
						...input,
						organizationId: getCurrentOrganizationSlug()
					}
				})
			).data;

			return employeeSetting;
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
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
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}
	/**
	 * ever-gauzy fork: changes keys of a setting's `data` atomically (Gauzy `PATCH /employee-settings/:id/data`), so
	 * parallel saves of different keys all survive whichever API process they reach. Against a Gauzy without that
	 * route, the operations are applied to a fresh copy and written back with PUT, as before (the last write wins
	 * between processes).
	 *
	 * @param {ID} id - The setting to change.
	 * @param {IEmployeeSettingDataOperation[]} operations - The changes, applied in order.
	 * @returns {Promise<IEmployeeSetting>} The setting with the changed data.
	 */
	async patchData(
		id: ID,
		operations: IEmployeeSettingDataOperation[]
	): Promise<IEmployeeSetting> {
		try {
			return (
				await this.apiFetch({
					method: 'PATCH',
					path: `${this.path}/${id}/data`,
					body: {
						operations,
						organizationId: getCurrentOrganizationSlug()
					}
				})
			).data;
		} catch (error: any) {
			if (!isMissingRoute(error)) {
				this.logger.error(
					`Operation failed: ${error?.response?.data?.message || error.message}`,
					error.stack
				);
				this.handleApiError(error);
			}
		}

		try {
			const current: IEmployeeSetting = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/${id}`
				})
			).data;
			return await this.update(id, {
				entity: current.entity,
				entityId: current.entityId,
				settingType: current.settingType,
				data: applyEmployeeSettingDataOperations(
					current.data,
					operations
				)
			});
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}

	/**
	 * ever-gauzy fork: saves the view properties a Plane PATCH sends for a project, cycle or module (filters, rich
	 * filters, display filters, display properties). Each sent section replaces the stored one, the others are kept,
	 * and the change is one atomic patch. When the employee has no setting for the entity yet it is created with the
	 * defaults first, so the first save is no longer dropped.
	 *
	 * @param {BaseEntityEnum} entity - The kind of entity the properties belong to.
	 * @param {ID} entityId - The entity.
	 * @param {IUpdateUserPropertiesInput} input - The sections to save.
	 * @returns {Promise<IEmployeeSetting>} The saved setting.
	 */
	async saveViewProperties(
		entity: BaseEntityEnum,
		entityId: ID,
		input: IUpdateUserPropertiesInput
	): Promise<IEmployeeSetting> {
		const employeeId = currentEmployeeId()!;
		const setting =
			(await this.findOneByOptions({
				employeeId,
				entity,
				entityId,
				settingType: EmployeeSettingTypeEnum.TASK_VIEWS
			})) ??
			(await this.create({
				entity,
				entityId,
				settingType: EmployeeSettingTypeEnum.TASK_VIEWS,
				data: MEMBER_DEFAULT_VIEW_PROPS,
				defaultData: MEMBER_DEFAULT_VIEW_PROPS,
				employee: { id: employeeId },
				employeeId
			}));

		const { filters, rich_filters, display_filters, display_properties } =
			input ?? {};
		const operations = setOperations([], {
			filters: filters ?? undefined,
			rich_filters: rich_filters ?? undefined,
			display_filters: display_filters ?? undefined,
			display_properties: display_properties ?? undefined
		});

		return operations.length > 0
			? this.patchData(setting.id!, operations)
			: setting;
	}
}

/**
 * Whether the upstream answered that it has no such route (a Gauzy before `PATCH /employee-settings/:id/data`):
 * Nest's own 404, "Cannot PATCH …", not a 404 about the setting.
 */
function isMissingRoute(error: unknown): boolean {
	if (!isAxiosError(error) || error.response?.status !== 404) {
		return false;
	}
	const message = (error.response.data as { message?: unknown })?.message;
	return typeof message === 'string' && /^Cannot PATCH /.test(message);
}
