import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SidebarPreferencesService } from './sidebar-preferences.service';

@ApiTags('Sidebar preferences routes')
@Controller('sidebar-preferences')
export class SidebarPreferencesController {
	constructor(
		private readonly _sidebarPreferencesService: SidebarPreferencesService
	) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get the sidebar preferences' })
	@Get()
	async getSidebarPreferences() {
		return await this._sidebarPreferencesService.getSidebarPreferences();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update several sidebar items' })
	@Patch()
	async updateSidebarPreferences(
		@Body()
		input: Array<{ key: string; is_pinned?: boolean; sort_order?: number }>
	) {
		return await this._sidebarPreferencesService.updateSidebarPreferences(
			input
		);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update a sidebar item' })
	@Patch(':key')
	async updateSidebarPreference(
		@Param('key') key: string,
		@Body() input: { is_pinned?: boolean; sort_order?: number }
	) {
		return await this._sidebarPreferencesService.updateSidebarPreference(
			key,
			input
		);
	}
}
