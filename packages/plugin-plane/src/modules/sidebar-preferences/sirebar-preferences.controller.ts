import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SidebarPreferencesService } from './sirebar-preferences.service';

@ApiTags('Sidebar preferences routes')
@Controller('sidebar-preferences')
export class SidebarPreferencesController {
	constructor(
		private readonly _sidebarPreferencesService: SidebarPreferencesService
	) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get the default sidebar preferences' })
	@Get()
	async getSidebarPreferences() {
		return await this._sidebarPreferencesService.getSidebarPreferences();
	}
}
