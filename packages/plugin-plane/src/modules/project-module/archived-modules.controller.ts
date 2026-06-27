import { ApiOperation } from '@nestjs/swagger';
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param
} from '@nestjs/common';
import { ID } from '@ever-gauzy/plugin-integration-plane-models';
import { ProjectModuleService } from './project-module.service';

@Controller()
export class ArchivedModulesController {
	constructor(private readonly _projectModuleService: ProjectModuleService) {}

	/**
	 * @description List all archived modules for a project
	 * @param {ID} projectId - Project ID
	 * @returns Archived modules list
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'List Archived Modules' })
	@Get()
	async listArchivedModules(@Param('projectId') projectId: ID) {
		return this._projectModuleService.getArchivedModules(projectId);
	}

	/**
	 * @description Get a single archived module
	 * @param {ID} id - Module ID
	 * @param {ID} projectId - Project ID
	 * @returns Archived module detail
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Archived Module' })
	@Get(':id')
	async getArchivedModule(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID
	) {
		return this._projectModuleService.getArchivedModule(id, projectId);
	}
}
