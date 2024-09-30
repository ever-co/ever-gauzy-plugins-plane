import { ApiOperation } from '@nestjs/swagger';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
} from '@nestjs/common';
import { ID, IModule } from '@plane-plugin/models';
import { ProjectModuleService } from './project-module.service';
import { CreateModuleDTO } from './dto';

@Controller()
export class ProjectModuleController {
	constructor(private readonly _projectModuleService: ProjectModuleService) {}

	/**
	 * @description - Create module
	 * @param {ICreateModuleInput} input - data for creating new module
	 * @returns - A promise that resolves after module created
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Project Module' })
	@Post()
	async createModule(
		@Body() input: CreateModuleDTO,
	): Promise<IModule | IModule[]> {
		return await this._projectModuleService.create(input);
	}

	/**
	 * @description - Get project modules
	 * @param {ID} projectId - The ID of the project for whom get modules
	 * @returns - A promise that resolves after got modules
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Project Modules' })
	@Get()
	async getWorkspaceProjectModules(@Param('projectId') projectId: ID) {
		return this._projectModuleService.getAllModulesByProject(projectId);
	}

	/**
	 * @description - Get project modules
	 * @param {ID} projectId - The ID of the project for whom get modules
	 * @returns - A promise that resolves after got modules
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Project Podules' })
	@Get(':id')
	async getWorkspaceProjectModule(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID,
	) {
		return this._projectModuleService.getModule(id, projectId);
	}

	/**
	 * @description Delete project module
	 * @param {ID} id - The project module to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof ProjectModuleController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete Project Module' })
	@Delete(':id')
	async deleteComment(@Param('id') id: ID) {
		return await this._projectModuleService.delete(id);
	}
}
