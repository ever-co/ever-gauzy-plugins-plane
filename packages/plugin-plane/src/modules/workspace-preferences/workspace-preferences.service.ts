import { BadRequestException, Injectable } from '@nestjs/common';
import {
	BaseEntityEnum,
	EmployeeSettingTypeEnum,
	ID,
	IEmployeeSetting,
	IEmployeeSettingDataOperation
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	currentEmployeeId,
	currentTenantId,
	DEFAULT_HOME_PREFERENCES,
	DEFAULT_SIDBAR_PREFERENCES,
	DEFAULT_WORKSPACE_NAVIGATION,
	employeeSettingSerializer,
	getCurrentOrganizationSlug,
	MEMBER_DEFAULT_VIEW_PROPS,
	setOperations
} from '../../config';
import { EmployeePropertiesService } from '../employee-properties/employee-properties.service';

type SidebarItem = { is_pinned?: boolean; sort_order?: number };
type HomeWidget = {
	key: string;
	is_enabled?: boolean;
	sort_order?: number;
	config?: Record<string, unknown>;
};

/**
 * What an employee's workspace preferences record holds (`EmployeeSetting.data`).
 */
interface IWorkspacePreferencesData {
	filters?: unknown;
	rich_filters?: unknown;
	display_filters?: unknown;
	display_properties?: unknown;
	navigation_project_limit?: number;
	navigation_control_preference?: string;
	sidebar_preferences?: Record<string, SidebarItem>;
	home_preferences?: Record<string, Omit<HomeWidget, 'key'>>;
}

/**
 * ever-gauzy fork: an employee's preferences for a whole workspace (Gauzy organization) — the workspace views'
 * filters and display settings (`/user-properties`), the sidebar project navigation, the sidebar items
 * (`/sidebar-preferences`) and the home page widgets (`/home-preferences`).
 *
 * They are stored in ONE Gauzy employee setting per employee and organization (entity `Organization`, entity id = the
 * organization). One record, not one per kind: Gauzy de-duplicates employee settings by employee + entity + entity
 * id (not by setting type), so a second record for the same organization would overwrite the first.
 */
@Injectable()
export class WorkspacePreferencesService {
	/**
	 * Get-or-create calls in flight, so the UI's parallel first requests create one record, not several.
	 */
	private static readonly inFlight = new Map<
		string,
		Promise<IEmployeeSetting>
	>();

	/**
	 * The last queued write per employee (see `save`).
	 */
	private static readonly writes = new Map<
		string,
		Promise<IEmployeeSetting>
	>();

	constructor(
		private readonly _employeePropertiesService: EmployeePropertiesService
	) {}

	/**
	 * GET /user-properties — the workspace views' filters/display settings and the sidebar project navigation.
	 */
	async getUserProperties() {
		return this.userPropertiesResponse(await this.getOrCreate());
	}

	/**
	 * PATCH /user-properties — updates the fields that are sent, keeps the others.
	 */
	async updateUserProperties(input: Partial<IWorkspacePreferencesData>) {
		const keys: (keyof IWorkspacePreferencesData)[] = [
			'filters',
			'rich_filters',
			'display_filters',
			'display_properties',
			'navigation_project_limit',
			'navigation_control_preference'
		];
		const changes = Object.fromEntries(
			keys
				.filter((key) => input?.[key] !== undefined)
				.map((key) => [key, input[key]])
		);
		return this.userPropertiesResponse(
			await this.save(setOperations([], changes))
		);
	}

	/**
	 * GET /sidebar-preferences — Plane's defaults overlaid with the employee's changes.
	 */
	async getSidebarPreferences(): Promise<Record<string, SidebarItem>> {
		const data = this.dataOf(await this.getOrCreate());
		return this.mergeSidebar(data.sidebar_preferences);
	}

	/**
	 * PATCH /sidebar-preferences/:key — one sidebar item.
	 */
	async updateSidebarPreference(key: string, input: SidebarItem) {
		const saved = this.dataOf(
			await this.save(
				setOperations(
					['sidebar_preferences', key],
					this.pickSidebar(input)
				)
			)
		);
		return { key, ...this.mergeSidebar(saved.sidebar_preferences)[key] };
	}

	/**
	 * PATCH /sidebar-preferences — several sidebar items at once (`[{ key, is_pinned, sort_order }]`).
	 */
	async updateSidebarPreferences(
		input: Array<SidebarItem & { key: string }>
	): Promise<Record<string, SidebarItem>> {
		if (!Array.isArray(input)) {
			throw new BadRequestException(
				'Expected a list of { key, is_pinned, sort_order }.'
			);
		}
		const saved = this.dataOf(
			await this.save(
				input
					.filter((item) => !!item?.key)
					.flatMap((item) =>
						setOperations(
							['sidebar_preferences', item.key],
							this.pickSidebar(item)
						)
					)
			)
		);
		return this.mergeSidebar(saved.sidebar_preferences);
	}

	/**
	 * GET /home-preferences — the home page widgets, defaults overlaid with the employee's changes.
	 */
	async getHomePreferences(): Promise<HomeWidget[]> {
		const data = this.dataOf(await this.getOrCreate());
		return this.mergeHome(data.home_preferences);
	}

	/**
	 * PATCH /home-preferences/:key — one home page widget.
	 */
	async updateHomePreference(
		key: string,
		input: Partial<HomeWidget>
	): Promise<HomeWidget> {
		const { is_enabled, sort_order, config } = input ?? {};
		const saved = this.dataOf(
			await this.save(
				setOperations(['home_preferences', key], {
					is_enabled,
					sort_order,
					config
				})
			)
		);
		return (
			this.mergeHome(saved.home_preferences).find(
				(item) => item.key === key
			) ?? { key, ...saved.home_preferences?.[key] }
		);
	}

	private userPropertiesResponse(setting: IEmployeeSetting) {
		const data = this.dataOf(setting);
		return {
			...employeeSettingSerializer(setting),
			workspace: getCurrentOrganizationSlug(),
			navigation_project_limit:
				data.navigation_project_limit ??
				DEFAULT_WORKSPACE_NAVIGATION.navigation_project_limit,
			navigation_control_preference:
				data.navigation_control_preference ??
				DEFAULT_WORKSPACE_NAVIGATION.navigation_control_preference
		};
	}

	private mergeSidebar(
		stored?: Record<string, SidebarItem>
	): Record<string, SidebarItem> {
		const merged: Record<string, SidebarItem> = {
			...DEFAULT_SIDBAR_PREFERENCES
		};
		Object.entries(stored ?? {}).forEach(([key, value]) => {
			merged[key] = { ...(merged[key] ?? {}), ...value };
		});
		return merged;
	}

	private mergeHome(
		stored?: Record<string, Omit<HomeWidget, 'key'>>
	): HomeWidget[] {
		const merged: HomeWidget[] = DEFAULT_HOME_PREFERENCES.map((widget) => ({
			...widget,
			...(stored?.[widget.key] ?? {})
		}));
		Object.entries(stored ?? {})
			.filter(([key]) => !merged.some((widget) => widget.key === key))
			.forEach(([key, value]) =>
				merged.push({ key, config: {}, ...value } as HomeWidget)
			);
		return merged.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
	}

	private pickSidebar(input: SidebarItem): SidebarItem {
		return {
			...(input?.is_pinned !== undefined
				? { is_pinned: input.is_pinned }
				: {}),
			...(input?.sort_order !== undefined
				? { sort_order: input.sort_order }
				: {})
		};
	}

	private dataOf(setting?: IEmployeeSetting): IWorkspacePreferencesData {
		return (setting?.data as IWorkspacePreferencesData) ?? {};
	}

	private key(): string {
		return `${currentTenantId()}:${getCurrentOrganizationSlug()}:${currentEmployeeId()}`;
	}

	/**
	 * The employee's workspace preferences record, created with the defaults when missing.
	 */
	private getOrCreate(): Promise<IEmployeeSetting> {
		const key = this.key();
		const pending = WorkspacePreferencesService.inFlight.get(key);
		if (pending) {
			return pending;
		}

		const request = (async () => {
			const existing = await this.find();
			if (existing) {
				return existing;
			}
			const employeeId = currentEmployeeId();
			if (!employeeId) {
				throw new BadRequestException(
					'Workspace preferences need an employee.'
				);
			}
			return this._employeePropertiesService.create({
				entity: BaseEntityEnum.Organization,
				entityId: getCurrentOrganizationSlug(),
				settingType: EmployeeSettingTypeEnum.TASK_VIEWS,
				data: {
					...MEMBER_DEFAULT_VIEW_PROPS,
					...DEFAULT_WORKSPACE_NAVIGATION
				},
				defaultData: {
					...MEMBER_DEFAULT_VIEW_PROPS,
					...DEFAULT_WORKSPACE_NAVIGATION
				},
				employee: { id: employeeId },
				employeeId
			});
		})();

		WorkspacePreferencesService.inFlight.set(key, request);
		return request.finally(() =>
			WorkspacePreferencesService.inFlight.delete(key)
		);
	}

	private find(): Promise<IEmployeeSetting | undefined> {
		return this._employeePropertiesService.findOneByOptions({
			employeeId: currentEmployeeId()!,
			entity: BaseEntityEnum.Organization,
			entityId: getCurrentOrganizationSlug() as ID,
			settingType: EmployeeSettingTypeEnum.TASK_VIEWS
		});
	}

	/**
	 * Saves key-level changes to the record's data.
	 *
	 * The changes go to Gauzy as one atomic patch (`EmployeePropertiesService.patchData`), so parallel PATCHes (a
	 * sidebar pin and a widget toggle, two sidebar items, …) all keep their change even when they reach different API
	 * processes. The per-employee queue still orders this process's writes, and covers a Gauzy without the patch
	 * route, where the proxy writes the whole data back itself.
	 */
	private save(
		operations: IEmployeeSettingDataOperation[]
	): Promise<IEmployeeSetting> {
		const key = this.key();
		const previous =
			WorkspacePreferencesService.writes.get(key) ?? Promise.resolve();

		const write = previous
			.catch(() => undefined)
			.then(async () => {
				const setting =
					(await this.find()) ?? (await this.getOrCreate());
				return operations.length > 0
					? this._employeePropertiesService.patchData(
							setting.id!,
							operations
						)
					: setting;
			});

		WorkspacePreferencesService.writes.set(key, write);
		return write.finally(() => {
			if (WorkspacePreferencesService.writes.get(key) === write) {
				WorkspacePreferencesService.writes.delete(key);
			}
		});
	}
}
