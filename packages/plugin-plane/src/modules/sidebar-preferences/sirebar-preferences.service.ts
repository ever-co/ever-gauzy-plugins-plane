import { Injectable } from '@nestjs/common';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { DEFAULT_SIDBAR_PREFERENCES } from '../../config';

// TODO: Implement the sidebar preferences service

@Injectable()
export class SidebarPreferencesService extends ApiFetchService {
	/**
	 * Get the default sidebar preferences
	 * @returns The default sidebar preferences
	 */
	async getSidebarPreferences() {
		return DEFAULT_SIDBAR_PREFERENCES;
	}
}
