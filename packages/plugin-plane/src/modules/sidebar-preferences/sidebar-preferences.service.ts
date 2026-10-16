import { Injectable } from '@nestjs/common';
import { WorkspacePreferencesService } from '../workspace-preferences/workspace-preferences.service';

/**
 * ever-gauzy fork: the sidebar items are stored with the employee's workspace preferences in Gauzy (they used to be
 * fixed defaults, and changing them answered 404).
 */
@Injectable()
export class SidebarPreferencesService {
	constructor(
		private readonly _workspacePreferencesService: WorkspacePreferencesService
	) {}

	/**
	 * Get the sidebar preferences: Plane's defaults overlaid with the employee's changes
	 * @returns The sidebar preferences, by item key
	 */
	async getSidebarPreferences() {
		return this._workspacePreferencesService.getSidebarPreferences();
	}

	/**
	 * Update one sidebar item
	 */
	async updateSidebarPreference(
		key: string,
		input: { is_pinned?: boolean; sort_order?: number }
	) {
		return this._workspacePreferencesService.updateSidebarPreference(
			key,
			input
		);
	}

	/**
	 * Update several sidebar items
	 */
	async updateSidebarPreferences(
		input: Array<{ key: string; is_pinned?: boolean; sort_order?: number }>
	) {
		return this._workspacePreferencesService.updateSidebarPreferences(
			input
		);
	}
}
