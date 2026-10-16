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
import { WorkspacePreferencesService } from './workspace-preferences.service';

/**
 * ever-gauzy fork: an employee's workspace-wide preferences, stored in Gauzy (see WorkspacePreferencesService).
 */
@ApiTags('Workspace preferences routes')
@Controller()
export class WorkspacePreferencesController {
	constructor(
		private readonly _workspacePreferencesService: WorkspacePreferencesService
	) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: "Get the employee's workspace view and navigation properties"
	})
	@Get('user-properties')
	async getUserProperties() {
		return await this._workspacePreferencesService.getUserProperties();
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary:
			"Update the employee's workspace view and navigation properties"
	})
	@Patch('user-properties')
	async updateUserProperties(@Body() input: Record<string, any>) {
		return await this._workspacePreferencesService.updateUserProperties(
			input
		);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update a home page widget' })
	@Patch('home-preferences/:key')
	async updateHomePreference(
		@Param('key') key: string,
		@Body() input: Record<string, any>
	) {
		return await this._workspacePreferencesService.updateHomePreference(
			key,
			input
		);
	}
}
