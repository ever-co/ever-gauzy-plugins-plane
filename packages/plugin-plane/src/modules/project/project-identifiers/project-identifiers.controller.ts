import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ProjectIdentifiersService } from './project-identifiers.service';

@ApiTags('Project Identifiers')
@Controller()
export class ProjectIdentifiersController {
	constructor(
		private readonly _projectIdentifierService: ProjectIdentifiersService,
	) {}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get all projects by code / identifier
	 * @param {string} identifier identifier for filtering
	 * @returns - A promise that resolves after getting projects
	 * @memberof ProjectIdentifiersService
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace projects' })
	@Get()
	async getProjects(@Query('name') identifier: string) {
		return await this._projectIdentifierService.getProjectsByCode(
			identifier,
		);
	}
}
